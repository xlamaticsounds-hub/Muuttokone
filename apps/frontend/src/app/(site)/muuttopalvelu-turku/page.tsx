import type { Metadata } from 'next';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { cityPageMetadata } from '@/features/city-pages/cityPage';

export const metadata: Metadata = cityPageMetadata('turku');

export default function MuuttopalveluTurkuPage() {
  return <CityPageContent slug="turku" />;
}
