import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { upsertContactByEmail } from '@/server/repo/contacts';
import { HELSINKI_TZ, toHelsinkiDateInput } from '@/lib/helsinki-time';
import { formatIsoDateFi, offerTotals } from '@/lib/offer';
import {
  EXTERNAL_SOURCE_IDS,
  confirmedPriceText,
  externalSourceLabel,
  leadSourceFor,
  normalizeExtraction,
  type ExternalLeadInput,
  type ExtractedLead,
} from '@/lib/external-lead';
import {
  MAX_ATTACHMENTS_PER_LEAD,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_REQUEST,
  safeImageName,
  sniffImageType,
  type SniffedImageType,
} from '@/lib/image-sniff';

// Muualta tulleen keikan kirjaus: tekoäly lukee keskustelun kuvat ja muistiinpanot, ihminen
// tarkistaa lomakkeen, ja keikka luodaan liidiksi kuvineen ja muistiinpanoineen. Reitit:
// /api/hallinta/keikka-muualta (+ /lue) ja /api/hallinta/liidit/[id]/liitteet.

export type UploadedImage = { name: string; mimeType: SniffedImageType; data: Uint8Array<ArrayBuffer> };

type Result<T> = ({ ok: true } & T) | { ok: false; message: string };

/** Lomakkeen kuvat tarkistettuina: koko, määrä ja tyyppi tiedoston sisällöstä. */
export async function readImagesFromForm(form: FormData, field = 'images'): Promise<Result<{ images: UploadedImage[] }>> {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES_PER_REQUEST) return { ok: false, message: `Enintään ${MAX_IMAGES_PER_REQUEST} kuvaa kerralla.` };
  const images: UploadedImage[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: `Kuva ${file.name} on liian suuri (enintään 5 Mt).` };
    const data = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(data);
    if (!type) return { ok: false, message: `${file.name} ei ole JPEG-, PNG- tai WebP-kuva.` };
    images.push({ name: safeImageName(file.name, type), mimeType: type, data });
  }
  return { ok: true, images };
}

// ---------- Tekoäly ----------

const EXTRACT_MODEL = 'gemini-flash-latest';

export const isAiConfigured = () => Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

const ExtractionSchema = z.object({
  customerName: z.string().nullable().describe('Asiakkaan koko nimi'),
  phone: z.string().nullable().describe('Asiakkaan puhelinnumero'),
  email: z.string().nullable().describe('Asiakkaan sähköpostiosoite'),
  fromAddress: z.string().nullable().describe('Lähtöosoite: katu, numero, rappu ja asunto, postinumero ja kaupunki sellaisina kuin ne kerrotaan'),
  toAddress: z.string().nullable().describe('Kohdeosoite samassa muodossa'),
  date: z.string().nullable().describe('Keikan päivämäärä muodossa YYYY-MM-DD'),
  time: z.string().nullable().describe('Kellonaika tai aikaikkuna, esim. "klo 10" tai "aamupäivä"'),
  description: z
    .string()
    .nullable()
    .describe('1-3 lauseen kuvaus palvelusta asiakkaalle: mitä tehdään, kerrokset ja hissi, henkilöt ja auto jos sovittu. Ei tavaraluetteloa eikä hintaa.'),
  priceKind: z.enum(['fixed', 'hourly', 'unknown']).describe('fixed = kiinteä kokonaishinta tarjottu tai sovittu, hourly = tuntihinta, unknown = hintaa ei mainita'),
  priceAmount: z.number().nullable().describe('Kiinteä kokonaishinta euroina'),
  hourlyRate: z.number().nullable().describe('Tuntihinta euroina'),
  minHours: z.number().nullable().describe('Vähimmäisveloitus tunteina'),
  crewSize: z.number().nullable().describe('Muuttajien määrä'),
  agreed: z.boolean().describe('true vain jos asiakas on selvästi hyväksynyt tai vahvistanut keikan ja hinnan'),
  source: z
    .enum(EXTERNAL_SOURCE_IDS)
    .nullable()
    .describe('Kanava: puhelu, whatsapp (myös tekstiviesti ja Messenger), sahkoposti, muuttomaailma, some (Facebook/Instagram), suositus, muu'),
  summary: z.string().describe('2-4 lauseen sisäinen yhteenveto keskustelusta suomeksi'),
  uncertainties: z.array(z.string()).describe('Puuttuvat tai epävarmat tiedot, jotka pitää tarkistaa ennen tarjousta (suomeksi)'),
});

const SYSTEM_PROMPT =
  'Olet Muuttokone.fi-muuttofirman avustaja. Saat kuvakaappauksia ja/tai muistiinpanoja keskustelusta asiakkaan kanssa ' +
  '(WhatsApp, tekstiviesti, Messenger, sähköposti, Muuttomaailma tai puhelu). Poimi tiedot keikan kirjaamista ja tarjousta varten. ' +
  'Säännöt: Älä keksi mitään. Jos tietoa ei ole, palauta null. Keskustelussa voi olla myös Muuttokoneen omia viestejä: hinta on se, ' +
  'jonka Muuttokone tarjosi tai joka sovittiin. Tulkitse suhteelliset päivät (esim. "ensi lauantaina") annetun päivämäärän mukaan ja ' +
  'mainitse tulkinta uncertainties-listassa. Jos vuotta ei mainita, valitse lähin tuleva päivä. Kirjoita kuvaus asiakkaalle näytettäväksi ' +
  'asiallisella sävyllä.';

