import type { Metadata } from 'next';
import CityPageContent from '@/features/city-pages/CityPageContent';
import { cityPageMetadata } from '@/features/city-pages/cityPage';

export const metadata: Metadata = cityPageMetadata('espoo');

export default function MuuttopalveluEspooPage() {
  return <CityPageContent slug="espoo" />;
}
