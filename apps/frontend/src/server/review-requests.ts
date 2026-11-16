import { prisma } from '@/server/db';
import { getAppState } from '@/server/app-state';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail } from '@/server/mailer';
import { COMPLETED_STATUSES } from '@/lib/lead-status';
import { DEFAULT_GOOGLE_RATING, GOOGLE_RATING_KEY, type GoogleRating } from '@/lib/google-rating';
import {
  DEFAULT_REVIEW_SETTINGS,
  REVIEW_REQUEST_LOG_ACTION,
  REVIEW_SETTINGS_KEY,
  type ReviewSettings,
  renderReviewRequestHtml,
  renderReviewRequestText,
  reviewRequestSubject,
  reviewUrlForTeam,
  reviewWindow,
  selectReviewCandidates,
} from '@/lib/review-request';

export async function getReviewSettings(): Promise<ReviewSettings> {
  const saved = await getAppState<Partial<ReviewSettings>>(REVIEW_SETTINGS_KEY);
  return { ...DEFAULT_REVIEW_SETTINGS, ...(saved ?? {}) };
}

export type ReviewRunResult = { skipped?: string; sent: number; failed: number; candidates: number };

/**
 * Lähettää arvostelupyynnöt eilen (tai enintään muutama päivä sitten) toteutuneiden keikkojen
 * asiakkaille. Kukin keikka saa pyynnön vain kerran (lokimerkintä lead.review_requested).
 */
export async function sendDueReviewRequests(now = new Date()): Promise<ReviewRunResult> {
  const settings = await getReviewSettings();
  if (!settings.enabled) return { skipped: 'Arvostelupyynnöt eivät ole käytössä.', sent: 0, failed: 0, candidates: 0 };
  if (!settings.googleReviewUrl.trim()) return { skipped: 'Google-arvostelulinkkiä ei ole asetettu.', sent: 0, failed: 0, candidates: 0 };
  if (!isSmtpConfigured()) return { skipped: 'Sähköpostia (SMTP) ei ole määritetty.', sent: 0, failed: 0, candidates: 0 };

  const { from, to } = reviewWindow(now);
  const leads = await prisma.lead.findMany({
    where: { status: { in: COMPLETED_STATUSES }, completedAt: { gte: from, lt: to } },
    select: { id: true, status: true, completedAt: true, teamId: true, contact: { select: { email: true, firstName: true } } },
  });
  const ids = leads.map((lead) => lead.id);
  const sentLogs = ids.length
    ? await prisma.log.findMany({ where: { action: REVIEW_REQUEST_LOG_ACTION, entityType: 'Lead', entityId: { in: ids } }, select: { entityId: true } })
    : [];
  const alreadySent = new Set(sentLogs.map((log) => log.entityId));

  const candidates = selectReviewCandidates(
    leads.map((lead) => ({ ...lead, email: lead.contact?.email?.trim() ?? null })),
    alreadySent,
    now,
  );

  let sent = 0;
  let failed = 0;
  for (const lead of candidates) {
    const reviewUrl = reviewUrlForTeam(settings, lead.teamId);
    const firstName = lead.contact?.firstName?.trim() || null;
    try {
      await sendMail({
        to: lead.email!,
        subject: reviewRequestSubject(),
        text: renderReviewRequestText({ firstName, reviewUrl }),
        html: renderReviewRequestHtml({ firstName, reviewUrl, siteUrl: process.env.SITE_URL }),
      });
      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: REVIEW_REQUEST_LOG_ACTION,
        message: `Arvostelupyyntö lähetetty osoitteeseen ${lead.email}`,
        data: { reviewUrl },
      });
      sent++;
    } catch (error) {
      console.error('[review-requests] Lähetys epäonnistui', lead.id, error);
      failed++;
    }
  }
  return { sent, failed, candidates: candidates.length };
}

/** Arvosana sivuston merkintään (hallinnasta tallennettu tai lähtöarvo). */
export async function getGoogleRating(): Promise<GoogleRating> {
  const saved = await getAppState<Partial<GoogleRating>>(GOOGLE_RATING_KEY);
  const rating = Number(saved?.rating);
  return Number.isFinite(rating) ? { rating } : DEFAULT_GOOGLE_RATING;
}
