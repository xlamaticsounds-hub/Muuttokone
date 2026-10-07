// schema.org-rakenteinen data (JSON-LD) vuokrattaville tuotteille: hinta, saatavuus ja toimitusalue
// hakukoneille. Kaikki arvot luetaan rental.ts:stä — muuta hintaa tai saatavuutta (inStock) siellä,
// niin sivun näkyvä teksti ja hakukoneille annettu tieto päivittyvät yhdessä.
import type { RentalItem } from './rental';

export const SERVICE_AREA_NAMES = ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen'];

export function getSiteUrl(): string {
  return process.env.SITE_URL ?? 'https://muuttokone.fi';
}

export function buildRentalProductSchema(
  item: RentalItem,
  options: { path: string; areaServed?: string[]; imagePath?: string },
) {
  const siteUrl = getSiteUrl();
  const price = item.pricePerDay.toFixed(2);
  // Hinta on voimassa vuoden loppuun seuraavana vuonna (Google suosittelee voimassaoloaikaa).
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${item.title} – vuokra`,
    description: `${item.description} Vuokra ${price.replace('.', ',')} € / kpl / vuorokausi (sis. ALV), ${item.qty.min}–${item.qty.max} kpl, vuokra-aika ${item.days.min}–${item.days.max} vuorokautta.`,
    image: [`${siteUrl}${options.imagePath ?? item.image ?? '/icons/boxguy.webp'}`],
    brand: { '@type': 'Brand', name: 'Muuttokone.fi' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${options.path}`,
      priceCurrency: 'EUR',
      price,
      priceValidUntil,
      availability: item.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      areaServed: (options.areaServed ?? SERVICE_AREA_NAMES).map((name) => ({ '@type': 'City', name })),
      seller: { '@type': 'Organization', name: 'Muuttokone.fi', url: siteUrl },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price,
        priceCurrency: 'EUR',
        valueAddedTaxIncluded: true,
        unitCode: 'DAY',
        unitText: 'vuorokausi',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' },
      },
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: item.qty.min,
        maxValue: item.qty.max,
        unitText: 'kpl',
      },
    },
  };
}

export function buildBreadcrumbSchema(crumbs: { name: string; path: string }[]) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}
