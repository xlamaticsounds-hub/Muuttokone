import { siteConfig } from '@/config/site';

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Organization' | 'Service' | 'MovingCompany';
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
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/og-image.jpg`,
      description:
        'Luotettava muuttopalvelu Helsingissä ja Uudellamaalla. Koti- ja yritysmuutot, pakkaus, kuljetukset, kuolinpesätyhjennnykset ja siivous.',
      telephone: siteConfig.contact.phone.tel,
      email: siteConfig.contact.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Esimerkkikatu 1',
        addressLocality: 'Helsinki',
        postalCode: '00100',
        addressCountry: 'FI',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 60.1695,
        longitude: 24.9354,
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
      sameAs: [
        siteConfig.contact.social.facebook,
        siteConfig.contact.social.linkedin,
        siteConfig.contact.social.twitter,
      ],
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: 'SMPY Certified Moving Company',
        credentialCategory: 'Professional Certification',
      },
    };

    switch (type) {
      case 'LocalBusiness':
      case 'MovingCompany':
        return {
          ...baseOrganization,
          '@type': 'LocalBusiness',
          priceRange: '€€',
          paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '127',
            bestRating: '5',
            worstRating: '1',
          },
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
