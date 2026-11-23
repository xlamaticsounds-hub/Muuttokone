import type { Metadata } from 'next';

/** Linkin jakokuva (WhatsApp, Facebook, LinkedIn...): tiimikuva 1200 × 630, sama kuin Yrityksille-sivun ylhäällä. */
export const DEFAULT_OG_IMAGE = '/images/og/muuttokone-tiimi.jpg';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article';
  };
  keywords?: string[] | readonly string[];
  noindex?: boolean;
  // Path (not full URL) to the equivalent page in each language, for hreflang. Only set
  // this on pages that actually have a real, fully translated counterpart — pointing
  // hreflang at an untranslated page tells Google the wrong thing.
  languageAlternates?: { fi: string; en: string };
}

export function generateSEOMetadata({
  title,
  description,
  canonical,
  openGraph,
  keywords,
  noindex = false,
  languageAlternates,
}: SEOProps): Metadata {
  const siteUrl = process.env.SITE_URL ?? 'https://muuttokone.fi';

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    alternates: {
      canonical: canonical ? `${siteUrl}${canonical}` : undefined,
      languages: languageAlternates
        ? {
            fi: `${siteUrl}${languageAlternates.fi}`,
            en: `${siteUrl}${languageAlternates.en}`,
            'x-default': `${siteUrl}${languageAlternates.fi}`,
          }
        : undefined,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
    },
    openGraph: openGraph
      ? {
          title: openGraph.title || title,
          description: openGraph.description || description,
          // Sivun oma openGraph korvaa layoutin kokonaan, joten ilman kuvaa jaetussa linkissä ei olisi kuvaa
          images: [
            {
              url: openGraph.image || DEFAULT_OG_IMAGE,
              width: 1200,
              height: 630,
              alt: openGraph.title || title,
            },
          ],
          type: openGraph.type || 'website',
          url: canonical ? `${siteUrl}${canonical}` : siteUrl,
        }
      : undefined,
  };
}

