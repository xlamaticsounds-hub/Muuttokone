// Arvostelupyyntö asiakkaalle toteutuneen keikan jälkeen (puhtaat funktiot, testattavissa).
// Lähetys: server/review-requests.ts, ajastus .github/workflows/review-requests-cron.yaml (aamuisin).
import { isCompletedStatus } from '@/lib/lead-status';
import { helsinkiDayStart, toHelsinkiDateInput } from '@/lib/helsinki-time';

/** Asetukset AppState-taulussa (hallinta → Asetukset → Arvostelut). */
export const REVIEW_SETTINGS_KEY = 'reviews.settings';
export type ReviewSettings = {
  enabled: boolean;
  /** Google-yritysprofiilin "Pyydä arvosteluja" -linkki (esim. https://g.page/r/.../review). */
  googleReviewUrl: string;
  /** Tampereen oma profiili, jos sellainen on. Tyhjä = käytetään yllä olevaa. */
  googleReviewUrlTampere?: string;
};
/** Muuttokone.fi:n Google-yritysprofiilin arvostelulinkki (omistajalta 15.11.2026). */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/Ccxilhyyg5HeEBM/review';

// Oletukset, kun asetuksia ei ole tallennettu hallinnassa: profiilin linkki valmiina, mutta lähetys POIS päältä,
// kunnes omistaja on hyväksynyt viestin (16.11.2026). Kytketään päälle hallinnasta (Asetukset → Google-arvostelupyynnöt).
export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = { enabled: false, googleReviewUrl: GOOGLE_REVIEW_URL, googleReviewUrlTampere: '' };

export const REVIEW_REQUEST_LOG_ACTION = 'lead.review_requested';
/** Omistaja päätti, ettei keikalle lähetetä pyyntöä (esim. joukkomerkinnässä): automaattinen ajo ohittaa sen. */
export const REVIEW_SKIPPED_LOG_ACTION = 'lead.review_skipped';
/** Kuinka monta päivää taaksepäin toteutuneille lähetetään (ei vanhoille keikoille, kun ominaisuus otetaan käyttöön). */
export const REVIEW_LOOKBACK_DAYS = 3;

/** Hyväksyy vain Googlen arvostelulinkit (https), ettei asetuksiin päädy vahingossa muuta osoitetta. */
export function isValidReviewUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return false;
    return /(^|\.)g\.page$|(^|\.)google\.[a-z.]+$|^maps\.app\.goo\.gl$|^goo\.gl$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function reviewUrlForTeam(settings: ReviewSettings, teamId: string | null | undefined): string {
  if (teamId === 'tampere' && settings.googleReviewUrlTampere?.trim()) return settings.googleReviewUrlTampere.trim();
  return settings.googleReviewUrl.trim();
}

export type ReviewCandidateLead = {
  id: string;
  status: string;
  completedAt: Date | null;
  email: string | null;
};

/** Hakuikkuna: toteutunut ennen tämän päivän alkua (Helsingin aikaa) mutta enintään REVIEW_LOOKBACK_DAYS sitten. */
export function reviewWindow(now: Date): { from: Date; to: Date } {
  const to = helsinkiDayStart(toHelsinkiDateInput(now))!;
  const from = new Date(to.getTime() - REVIEW_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Keikat, joille pyyntö lähetetään: toteutunut (tehty, laskutettu tai maksettu) eilen tai sitä ennen
 * hakuikkunan sisällä, asiakkaalla on sähköposti eikä pyyntöä ole jo lähetetty.
 */
export function selectReviewCandidates<T extends ReviewCandidateLead>(leads: T[], alreadySent: Set<string>, now: Date): T[] {
  const { from, to } = reviewWindow(now);
  return leads.filter(
    (lead) =>
      isCompletedStatus(lead.status) &&
      lead.completedAt != null &&
      lead.completedAt >= from &&
      lead.completedAt < to &&
      !!lead.email?.includes('@') &&
      !alreadySent.has(lead.id),
  );
}

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function reviewRequestSubject(): string {
  return 'Kiitos muutosta! Kertoisitko kokemuksesi?';
}

export function renderReviewRequestText(params: { firstName: string | null; reviewUrl: string }): string {
  return [
    `Hei${params.firstName ? ` ${params.firstName}` : ''},`,
    '',
    'kiitos, että valitsit Muuttokoneen! Toivottavasti olet jo päässyt asettumaan uuteen kotiin.',
    '',
    'Arvostaisimme kovasti, jos kertoisit kokemuksesi Googlessa. Se vie minuutin, ja palautteesi auttaa muita valitsemaan muuttajan ja meitä tekemään työmme vielä paremmin:',
    params.reviewUrl,
    '',
    'Jos jokin ei mennyt niin kuin piti, vastaa suoraan tähän viestiin, niin hoidamme asian.',
    '',
    'Terveisin,',
    'Muuttokone.fi',
  ].join('\n');
}

/** Sähköpostin logo (pieni PNG, koska sähköpostiohjelmat eivät näytä webp:tä luotettavasti). */
export const EMAIL_LOGO_PATH = '/images/logo/logo-email.png';

export function renderReviewRequestHtml(params: { firstName: string | null; reviewUrl: string; siteUrl?: string }): string {
  const url = esc(params.reviewUrl);
  const siteUrl = (params.siteUrl || 'https://www.muuttokone.fi').replace(/\/$/, '');
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="margin:0 0 24px;">
      <a href="${esc(siteUrl)}" style="text-decoration:none;">
        <img src="${esc(siteUrl + EMAIL_LOGO_PATH)}" width="120" height="90" alt="Muuttokone.fi" style="display:block;border:0;outline:none;width:120px;height:auto;" />
      </a>
    </p>
    <p style="font-size:16px;margin:0 0 4px;">Hei${params.firstName ? ` ${esc(params.firstName)}` : ''},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
      kiitos, että valitsit Muuttokoneen! Toivottavasti olet jo päässyt asettumaan uuteen kotiin.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Arvostaisimme kovasti, jos kertoisit kokemuksesi Googlessa. Se vie minuutin, ja palautteesi auttaa muita
      valitsemaan muuttajan ja meitä tekemään työmme vielä paremmin.
    </p>
    <p style="margin:0 0 28px;text-align:center;">
      <a href="${url}" style="display:inline-block;background:#0a66ff;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px;">
        ★★★★★&nbsp; Kirjoita arvostelu
      </a>
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 24px;">
      Jos jokin ei mennyt niin kuin piti, vastaa suoraan tähän viestiin, niin hoidamme asian.
    </p>
    <p style="font-size:15px;margin:0;">Terveisin,<br/><strong>Muuttokone.fi</strong></p>
  </div>`;
}
