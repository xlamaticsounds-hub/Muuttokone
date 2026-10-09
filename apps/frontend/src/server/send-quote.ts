'use server';

import { getServerSession } from 'next-auth';
import { LeadStatus } from '@prisma/client';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail, SMTP_NOT_CONFIGURED_MESSAGE } from '@/server/mailer';
import {
  getInventoryEntries,
  getWasteTypeLabels,
  getExtraServices,
  getServiceLabel,
  getPackageLabel,
  getStoredPrice,
  parseLeadFormData,
  partnerDiscountNote,
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

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true, discount: { select: { partner: true } } },
  });
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
    partnerDiscountNote: partnerDiscountNote(lead, lead.discountPartner ?? lead.discount?.partner ?? null, priceConfirmed === null),
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

  if (!isSmtpConfigured()) {
    return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true, discount: { select: { partner: true } } },
  });
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
    partnerDiscountNote: partnerDiscountNote(lead, lead.discountPartner ?? lead.discount?.partner ?? null, priceConfirmed === null),
  });

  const subjectPrice =
    priceConfirmed !== null
      ? ` — ${priceConfirmed} €`
      : priceLow !== null && priceHigh !== null
        ? ` — ${priceLow}–${priceHigh} €`
        : '';
  try {
    await sendMail({
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

  // Toteutunut muutto ei palaa tarjousvaiheeseen, vaikka tarjous lähetettäisiin uudelleen
  // (muuten se putoaisi kumppaniraportilta).
  if (lead.status !== LeadStatus.COMPLETED) {
    await prisma.lead.update({ where: { id: leadId }, data: { status: LeadStatus.PROPOSAL_SENT } });
  }

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