// Predefined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'Muuttopalvelu Helsinki ja Tampere – hinta heti',
    description:
      'Muuttopalvelu Helsingissä, Espoossa, Vantaalla ja Tampereella. Koti- ja yritysmuutot, kantoapu ja muuttolaatikot kiinteällä hinnalla. Laske hinta heti.',
    keywords: ['muuttopalvelu', 'muuttofirma', 'muutto', 'muuttopalvelu helsinki', 'muuttopalvelu tampere', 'muuttoapu', 'muuttolaskuri'],
    canonical: '/',
    languageAlternates: { fi: '/', en: '/en' },
  },

  homeEn: {
    title: 'Home – Reliable Moving Company in Helsinki',
    description:
      'Fast, safe and transparent moving in Helsinki and the Uusimaa region. Home and office moves, packing, transport and estate clearances. Request a free quote!',
    keywords: ['moving company', 'movers', 'moving service', 'Helsinki', 'Uusimaa', 'Espoo', 'Vantaa'],
    canonical: '/en',
    languageAlternates: { fi: '/', en: '/en' },
  },

  services: {
    title: 'Muuttopalvelut – kotimuutot ja yritysmuutot',
    description:
      'Muuttopalvelut pääkaupunkiseudulla ja Tampereella: täysi palvelu, kantoapu, kuljettaja ja auto, pakkaus, kuolinpesät ja muuttosiivous. Hinnat laskurista.',
    keywords: ['muuttopalvelut', 'kotimuutto', 'yritysmuutto', 'pakkaus', 'kuljetukset', 'kuolinpesätyhjennys', 'siivous', 'Helsinki', 'Uusimaa'],
    canonical: '/palvelut',
  },

  business: {
    title: 'Yritysmuutto ja toimistomuutto – pk-seutu ja Tampere',
    description:
      'Yritysmuutot ja toimistomuutot pääkaupunkiseudulla ja Tampereella ilman käyttökatkoksia, tarvittaessa iltaisin ja viikonloppuisin. Pyydä maksuton kartoitus.',
    keywords: ['yritysmuutto', 'toimistomuutto', 'yritysmuutto helsinki', 'yritysmuutto tampere', 'toimitilamuutto', 'yrityskuljetukset'],
    canonical: '/yrityksille',
  },

  tyoapu: {
    title: 'Työapu - Asennukset, IT-apu, pihatyöt ja kantoapu',
    description:
      'Lisäkädet kotiin ja yritykseen: TV:n ja pesukoneen asennus, kalusteiden kokoaminen, IT-apu, kaivuutyöt, porealtaan asennus ja kantoapu. Kiinteä hinta tai tuntiveloitus.',
    keywords: [
      'työapu',
      'tv:n asennus',
      'pesukoneen asennus',
      'kalusteiden kokoaminen',
      'it-apu',
      'porealtaan asennus',
      'kaivuutyöt',
      'kantoapu',
      'apumies',
      'Helsinki',
      'Espoo',
      'Vantaa',
    ],
    canonical: '/tyoapu',
  },

  muuttolaatikot: {
    title: 'Muuttolaatikot vuokralle – pk-seutu ja Tampere',
    description:
      'Vuokraa muuttolaatikot 0,19 €/laatikko/vrk. Toimitus ja nouto ilmaiseksi muuton yhteydessä tai yli 100 €:n vuokrassa. Helsinki, Espoo, Vantaa ja Tampere.',
    keywords: [
      'muuttolaatikot vuokraus',
      'muuttolaatikon vuokra',
      'vuokraa muuttolaatikot',
      'muuttolaatikot Helsinki',
      'muuttolaatikot Espoo',
      'muuttolaatikot Vantaa',
      'muuttolaatikot Tampere',
      'muuttolaatikko vuokra hinta',
    ],
    canonical: '/muuttolaatikot',
  },

  quote: {
    title: 'Tarjouspyyntö - Pyydä maksuton tarjous',
    description:
      'Pyydä maksuton tarjous muutosta, yritysmuutosta tai kuolinpesän tyhjennyksestä. Täytä lomake, niin saat henkilökohtaisen tarjouksen yleensä vuorokauden sisällä.',
    keywords: ['tarjouspyyntö', 'muuttotarjous', 'maksuton tarjous', 'muuttolaskin'],
    canonical: '/tarjouspyynto',
  },

  contact: {
    title: 'Yhteystiedot - Ota yhteyttä',
    description:
      'Ota yhteyttä Muuttokoneeseen puhelimitse, sähköpostilla tai lomakkeella. Palvelemme joka päivä 8–22 pääkaupunkiseudulla ja Tampereella. Kysy tarjous muutosta.',
    keywords: ['yhteystiedot', 'ota yhteyttä', 'asiakaspalvelu', 'muuttoneuvonta'],
    canonical: '/yhteystiedot',
  },

  blog: {
    title: 'Muuttoblogi – vinkit, muistilistat ja hinnat',
    description: 'Muuttoblogi: muistilistat, pakkausvinkit, muuton hinnat ja ohjeet kotimuuttoon ja yritysmuuttoon. Käytännön neuvoja muuttoammattilaisilta.',
    keywords: ['muuttoblogi', 'muuttovinkit', 'muuttoartikkelit', 'muuttotieto'],
    canonical: '/blogi',
  },

  referenssit: {
    title: 'Referenssit – toteutetut muutot',
    description: 'Poimintoja toteutetuista muuttoprojekteista: kotimuutot, yritysmuutot ja erikoiskuljetukset pääkaupunkiseudulla. Katso, miten muutot hoidettiin.',
    keywords: ['muuttoreferenssit', 'asiakascase', 'yritysmuutto esimerkki', 'kotimuutto esimerkki'],
    canonical: '/referenssit',
  },

  faq: {
    title: 'Usein kysytyt kysymykset',
    description: 'Vastaukset yleisimpiin muuttokysymyksiin: mitä muutto maksaa, mitä hintaan sisältyy, vakuutukset, aikataulut, pakkaus ja muuttolaatikoiden vuokraus.',
    keywords: ['usein kysytyt kysymykset', 'muutto ukk', 'muuttofirma kysymykset'],
    canonical: '/usein-kysytyt-kysymykset',
  },

  calculator: {
    title: 'Muuttolaskuri – laske muuton hinta heti',
    description:
      'Muuttolaskuri laskee muuton hinnan sekunneissa tavaramäärän, kerrosten ja matkan mukaan. Kiinteä hinta ilman piilokuluja, varaa muutto heti.',
    keywords: ['muuttolaskuri', 'muutto hinta laskuri', 'muuton hinta', 'muuttopalvelu laskuri', 'muuton hinta-arvio'],
    canonical: '/muuttolaskuri',
    languageAlternates: { fi: '/muuttolaskuri', en: '/en/muuttolaskuri' },
  },

  calculatorEn: {
    title: 'Moving Cost Calculator – Get an Accurate Price Instantly',
    description:
      'Calculate your moving price instantly – an accurate estimate in seconds, no hidden fees. Based on your actual amount of belongings, not guesswork.',
    keywords: ['moving cost calculator', 'moving price estimate', 'moving quote'],
    canonical: '/en/muuttolaskuri',
    languageAlternates: { fi: '/muuttolaskuri', en: '/en/muuttolaskuri' },
  },

  terms: {
    title: 'Käyttöehdot',
    description: 'Muuttokone.fi palvelun käyttöehdot. Lue ehdot ennen palvelun tilaamista.',
    canonical: '/kayttoehdot',
  },

  privacy: {
    title: 'Tietosuojaseloste',
    description: 'Muuttokone.fi tietosuojaseloste. Lue miten käsittelemme henkilötietojasi.',
    canonical: '/tietosuoja',
  },
} as const;
