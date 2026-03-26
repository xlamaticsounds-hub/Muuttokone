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
}

export function generateSEOMetadata({
  title,
  description,
  canonical,
  openGraph,
  keywords,
  noindex = false,
}: SEOProps): Metadata {
  const siteUrl = process.env.SITE_URL ?? 'https://muuttokone.fi';

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    alternates: {
      canonical: canonical ? `${siteUrl}${canonical}` : undefined,
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
    title: 'Muuttokone.fi - Luotettava muuttopalvelu Helsingissä ja Uudellamaalla',
    description:
      'Nopea, turvallinen ja läpinäkyvä muutto Helsingissä ja Uudellamaalla. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous. Tehokkaat ja ammattitaitoiset tekijät. Pyydä maksuton tarjous!',
    keywords: ['muutto', 'muuttofirma', 'muuttopalvelu', 'Helsinki', 'Uusimaa', 'Espoo', 'Vantaa'],
    canonical: '/',
  },

  services: {
    title: 'Palvelut - Muuttopalvelumme',
    description:
      'Kattavat muuttopalvelut Helsingissä ja Uudellamaalla: kotimuutto, yritysmuutto, pakkauspalvelut, varastointi ja siivous.',
    keywords: ['muuttopalvelut', 'kotimuutto', 'yritysmuutto', 'pakkaus', 'varastointi', 'siivous', 'Helsinki', 'Uusimaa'],
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

  residentialMoves: {
    title: 'Kotimuutto - Luotettava kotimuuttopalvelu',
    description:
      'Ammattitaitoinen kotimuutto pienestä yksiöstä suureen perheasuntoon. Pakkaus, kuljetus ja purkaminen.',
    keywords: ['kotimuutto', 'asunnonmuutto', 'perheasunto', 'yksiö', 'pakkauspalvelu'],
    canonical: '/kotimuutto',
  },

  businessMoves: {
    title: 'Yritysmuutto - Toimistojen ja yritysten muutot',
    description:
      'Sujuva yritysmuutto minimaalinen keskeytys toimintaan. IT-laitteet, toimistokalusteet ja erikoiskuljetukset.',
    keywords: [
      'yritysmuutto',
      'toimistomuutto',
      'IT-muutto',
      'toimistokalusteet',
      'yrityspalvelut',
    ],
    canonical: '/yritysmuutto',
  },
} as const;
