import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { getCityBySlug } from '@/features/city-pages/cityData';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.muuttopalveluEspoo,
  openGraph: {
    title: SEOConfigs.muuttopalveluEspoo.title,
    description: SEOConfigs.muuttopalveluEspoo.description,
    type: 'website',
  },
});

export default function MuuttopalveluEspooPage() {
  const city = getCityBySlug('espoo');
  if (!city) notFound();
  return <CityPageContent city={city} />;
}
