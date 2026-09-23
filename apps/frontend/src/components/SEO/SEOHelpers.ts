import type { Metadata } from 'next';

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
          images: openGraph.image
            ? [
                {
                  url: openGraph.image,
                  width: 1200,
                  height: 630,
                  alt: openGraph.title || title,
                },
              ]
            : undefined,
          type: openGraph.type || 'website',
          url: canonical ? `${siteUrl}${canonical}` : siteUrl,
        }
      : undefined,
  };
}

// Predefined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'Etusivu – Luotettava muuttopalvelu Helsingissä',
    description:
      'Nopea, turvallinen ja läpinäkyvä muutto Helsingissä ja Uudellamaalla. Koti- ja yritysmuutot, pakkaus, kuljetukset ja kuolinpesätyhjennnykset. Tehokkaat ja ammattitaitoiset tekijät. Pyydä maksuton tarjous!',
    keywords: ['muutto', 'muuttofirma', 'muuttopalvelu', 'Helsinki', 'Uusimaa', 'Espoo', 'Vantaa'],
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
    title: 'Palvelut - Muuttopalvelumme',
    description:
      'Kattavat muuttopalvelut Helsingissä ja Uudellamaalla: kotimuutto, yritysmuutto, pakkauspalvelut, kuljetukset, kuolinpesätyhjennnykset ja siivous.',
    keywords: ['muuttopalvelut', 'kotimuutto', 'yritysmuutto', 'pakkaus', 'kuljetukset', 'kuolinpesätyhjennnys', 'siivous', 'Helsinki', 'Uusimaa'],
    canonical: '/palvelut',
  },

  quote: {
    title: 'Tarjouspyyntö - Pyydä maksuton tarjous',
    description:
      'Pyydä maksuton tarjous muutosta. Täytä lomake ja saat henkilökohtaisen tarjouksen nopeasti.',
    keywords: ['tarjouspyyntö', 'muuttotarjous', 'maksuton tarjous', 'muuttolaskin'],
    canonical: '/tarjouspyynto',
  },

  contact: {
    title: 'Yhteystiedot - Ota yhteyttä',
    description:
      'Ota yhteyttä muuttoasioissa. Puhelimitse, sähköpostilla tai lomakkeella. Palvelemme ma-pe 8-18, la-su 9-15.',
    keywords: ['yhteystiedot', 'ota yhteyttä', 'asiakaspalvelu', 'muuttoneuvonta'],
    canonical: '/yhteystiedot',
  },

  blog: {
    title: 'Blogi',
    description: 'Ajankohtaista tietoa ja vinkkejä muuttamiseen liittyen.',
    keywords: ['muuttoblogi', 'muuttovinkit', 'muuttoartikkelit', 'muuttotieto'],
    canonical: '/blogi',
  },

  referenssit: {
    title: 'Referenssit',
    description: 'Poimintoja toteutetuista muuttoprojekteista: kotimuutot, yritysmuutot ja erikoiskuljetukset.',
    keywords: ['muuttoreferenssit', 'asiakascase', 'yritysmuutto esimerkki', 'kotimuutto esimerkki'],
    canonical: '/referenssit',
  },

  faq: {
    title: 'Usein kysytyt kysymykset',
    description: 'Nopeat vastaukset yleisimpiin kysymyksiin hinnoittelusta, aikatauluista ja pakkauspalveluista.',
    keywords: ['usein kysytyt kysymykset', 'muutto ukk', 'muuttofirma kysymykset'],
    canonical: '/usein-kysytyt-kysymykset',
  },

  calculator: {
    title: 'Muuttolaskuri – Saa tarkka hinta heti',
    description:
      'Laske muuttosi hinta heti – tarkka hinta-arvio sekunneissa, ei piilokuluja. Suomen tarkin muuttolaskuri perustuu oikeaan tavaramäärään, ei arvioihin.',
    keywords: ['muuttolaskuri', 'muuton hinta-arvio', 'muuttohinta laskuri'],
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

  muuttopalveluEspoo: {
    title: 'Muuttopalvelu Espoossa',
    description:
      'Ammattitaitoinen muuttopalvelu Espoossa — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    keywords: ['muuttopalvelu Espoo', 'muuttofirma Espoo', 'muutto Espoo', 'Tapiola', 'Leppävaara', 'Matinkylä'],
    canonical: '/muuttopalvelu-espoo',
  },

  muuttopalveluVantaa: {
    title: 'Muuttopalvelu Vantaalla',
    description:
      'Luotettava muuttopalvelu Vantaalla — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    keywords: ['muuttopalvelu Vantaa', 'muuttofirma Vantaa', 'muutto Vantaa', 'Tikkurila', 'Myyrmäki'],
    canonical: '/muuttopalvelu-vantaa',
  },

  muuttopalveluTampere: {
    title: 'Muuttopalvelu Tampereella',
    description:
      'Ammattitaitoinen muuttopalvelu Tampereella — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    keywords: ['muuttopalvelu Tampere', 'muuttofirma Tampere', 'muutto Tampere', 'Hervanta', 'Kaleva'],
    canonical: '/muuttopalvelu-tampere',
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
