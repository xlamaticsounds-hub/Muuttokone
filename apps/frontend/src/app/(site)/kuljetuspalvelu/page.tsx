import type { Metadata } from 'next';
import ServicePageContent, { servicePageMetadata } from '@/features/service-pages/ServicePageContent';

export const metadata: Metadata = servicePageMetadata('kuljetuspalvelu');

export default function KuljetuspalveluPage() {
  return <ServicePageContent slug="kuljetuspalvelu" />;
}
