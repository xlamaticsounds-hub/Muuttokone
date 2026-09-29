import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { getCityBySlug } from '@/features/city-pages/cityData';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.muuttopalveluTampere,
  openGraph: {
    title: SEOConfigs.muuttopalveluTampere.title,
    description: SEOConfigs.muuttopalveluTampere.description,
    type: 'website',
  },
});

export default function MuuttopalveluTamperePage() {
  const city = getCityBySlug('tampere');
  if (!city) notFound();
  return <CityPageContent city={city} />;
}
