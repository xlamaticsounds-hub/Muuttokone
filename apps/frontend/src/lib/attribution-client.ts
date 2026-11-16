// Kävijän ensimmäisen sivulatauksen lähde (referrerin domain + UTM + laskeutumissivu), joka lähetetään
// lomakkeiden mukana /api/submitiin. Palvelin siivoaa ja luokittelee sen (lib/traffic-source.ts).
//
// Tieto pidetään vain muistissa, ei evästeessä eikä localStoragessa, joten se ei vaadi evästesuostumusta.
// Next.js:n sivunvaihdot säilyttävät sen; koko sivun uudelleenlataus nollaa sen (silloin lähteeksi jää
// sivu, jolta lomake lähetettiin, ja oman sivuston referreri ohitetaan).
import type { Attribution } from './traffic-source';

let captured: Attribution | null = null;

export function captureAttribution() {
  if (captured || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer && referrer.host !== window.location.host) referrerHost = referrer.hostname;
  } catch {
    // Virheellinen referrer: jätetään pois.
  }
  captured = {
    referrerHost,
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    landingPath: window.location.pathname,
  };
}

/** Lomakkeen payloadiin: `attribution: getAttribution()`. */
export function getAttribution(): Attribution | undefined {
  captureAttribution();
  return captured ?? undefined;
}
