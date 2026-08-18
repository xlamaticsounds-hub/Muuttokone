import { siteConfig } from '@/config/site';

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Organization' | 'Service' | 'MovingCompany' | 'BlogPosting' | 'FAQPage';
  data?: any;
}

export default async function StructuredData({ type, data }: StructuredDataProps) {
  const siteUrl = process.env.SITE_URL ?? 'https://muuttokone.fi';

  const getStructuredData = () => {
    const baseOrganization = {
      '@context': 'https://schema.org',
      '@type': 'MovingCompany',
      name: 'Muuttokone.fi',
      legalName: 'Muuttokone Oy',
      url: siteUrl,
      logo: `${siteUrl}/images/logo/logo.png`,
      image: `${siteUrl}/images/webp/hero/hero.webp`,
      description:
        'Luotettava muuttopalvelu Helsingissä ja Uudellamaalla. Koti- ja yritysmuutot, pakkaus, kuljetukset, kuolinpesätyhjennnykset ja siivous.',
      telephone: siteConfig.contact.phone.tel,
      email: siteConfig.contact.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Helsinki',
        addressCountry: 'FI',
      },
      areaServed: [
        {
          '@type': 'Country',
          name: 'Finland',
        },
        {
          '@type': 'City',
          name: 'Helsinki',
        },
        {
          '@type': 'AdministrativeArea',
          name: 'Uusimaa',
        },
        {
          '@type': 'City',
          name: 'Tampere',
        },
        {
          '@type': 'City',
          name: 'Turku',
        },
      ],
      serviceType: [
        'Residential Moving',
        'Commercial Moving',
        'Packing Services',
        'Storage Services',
      ],
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '08:00',
          closes: '22:00',
        },
      ],
      // Real hasCredential / aggregateRating can be added back once backed by an
      // actual certification and real review data — publishing invented ones
      // violates Google's structured data guidelines.
    };

    switch (type) {
      case 'LocalBusiness':
      case 'MovingCompany':
        return {
          ...baseOrganization,
          '@type': 'LocalBusiness',
          priceRange: '€€',
          paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
        };

      case 'Organization':
        return baseOrganization;

      case 'Service':
        return {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: data?.name || 'Muuttopalvelut',
          description: data?.description || 'Luotettava muuttopalvelu Helsingissä ja Uudellamaalla',
          provider: {
            '@type': 'Organization',
            name: 'Muuttokone.fi',
            url: siteUrl,
          },
          areaServed: {
            '@type': 'Country',
            name: 'Finland',
          },
          serviceType: data?.serviceType || 'Moving Services',
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR',
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'EUR',
              price: data?.price || '0',
              description: 'Hinnat alkaen - pyydä henkilökohtainen tarjous',
            },
          },
        };

      case 'BlogPosting':
        return {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data?.title,
          description: data?.description,
          image: data?.image
            ? data.image.startsWith('http')
              ? data.image
              : `${siteUrl}${data.image}`
            : undefined,
          datePublished: data?.datePublished,
          dateModified: data?.dateModified || data?.datePublished,
          author: {
            '@type': 'Organization',
            name: data?.authorName || 'Muuttokone.fi',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Muuttokone.fi',
            logo: {
              '@type': 'ImageObject',
              url: `${siteUrl}/images/logo/logo.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data?.url,
          },
        };

      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: (data?.faqs || []).map((item: { q: string; a: string }) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        };

      default:
        return baseOrganization;
    }
  };

  const structuredData = getStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}
