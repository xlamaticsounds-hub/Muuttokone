import type { Metadata } from 'next';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { cityPageMetadata } from '@/features/city-pages/cityPage';

export const metadata: Metadata = cityPageMetadata('pirkanmaa');

export default function MuuttopalveluPirkanmaaPage() {
  return <CityPageContent slug="pirkanmaa" />;
}
