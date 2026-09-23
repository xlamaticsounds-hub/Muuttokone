import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { getCityBySlug } from '@/features/city-pages/cityData';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.muuttopalveluVantaa,
  openGraph: {
    title: SEOConfigs.muuttopalveluVantaa.title,
    description: SEOConfigs.muuttopalveluVantaa.description,
    type: 'website',
  },
});

export default function MuuttopalveluVantaaPage() {
  const city = getCityBySlug('vantaa');
  if (!city) notFound();
  return <CityPageContent city={city} />;
}
