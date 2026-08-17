'use server';

import { getServerSession } from 'next-auth';
import { LeadStatus } from '@prisma/client';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import {
  getInventoryEntries,
  getWasteTypeLabels,
  getExtraServices,
  getServiceLabel,
  getPackageLabel,
  getStoredPrice,
  parseLeadFormData,
} from '@/server/lead-format';
import { renderQuoteEmailHtml, type QuoteEmailParams } from '@/lib/quote-email';

export type SendQuoteResult = { success: true; sentTo: string } | { success: false; message: string };

// Lataa liidin tiedot esikatselua varten (ei lähetä mitään) — sama data jota
// sendQuoteEmailInner käyttää oikeaan lähetykseen, jotta esikatselu vastaa aina
// täsmälleen sitä mitä asiakas oikeasti saisi.
export async function getQuoteEmailPreviewData(
  leadId: string,
): Promise<{ contactEmail: string | null } & Omit<QuoteEmailParams, 'customMessage'>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    throw new Error('Liidiä ei löytynyt.');
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: priceConfirmed, exact: priceExact, low: priceLow, high: priceHigh } = getStoredPrice(pfd);

  return {
    contactEmail: lead.contact.email,
    contactName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' '),
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    requestedDate: lead.requestedDate,
    serviceLabel: getServiceLabel(pfd) ?? 'Muutto',
    packageLabel: getPackageLabel(pfd),
    priceConfirmed,
    priceLow,
    priceHigh,
    priceExact,
    items: getInventoryEntries(pfd),
    wasteTypes: getWasteTypeLabels(pfd),
    extras: getExtraServices(pfd),
  };
}

/**
 * Lähettää tarjouksen liidin yhteystiedon sähköpostiin ja merkitsee liidin tilaan
 * PROPOSAL_SENT. Kutsutaan vasta kun ihminen on itse tarkistanut liidin hallintapaneelista
 * ja painanut "Lähetä tarjous" — ei koskaan automaattisesti varauksen yhteydessä.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia) — Next.js piilottaa Server Actionin
 * throw-virheiden viestin tuotannossa turvallisuussyistä ("An error occurred in the
 * Server Components render..."), jolloin käyttäjä ei koskaan näe mitä oikeasti meni
 * pieleen. Oikea virhe kirjataan aina palvelimen lokiin (console.error) debuggausta varten.
 */
export async function sendQuoteEmail(leadId: string, customMessage: string | null = null): Promise<SendQuoteResult> {
  try {
    return await sendQuoteEmailInner(leadId, customMessage);
  } catch (err) {
    // Viimeinen turvaverkko: mikä tahansa odottamaton virhe (esim. tietokantayhteys poikki)
    // kirjataan lokiin mutta EI heitetä eteenpäin — throw täältä näkyisi asiakkaalle vain
    // Next.js:n yleisenä "An error occurred in the Server Components render" -viestinä.
    console.error('sendQuoteEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe tarjouksen lähetyksessä.',
    };
  }
}

async function sendQuoteEmailInner(leadId: string, customMessage: string | null): Promise<SendQuoteResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi tarjouksen.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    return { success: false, message: 'Liidiä ei löytynyt.' };
  }
  if (!lead.contact.email) {
    return { success: false, message: 'Tällä liidillä ei ole sähköpostiosoitetta — ei voida lähettää tarjousta sähköpostitse.' };
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: priceConfirmed, exact: priceExact, low: priceLow, high: priceHigh } = getStoredPrice(pfd);
  const items = getInventoryEntries(pfd);
  const wasteTypes = getWasteTypeLabels(pfd);
  const extras = getExtraServices(pfd);
  const serviceLabel = getServiceLabel(pfd) ?? 'Muutto';
  const packageLabel = getPackageLabel(pfd);
  const contactName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ');

  const html = renderQuoteEmailHtml({
    contactName,
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    requestedDate: lead.requestedDate,
    serviceLabel,
    packageLabel,
    priceConfirmed,
    priceLow,
    priceHigh,
    priceExact,
    items,
    wasteTypes,
    extras,
    customMessage,
  });

  const subjectPrice =
    priceConfirmed !== null
      ? ` — ${priceConfirmed} €`
      : priceLow !== null && priceHigh !== null
        ? ` — ${priceLow}–${priceHigh} €`
        : '';
  const senderName = process.env.QUOTE_EMAIL_FROM_NAME || 'Muuttokone.fi';

  // Ladataan nodemailer vasta täällä (ei moduulin huipulla) jotta puuttuvat SMTP-asetukset
  // eivät kaada koko sovellusta buildissa/importissa — vain tätä toimintoa kutsuttaessa.
  // Lähetetään suoraan tarjous@muuttokone.fi -postilaatikon kautta (Zoner SMTP), ei kolmannen
  // osapuolen palvelun kautta — ei vaadi erillistä domain-vahvistusta koska osoite on jo oma.
  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${process.env.SMTP_USER}>`,
      to: lead.contact.email,
      subject: `Tarjouksesi Muuttokone.fi:ltä${subjectPrice}`,
      html,
    });
  } catch (err) {
    console.error('sendQuoteEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await prisma.lead.update({ where: { id: leadId }, data: { status: LeadStatus.PROPOSAL_SENT } });

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.quote_sent',
    message: `Tarjous lähetetty sähköpostitse osoitteeseen ${lead.contact.email}`,
    data: { email: lead.contact.email, priceConfirmed, priceLow, priceHigh, priceExact },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: lead.contact.email };
}
