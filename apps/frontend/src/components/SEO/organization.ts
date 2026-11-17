// Yrityksen tunniste schema.org-datassa. Kaikki sivut (kaupunki- ja palvelusivujen Service, blogin
// publisher, WebSite) viittaavat samaan @id:hen, jotta Google ja tekoälyhaut yhdistävät ne yhdeksi
// yritykseksi. sameAs kertoo, mitkä muiden palveluiden profiilit ovat samaa yritystä: tekoäly yhdistää
// niiden tiedot (arvostelut, yhteystiedot) tähän sivustoon.
//
// LISÄÄ TÄNNE uudet profiilit (Google-yritysprofiili, Instagram, LinkedIn, …) sitä mukaa kuin niitä tulee.
// Profiilin tietojen (nimi, puhelin, palvelualue) pitää vastata sivustoa: ristiriidat heikentävät luottamusta.

export const getSiteUrl = () => process.env.SITE_URL ?? 'https://muuttokone.fi';

export const organizationId = (siteUrl = getSiteUrl()) => `${siteUrl}/#organization`;
export const websiteId = (siteUrl = getSiteUrl()) => `${siteUrl}/#website`;

/** Somet (näkyvät myös Yhteystiedot-sivun ikoneissa, features/contact/ContactInfoCard.tsx). */
export const SOCIAL_PROFILES = {
  facebook: 'https://www.facebook.com/profile.php?id=61590814036560',
  instagram: 'https://www.instagram.com/muuttokone/',
  tiktok: 'https://www.tiktok.com/@muuttokone',
} as const;

/**
 * Google-yritysprofiili pysyvänä Maps-osoitteena. CID on purettu arvostelulinkistä
 * (lib/review-request.ts: GOOGLE_REVIEW_URL); share.google-lyhytlinkki ohjaa vain hakusivulle
 * (kgmid /g/11z4pr33dp), eikä se kelpaa sameAs-osoitteeksi.
 */
export const GOOGLE_BUSINESS_PROFILE_URL = 'https://www.google.com/maps?cid=16037744549050081996';

export const ORGANIZATION_SAME_AS = [
  GOOGLE_BUSINESS_PROFILE_URL,
  SOCIAL_PROFILES.facebook,
  SOCIAL_PROFILES.instagram,
  SOCIAL_PROFILES.tiktok,
  'https://fonecta.fi/profiili/muuttokone-oy/4305978',
] as const;

/** Viittaus yritykseen toisen olion sisällä (provider, publisher). */
export const organizationRef = (siteUrl = getSiteUrl()) => ({
  '@type': 'MovingCompany',
  '@id': organizationId(siteUrl),
  name: 'Muuttokone.fi',
  url: siteUrl,
});
