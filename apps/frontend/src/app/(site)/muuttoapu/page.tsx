import type { Metadata } from 'next';
import ServicePageContent, { servicePageMetadata } from '@/features/service-pages/ServicePageContent';

export const metadata: Metadata = servicePageMetadata('muuttoapu');

export default function MuuttoapuPage() {
  return <ServicePageContent slug="muuttoapu" />;
}
