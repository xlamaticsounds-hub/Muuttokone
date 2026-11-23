import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/components/SEO/SEOHelpers';
import { getCityPage, type CitySlug } from './cityData';

export function cityPageMetadata(slug: CitySlug): Metadata {
  const city = getCityPage(slug);
  return generateSEOMetadata({
    title: city.seoTitle,
    description: city.seoDescription,
    keywords: city.keywords,
    canonical: city.path,
    openGraph: { title: city.seoTitle, description: city.seoDescription, image: '/images/og/muuttokone-tiimi.jpg', type: 'website' },
  });
}
