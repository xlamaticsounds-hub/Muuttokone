import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVIEW_SETTINGS,
  isValidReviewUrl,
  renderReviewRequestHtml,
  renderReviewRequestText,
  reviewUrlForTeam,
  reviewWindow,
  selectReviewCandidates,
} from './review-request';

// 15.11.2026 klo 10.00 Suomen aikaa (talviaika, UTC+2)
const NOW = new Date('2026-11-15T08:00:00Z');
const lead = (id: string, completedAt: string | null, over: Partial<{ status: string; email: string | null }> = {}) => ({
  id,
  status: over.status ?? 'COMPLETED',
  completedAt: completedAt ? new Date(completedAt) : null,
  email: over.email === undefined ? 'asiakas@example.com' : over.email,
});

describe('arvostelupyyntöjen valinta', () => {
  it('hakuikkuna: tämän päivän alkuun asti (Helsingin aikaa), enintään kolme päivää taaksepäin', () => {
    const { from, to } = reviewWindow(NOW);
    expect(to.toISOString()).toBe('2026-11-14T22:00:00.000Z'); // 15.11. klo 00.00 Suomessa
    expect(from.toISOString()).toBe('2026-11-11T22:00:00.000Z');
  });

  it('eilen toteutunut saa pyynnön, tänään toteutunut vasta huomenna', () => {
    const picked = selectReviewCandidates(
      [lead('eilen', '2026-11-14T14:00:00Z'), lead('tanaan', '2026-11-15T07:00:00Z'), lead('yo', '2026-11-14T22:30:00Z')],
      new Set(),
      NOW,
    );
    expect(picked.map((l) => l.id)).toEqual(['eilen']);
  });

  it('vanhoja keikkoja, jo lähetettyjä, tekemättömiä ja sähköpostittomia ei valita', () => {
    const picked = selectReviewCandidates(
      [
        lead('vanha', '2026-11-05T10:00:00Z'),
        lead('lahetetty', '2026-11-14T10:00:00Z'),
        lead('voitettu', '2026-11-14T10:00:00Z', { status: 'WON' }),
        lead('ei-postia', '2026-11-14T10:00:00Z', { email: null }),
        lead('laskutettu', '2026-11-13T10:00:00Z', { status: 'INVOICED' }),
        lead('maksettu', '2026-11-12T10:00:00Z', { status: 'PAID' }),
      ],
      new Set(['lahetetty']),
      NOW,
    );
    expect(picked.map((l) => l.id)).toEqual(['laskutettu', 'maksettu']);
  });
});

describe('arvostelulinkki', () => {
  it('hyväksyy vain Googlen https-linkit', () => {
    expect(isValidReviewUrl('https://g.page/r/CbAbc123/review')).toBe(true);
    expect(isValidReviewUrl('https://search.google.com/local/writereview?placeid=abc')).toBe(true);
    expect(isValidReviewUrl('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isValidReviewUrl('http://g.page/r/abc/review')).toBe(false);
    expect(isValidReviewUrl('https://evil.example/g.page')).toBe(false);
    expect(isValidReviewUrl('ei linkki')).toBe(false);
  });

  it('Tampereen keikoille Tampereen oma linkki, jos asetettu', () => {
    const settings = { ...DEFAULT_REVIEW_SETTINGS, googleReviewUrl: 'https://g.page/r/hki/review', googleReviewUrlTampere: 'https://g.page/r/tre/review' };
    expect(reviewUrlForTeam(settings, 'tampere')).toBe('https://g.page/r/tre/review');
    expect(reviewUrlForTeam(settings, 'helsinki')).toBe('https://g.page/r/hki/review');
    expect(reviewUrlForTeam({ ...settings, googleReviewUrlTampere: '' }, 'tampere')).toBe('https://g.page/r/hki/review');
  });
});

describe('viesti', () => {
  it('sisältää linkin ja nimen, HTML suojattu', () => {
    const html = renderReviewRequestHtml({ firstName: '<b>Anna</b>', reviewUrl: 'https://g.page/r/abc/review' });
    expect(html).toContain('href="https://g.page/r/abc/review"');
    expect(html).toContain('&lt;b&gt;Anna&lt;/b&gt;');
    expect(html).not.toContain('<b>Anna</b>');
    expect(renderReviewRequestText({ firstName: null, reviewUrl: 'https://g.page/r/abc/review' })).toMatch(/^Hei,\n/);
    // Logo sivuston osoitteesta (absoluuttinen, jotta se näkyy sähköpostiohjelmissa)
    expect(html).toContain('src="https://www.muuttokone.fi/images/logo/logo-email.png"');
    expect(renderReviewRequestHtml({ firstName: null, reviewUrl: 'https://g.page/r/abc/review', siteUrl: 'https://muuttokone.fi/' })).toContain(
      'src="https://muuttokone.fi/images/logo/logo-email.png"',
    );
  });
});

describe('oletusasetukset', () => {
  it('Google-profiilin linkki on valmiina, mutta lähetys on pois päältä kunnes omistaja kytkee sen', () => {
    expect(isValidReviewUrl(DEFAULT_REVIEW_SETTINGS.googleReviewUrl)).toBe(true);
    expect(DEFAULT_REVIEW_SETTINGS.enabled).toBe(false);
  });
});
