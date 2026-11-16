'use server';

import { getOwnerSession } from '@/server/access';
import { setAppState } from '@/server/app-state';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail, SMTP_NOT_CONFIGURED_MESSAGE } from '@/server/mailer';
import { getGoogleRating, getReviewSettings } from '@/server/review-requests';
import { GOOGLE_RATING_KEY, ratingProblem, type GoogleRating } from '@/lib/google-rating';
import {
  REVIEW_SETTINGS_KEY,
  type ReviewSettings,
  isValidReviewUrl,
  renderReviewRequestHtml,
  renderReviewRequestText,
  reviewRequestSubject,
} from '@/lib/review-request';

type Result = { success: true; message?: string } | { success: false; message: string };

// Arvostelupyyntöjen asetukset (vain omistajat): käytössä/pois, Google-arvostelulinkit ja testiviesti.

export async function loadReviewSettings(): Promise<ReviewSettings | null> {
  if (!(await getOwnerSession())) return null;
  return getReviewSettings();
}

export async function saveReviewSettings(input: ReviewSettings): Promise<Result> {
  const session = await getOwnerSession();
  if (!session) return { success: false, message: 'Vain omistajat voivat muuttaa asetuksia.' };

  const googleReviewUrl = (input.googleReviewUrl ?? '').trim();
  const googleReviewUrlTampere = (input.googleReviewUrlTampere ?? '').trim();
  if (googleReviewUrl && !isValidReviewUrl(googleReviewUrl)) {
    return { success: false, message: 'Arvostelulinkin pitää olla Googlen https-osoite (esim. https://g.page/r/.../review).' };
  }
  if (googleReviewUrlTampere && !isValidReviewUrl(googleReviewUrlTampere)) {
    return { success: false, message: 'Tampereen arvostelulinkin pitää olla Googlen https-osoite.' };
  }
  const enabled = Boolean(input.enabled);
  if (enabled && !googleReviewUrl) return { success: false, message: 'Lisää arvostelulinkki ennen käyttöönottoa.' };

  const settings: ReviewSettings = { enabled, googleReviewUrl, googleReviewUrlTampere };
  await setAppState(REVIEW_SETTINGS_KEY, settings);
  await createLog({
    entityType: 'System',
    entityId: REVIEW_SETTINGS_KEY,
    action: 'settings.reviews_updated',
    message: enabled ? 'Arvostelupyynnöt otettu käyttöön' : 'Arvostelupyynnöt pois käytöstä',
    data: settings,
    actorId: session.user.email,
  });
  return { success: true };
}

/** Lähettää esimerkkiviestin kirjautuneelle omistajalle, jotta ulkoasun ja linkin voi tarkistaa. */
export async function sendTestReviewRequest(): Promise<Result> {
  const session = await getOwnerSession();
  if (!session) return { success: false, message: 'Vain omistajat voivat lähettää testiviestin.' };
  if (!isSmtpConfigured()) return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };
  const settings = await getReviewSettings();
  if (!settings.googleReviewUrl) return { success: false, message: 'Tallenna ensin arvostelulinkki.' };

  const firstName = session.actor.name?.split(' ')[0] ?? null;
  try {
    await sendMail({
      to: session.user.email,
      subject: `[TESTI] ${reviewRequestSubject()}`,
      text: renderReviewRequestText({ firstName, reviewUrl: settings.googleReviewUrl }),
      html: renderReviewRequestHtml({ firstName, reviewUrl: settings.googleReviewUrl, siteUrl: process.env.SITE_URL }),
    });
    return { success: true, message: `Testiviesti lähetetty osoitteeseen ${session.user.email}.` };
  } catch (error) {
    console.error('[review-actions] Testiviestin lähetys epäonnistui', error);
    return { success: false, message: 'Lähetys epäonnistui. Tarkista sähköpostiasetukset.' };
  }
}

/** Google-arvosana sivuston merkintään: luku hallinnan lomakkeelle (vain omistajat). */
export async function loadGoogleRatingSetting(): Promise<GoogleRating | null> {
  if (!(await getOwnerSession())) return null;
  return getGoogleRating();
}

export async function saveGoogleRating(input: GoogleRating): Promise<Result> {
  const session = await getOwnerSession();
  if (!session) return { success: false, message: 'Vain omistajat voivat muuttaa asetuksia.' };
  const value: GoogleRating = { rating: Math.round(Number(input.rating) * 10) / 10 };
  const problem = ratingProblem(value);
  if (problem) return { success: false, message: problem };
  await setAppState(GOOGLE_RATING_KEY, value);
  await createLog({
    entityType: 'System',
    entityId: GOOGLE_RATING_KEY,
    action: 'settings.google_rating_updated',
    message: `Arvosana sivustolla päivitetty: ${value.rating}`,
    data: value,
    actorId: session.user.email,
  });
  return { success: true };
}
