import type { Metadata } from 'next';
import ServicePageContent, { servicePageMetadata } from '@/features/service-pages/ServicePageContent';

export const metadata: Metadata = servicePageMetadata('muuttosiivous');

export default function MuuttosiivousPage() {
  return <ServicePageContent slug="muuttosiivous" />;
}
