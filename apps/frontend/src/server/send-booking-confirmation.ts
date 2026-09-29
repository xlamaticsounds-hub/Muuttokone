'use server';

import { getServerSession } from 'next-auth';
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
} from '@/server/lead-format';
import { renderBookingConfirmationHtml, bookingConfirmationSubject } from '@/lib/booking-confirmation-email';

export type SendBookingConfirmationResult = { success: true; sentTo: string } | { success: false; message: string };

/**
 * Lähettää varausvahvistuksen liidin yhteystiedon sähköpostiin. Kutsutaan käsin liidin
 * sivulta esikatselun kautta (BookingConfirmationPreviewModal) sen jälkeen kun
 * varaus on sovittu asiakkaan kanssa — ei koskaan automaattisesti.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia), samasta syystä kuin send-quote.ts:ssä.
 */
export async function sendBookingConfirmationEmail(
  leadId: string,
  customMessage: string | null = null,
): Promise<SendBookingConfirmationResult> {
  try {
    return await sendBookingConfirmationEmailInner(leadId, customMessage);
  } catch (err) {
    console.error('sendBookingConfirmationEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe varausvahvistuksen lähetyksessä.',
    };
  }
}

async function sendBookingConfirmationEmailInner(
  leadId: string,
  customMessage: string | null,
): Promise<SendBookingConfirmationResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi varausvahvistuksen.' };
  }

  if (!isSmtpConfigured()) {
    return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    return { success: false, message: 'Liidiä ei löytynyt.' };
  }
  if (!lead.contact.email) {
    return { success: false, message: 'Tällä liidillä ei ole sähköpostiosoitetta — ei voida lähettää varausvahvistusta sähköpostitse.' };
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: priceConfirmed, exact: priceExact, low: priceLow, high: priceHigh } = getStoredPrice(pfd);
  const items = getInventoryEntries(pfd);
  const wasteTypes = getWasteTypeLabels(pfd);
  const extras = getExtraServices(pfd);
  const serviceLabel = getServiceLabel(pfd) ?? 'Muutto';
  const packageLabel = getPackageLabel(pfd);
  const contactName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ');

  const html = renderBookingConfirmationHtml({
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

  try {
    await sendMail({
      to: lead.contact.email,
      subject: bookingConfirmationSubject(lead.requestedDate),
      html,
    });
  } catch (err) {
    console.error('sendBookingConfirmationEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.booking_confirmation_sent',
    message: `Varausvahvistus lähetetty sähköpostitse osoitteeseen ${lead.contact.email}`,
    data: { email: lead.contact.email, priceConfirmed, priceLow, priceHigh, priceExact },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: lead.contact.email };
}
