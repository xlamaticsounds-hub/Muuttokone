'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail, SMTP_NOT_CONFIGURED_MESSAGE } from '@/server/mailer';
import { parseLeadFormData } from '@/server/lead-format';
import { renderOfferPdf } from '@/server/pdf/offer-pdf';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { confirmedPriceText } from '@/lib/external-lead';
import { isValidEmail, normalizeOffer, offerFileName, offerNumber, offerTotals, parseStoredOffer } from '@/lib/offer';
import { offerEmailSubject, renderOfferEmailHtml } from '@/lib/offer-email';

// Yleisen tarjouksen / tilausvahvistuksen tallennus ja lähetys sekä keikan kuvaliitteiden poisto.
// Palauttavat aina tuloksen (ei heitä): Next.js piilottaa server actionin virheviestit tuotannossa.

type ActionResult<T = object> = ({ success: true } & T) | { success: false; message: string };

const noSession = { success: false as const, message: 'Kirjaudu sisään.' };

function refreshLead(leadId: string) {
  revalidatePath(`/hallinta/liidit/${leadId}`);
  revalidatePath(`/hallinta/liidit/${leadId}/tarjous`);
}

/** Tallentaa dokumentin liidille. Hintarivien summa päivitetään myös liidin vahvistetuksi hinnaksi. */
export async function saveOffer(leadId: string, input: unknown): Promise<ActionResult<{ number: string; total: number }>> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, formData: true } });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    const result = normalizeOffer(input, toHelsinkiDateInput(new Date()));
    if (!result.ok) return { success: false, message: result.message };

    const total = offerTotals(result.value.lines).gross;
    const formData = {
      ...parseLeadFormData(lead.formData),
      offer: result.value,
      ...(total > 0 ? { confirmedPrice: confirmedPriceText(total) } : {}),
    };
    await prisma.lead.update({ where: { id: leadId }, data: { formData: formData as never } });
    refreshLead(leadId);
    return { success: true, number: offerNumber(leadId, result.value.issuedOn), total };
  } catch (error) {
    console.error('[offer-actions] saveOffer epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/** Lähettää tallennetun dokumentin PDF-liitteenä. Tarjous siirtää uuden liidin tilaan Tarjous lähetetty. */
export async function sendOfferEmail(leadId: string, params: { to: string; message: string | null }): Promise<ActionResult<{ sentTo: string }>> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  if (!isSmtpConfigured()) return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };
  const to = (params.to ?? '').trim();
  if (!to || !isValidEmail(to)) return { success: false, message: 'Anna kelvollinen sähköpostiosoite.' };

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    const pfd = parseLeadFormData(lead.formData);
    const offer = parseStoredOffer(pfd.offer, toHelsinkiDateInput(new Date()));
    if (!offer) return { success: false, message: 'Tallenna dokumentti ennen lähetystä.' };

    const number = offerNumber(leadId, offer.issuedOn);
    const total = offerTotals(offer.lines).gross;
    const pdf = await renderOfferPdf(offer, number);
    const message = params.message?.trim().slice(0, 2000) || null;

    try {
      await sendMail({
        to,
        subject: offerEmailSubject(offer, number),
        html: renderOfferEmailHtml({ offer, number, total, message }),
        attachments: [{ filename: offerFileName(offer.type, number), content: pdf, contentType: 'application/pdf' }],
      });
    } catch (err) {
      console.error('[offer-actions] SMTP-lähetys epäonnistui', err);
      return { success: false, message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}` };
    }

    const sentAt = new Date().toISOString();
    const moveToProposal = offer.type === 'tarjous' && ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED'].includes(lead.status);
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(moveToProposal ? { status: 'PROPOSAL_SENT' as const } : {}),
        formData: { ...pfd, offerSent: { at: sentAt, to, type: offer.type, number } } as never,
      },
    });
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'lead.offer_sent',
      message: `${offer.type === 'vahvistus' ? 'Tilausvahvistus' : 'Tarjous'} ${number} lähetetty osoitteeseen ${to}`,
      data: { type: offer.type, number, to, total },
      actorId: session.user?.email ?? null,
    }).catch(() => {});
    refreshLead(leadId);
    return { success: true, sentTo: to };
  } catch (error) {
    console.error('[offer-actions] sendOfferEmail epäonnistui', error);
    return { success: false, message: 'Lähetys epäonnistui. Yritä uudelleen.' };
  }
}

export async function deleteLeadAttachment(id: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  try {
    const attachment = await prisma.leadAttachment.findUnique({ where: { id }, select: { id: true, leadId: true } });
    if (!attachment) return { success: true }; // jo poistettu
    await prisma.leadAttachment.delete({ where: { id } });
    await createLog({
      entityType: 'Lead',
      entityId: attachment.leadId,
      action: 'lead.attachment_deleted',
      message: 'Keskustelun kuva poistettu',
      actorId: session.user?.email ?? null,
    }).catch(() => {});
    revalidatePath(`/hallinta/liidit/${attachment.leadId}`);
    return { success: true };
  } catch (error) {
    console.error('[offer-actions] deleteLeadAttachment epäonnistui', error);
    return { success: false, message: 'Poisto epäonnistui. Yritä uudelleen.' };
  }
}
