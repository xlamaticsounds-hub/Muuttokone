import { siteConfig } from '@/config/site';

interface StructuredDataProps {
  // Custom: valmiiksi rakennettu schema.org-olio (esim. kaupunkisivun Service), tulostetaan sellaisenaan.
  type: 'LocalBusiness' | 'Organization' | 'Service' | 'MovingCompany' | 'BlogPosting' | 'FAQPage' | 'Product' | 'BreadcrumbList' | 'Custom';
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
        'Muuttopalvelu pääkaupunkiseudulla ja Tampereella: koti- ja yritysmuutot, kantoapu, pakkaus, kuljetukset, kuolinpesätyhjennykset ja muuttolaatikoiden vuokraus.',
      telephone: siteConfig.contact.phone.tel,
      email: siteConfig.contact.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Helsinki',
        addressCountry: 'FI',
      },
      // Toimipaikat: Helsinki (pääkaupunkiseutu) ja Tampere (tukikohta Hervannassa, 2026-11).
      department: [
        {
          '@type': 'MovingCompany',
          name: 'Muuttokone.fi Helsinki',
          url: `${siteUrl}/muuttopalvelu-helsinki`,
          telephone: siteConfig.contact.phone.tel,
          address: { '@type': 'PostalAddress', addressLocality: 'Helsinki', addressRegion: 'Uusimaa', addressCountry: 'FI' },
          areaServed: ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen'].map((name) => ({ '@type': 'City', name })),
        },
        {
          '@type': 'MovingCompany',
          name: 'Muuttokone.fi Tampere',
          url: `${siteUrl}/muuttopalvelu-tampere`,
          telephone: siteConfig.contact.phone.tel,
          address: { '@type': 'PostalAddress', addressLocality: 'Tampere', addressRegion: 'Pirkanmaa', addressCountry: 'FI' },
          areaServed: ['Tampere', 'Pirkkala', 'Kangasala', 'Lempäälä', 'Nokia', 'Ylöjärvi'].map((name) => ({ '@type': 'City', name })),
        },
      ],
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Uusimaa' },
        { '@type': 'AdministrativeArea', name: 'Pirkanmaa' },
        ...['Helsinki', 'Espoo', 'Vantaa', 'Tampere', 'Turku'].map((name) => ({ '@type': 'City', name })),
        { '@type': 'Country', name: 'Finland' },
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
          '@type': 'MovingCompany',
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

      // Valmiiksi rakennettu schema.org-data (ks. features/vuokraus/productSchema.ts)
      case 'Product':
      case 'BreadcrumbList':
      case 'Custom':
        return data;

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
