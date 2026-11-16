// Kaupunkisivun schema.org-data: muuttopalvelu (Service) kaupungissa, tarjoajana Muuttokone.fi.
import type { CityData } from './cityData';

const getSiteUrl = () => process.env.SITE_URL ?? 'https://muuttokone.fi';

export function buildCityServiceSchema(city: CityData) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: city.h1,
    serviceType: 'Muuttopalvelu',
    url: `${siteUrl}${city.path}`,
    description: city.lead,
    provider: {
      '@type': 'MovingCompany',
      name: 'Muuttokone.fi',
      url: siteUrl,
    },
    // Maakuntasivulla palvelualue on maakunta ja sen kunnat, kaupunkisivulla kaupunki ja lähikunnat
    areaServed: city.region
      ? [{ '@type': 'AdministrativeArea', name: city.name }, ...city.districts.map((name) => ({ '@type': 'City', name }))]
      : [city.name, ...city.nearby.places].map((name) => ({ '@type': 'City', name })),
  };
}
