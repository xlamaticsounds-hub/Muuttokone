'use server';

import { revalidatePath } from 'next/cache';
import { getOwnerSession } from '@/server/access';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { defaultFinalPrice } from '@/server/lead-format';
import { isSmtpConfigured, sendMail } from '@/server/mailer';
import { getReviewSettings } from '@/server/review-requests';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import {
  REVIEW_REQUEST_LOG_ACTION,
  REVIEW_SKIPPED_LOG_ACTION,
  renderReviewRequestHtml,
  renderReviewRequestText,
  reviewRequestSubject,
  reviewUrlForTeam,
} from '@/lib/review-request';

// Menneiden vahvistettujen keikkojen joukkomerkintä toteutuneiksi (vain omistajat, hallinta → Keikat).
// Omistajan päätökset 16.11.2026: vain tila WON (vahvistettu), toteutumispäiväksi keikan päivä (raportit ja
// kumppanipalkkiot osuvat oikeaan kuukauteen), arvostelupyyntö vain erikseen rastitetuille.

/** Arvostelupyyntöä ehdotetaan valmiiksi, kun keikka oli enintään näin monta päivää sitten. */
const REVIEW_SUGGEST_DAYS = 7;
const MAX_ITEMS = 500;

export type PastJob = {
  id: string;
  customer: string;
  /** Keikan päivä, YYYY-MM-DD. */
  date: string;
  address: string;
  price: number | null;
  hasEmail: boolean;
  suggestReview: boolean;
};

/** Suomen päivä UTC-keskiyönä (requestedDate tallennetaan näin, ks. hallinta/keikat). */
const todayUtcMidnight = (now: Date) => new Date(`${toHelsinkiDateInput(now)}T00:00:00Z`);

function customerName(contact: { firstName: string | null; lastName: string | null; companyName: string | null; email: string | null } | null): string {
  if (!contact) return '(ei asiakasta)';
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  return name || contact.companyName || contact.email || '(nimetön)';
}

export async function listPastConfirmedJobs(): Promise<{ success: true; jobs: PastJob[] } | { success: false; message: string }> {
  if (!(await getOwnerSession())) return { success: false, message: 'Vain omistajat voivat merkitä keikkoja joukolla.' };
  const today = todayUtcMidnight(new Date());
  const suggestFrom = new Date(today.getTime() - REVIEW_SUGGEST_DAYS * 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: { status: 'WON', requestedDate: { lt: today } },
    include: { contact: true },
    orderBy: { requestedDate: 'desc' },
    take: MAX_ITEMS,
  });
  const jobs = leads
    // Varmistus koodissa (paikallinen mock-kanta ei suodata kaikkia ehtoja)
    .filter((lead) => lead.status === 'WON' && lead.requestedDate && lead.requestedDate < today)
    .map((lead) => {
      const email = lead.contact?.email?.trim() ?? '';
      return {
        id: lead.id,
        customer: customerName(lead.contact),
        date: lead.requestedDate!.toISOString().slice(0, 10),
        address: lead.fromAddress ?? '',
        price: defaultFinalPrice(lead),
        hasEmail: email.includes('@'),
        suggestReview: email.includes('@') && lead.requestedDate! >= suggestFrom,
      };
    });
  return { success: true, jobs };
}

export type CompletePastJobsResult =
  | { success: true; completed: number; reviewsSent: number; reviewsFailed: number; skipped: number }
  | { success: false; message: string };

export async function completePastJobs(items: { leadId: string; sendReview: boolean }[]): Promise<CompletePastJobsResult> {
  const session = await getOwnerSession();
  if (!session) return { success: false, message: 'Vain omistajat voivat merkitä keikkoja joukolla.' };
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: 'Valitse ainakin yksi keikka.' };
  if (items.length > MAX_ITEMS) return { success: false, message: `Enintään ${MAX_ITEMS} keikkaa kerralla.` };

  const today = todayUtcMidnight(new Date());
  const settings = await getReviewSettings();
  const canSendReviews = isSmtpConfigured() && !!settings.googleReviewUrl.trim();
  const { syncCalendarWithLeadStatus } = await import('@/server/google-calendar');

  let completed = 0;
  let reviewsSent = 0;
  let reviewsFailed = 0;
  let skipped = 0;

  for (const item of items) {
    if (typeof item?.leadId !== 'string') continue;
    const lead = await prisma.lead.findUnique({ where: { id: item.leadId }, include: { contact: true } });
    // Vain yhä vahvistettu ja mennyt keikka (tila on voinut muuttua listan avaamisen jälkeen)
    if (!lead || lead.status !== 'WON' || !lead.requestedDate || lead.requestedDate >= today) {
      skipped++;
      continue;
    }
    const finalPrice = defaultFinalPrice(lead);
    if (finalPrice == null || finalPrice <= 0) {
      skipped++;
      continue;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'COMPLETED', completedAt: lead.requestedDate, finalPrice },
    });
    const date = lead.requestedDate.toISOString().slice(0, 10);
    await createLog({
      entityType: 'Lead',
      entityId: lead.id,
      action: 'lead.completed',
      message: `Merkitty toteutuneeksi joukkomerkinnällä (keikan päivä ${date}), lopullinen hinta ${finalPrice} €`,
      data: { finalPrice, previousStatus: lead.status, completedAt: lead.requestedDate.toISOString(), bulk: true },
      actorId: session.user.email,
    });
    completed++;

    try {
      await syncCalendarWithLeadStatus(lead, 'COMPLETED');
    } catch (error) {
      console.warn('[bulk-completion] Kalenterin päivitys epäonnistui', lead.id, error);
    }

    const email = lead.contact?.email?.trim();
    if (item.sendReview && email?.includes('@') && canSendReviews) {
      const reviewUrl = reviewUrlForTeam(settings, lead.teamId);
      const firstName = lead.contact?.firstName?.trim() || null;
      try {
        await sendMail({
          to: email,
          subject: reviewRequestSubject(),
          text: renderReviewRequestText({ firstName, reviewUrl }),
          html: renderReviewRequestHtml({ firstName, reviewUrl, siteUrl: process.env.SITE_URL }),
        });
        await createLog({
          entityType: 'Lead',
          entityId: lead.id,
          action: REVIEW_REQUEST_LOG_ACTION,
          message: `Arvostelupyyntö lähetetty osoitteeseen ${email} (joukkomerkintä)`,
          data: { reviewUrl },
          actorId: session.user.email,
        });
        reviewsSent++;
      } catch (error) {
        console.error('[bulk-completion] Arvostelupyynnön lähetys epäonnistui', lead.id, error);
        reviewsFailed++;
      }
    } else {
      // Ei pyyntöä: merkintä estää myös automaattisen ajon lähettämästä sitä myöhemmin
      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: REVIEW_SKIPPED_LOG_ACTION,
        message: 'Arvostelupyyntöä ei lähetetä (joukkomerkintä)',
        actorId: session.user.email,
      });
    }
  }

  revalidatePath('/hallinta/keikat');
  return { success: true, completed, reviewsSent, reviewsFailed, skipped };
}
