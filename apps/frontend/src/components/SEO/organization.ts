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

export const ORGANIZATION_SAME_AS = [
  'https://www.facebook.com/profile.php?id=61590814036560',
  'https://fonecta.fi/profiili/muuttokone-oy/4305978',
] as const;

/** Viittaus yritykseen toisen olion sisällä (provider, publisher). */
export const organizationRef = (siteUrl = getSiteUrl()) => ({
  '@type': 'MovingCompany',
  '@id': organizationId(siteUrl),
  name: 'Muuttokone.fi',
  url: siteUrl,
});