/** Lukee keskustelun kuvat ja muistiinpanot. Heittää virheen, jos tekoälykutsu epäonnistuu. */
export async function extractLeadFromConversation(text: string, images: UploadedImage[], now = new Date()): Promise<ExtractedLead> {
  const todayIso = toHelsinkiDateInput(now);
  const weekday = new Intl.DateTimeFormat('fi-FI', { timeZone: HELSINKI_TZ, weekday: 'long' }).format(now);
  const intro =
    `Tänään on ${weekday} ${formatIsoDateFi(todayIso)} (${todayIso}).\n\n` +
    `Muistiinpanot:\n${text.trim() || '(ei muistiinpanoja)'}\n\n` +
    (images.length > 0 ? `Keskustelun kuvakaappaukset (${images.length}) ovat liitteenä.` : 'Ei kuvakaappauksia.');

  const { object } = await generateObject({
    model: google(EXTRACT_MODEL),
    schema: ExtractionSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: intro }, ...images.map((img) => ({ type: 'image' as const, image: img.data, mediaType: img.mimeType }))],
      },
    ],
  });
  return normalizeExtraction(object, todayIso);
}

// ---------- Tallennus ----------

/** Tallentaa kuvat liidille. Tarkistaa liidikohtaisen enimmäismäärän. */
export async function saveLeadAttachments(leadId: string, images: UploadedImage[], actor: string | null): Promise<Result<{ saved: number }>> {
  if (images.length === 0) return { ok: true, saved: 0 };
  const existing = await prisma.leadAttachment.count({ where: { leadId } });
  if (existing + images.length > MAX_ATTACHMENTS_PER_LEAD) {
    return { ok: false, message: `Keikalla voi olla enintään ${MAX_ATTACHMENTS_PER_LEAD} kuvaa (nyt ${existing}).` };
  }
  for (const img of images) {
    await prisma.leadAttachment.create({
      data: { leadId, name: img.name, mimeType: img.mimeType, size: img.data.byteLength, data: img.data, createdBy: actor },
    });
  }
  return { ok: true, saved: images.length };
}

/**
 * Luo muualta tulleen keikan: yhteystieto (olemassa oleva samalla sähköpostilla päivitetään),
 * liidi tarjousdokumentteineen, keskustelun muistiinpano ja kuvat. Vahvistetulle keikalle, jolla
 * on päivä, luodaan kalenterimerkintä samalla tavalla kuin tilaa vaihdettaessa.
 */
export async function createExternalLead(
  input: ExternalLeadInput,
  images: UploadedImage[],
  actor: string | null,
): Promise<{ leadId: string; attachmentError: string | null }> {
  const contactInput: Parameters<typeof upsertContactByEmail>[0] = { email: input.email };
  // Vain annetut kentät: olemassa olevan yhteystiedon tietoja ei tyhjennetä
  if (input.phone) contactInput.phone = input.phone;
  if (input.firstName) contactInput.firstName = input.firstName;
  if (input.lastName) contactInput.lastName = input.lastName;
  const contact = await upsertContactByEmail(contactInput);

  const sourceLabel = externalSourceLabel(input.source) ?? 'Muu';
  const origin = [sourceLabel, input.sourceDetail].filter(Boolean).join(', ');
  const total = offerTotals(input.offer.lines).gross;
  const formData: Prisma.InputJsonObject = {
    external: { source: input.source, sourceLabel, detail: input.sourceDetail, createdAt: new Date().toISOString(), createdBy: actor },
    ...(input.time ? { preferredTime: input.time } : {}),
    ...(total > 0 ? { confirmedPrice: confirmedPriceText(total) } : {}),
    offer: input.offer as unknown as Prisma.InputJsonObject,
  };

  const lead = await prisma.lead.create({
    data: {
      contact: { connect: { id: contact.id } },
      status: input.status,
      source: leadSourceFor(input.source),
      requestedDate: input.date ? new Date(`${input.date}T00:00:00Z`) : null,
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      notes: [`Keikka muualta (${origin}).`, input.summary].filter(Boolean).join('\n\n'),
      formData,
    },
  });

  if (input.conversationNotes) {
    await prisma.note.create({
      data: {
        title: `Keskustelu: ${sourceLabel}`,
        body: input.conversationNotes,
        category: 'asiakas',
        leadId: lead.id,
        pinned: false,
        archived: false,
        createdBy: actor,
      },
    });
  }

  let attachmentError: string | null = null;
  try {
    const saved = await saveLeadAttachments(lead.id, images, actor);
    if (!saved.ok) attachmentError = saved.message;
  } catch (error) {
    console.error('[external-lead] kuvien tallennus epäonnistui', error);
    attachmentError = 'Kuvien tallennus epäonnistui. Lisää ne uudelleen liidin sivulta.';
  }

  if (input.status === 'WON' && input.date) {
    const { recreateConfirmedLeadEvent } = await import('@/server/google-calendar');
    await recreateConfirmedLeadEvent(lead.id); // ei heitä
  }

  await createLog({
    entityType: 'Lead',
    entityId: lead.id,
    action: 'lead.created_external',
    message: `Keikka kirjattu muualta (${origin})`,
    data: { source: input.source, status: input.status, images: images.length, total },
    actorId: actor,
  }).catch(() => {});

  return { leadId: lead.id, attachmentError };
}
