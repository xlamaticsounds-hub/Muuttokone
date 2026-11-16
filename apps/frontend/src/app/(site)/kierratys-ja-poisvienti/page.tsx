import type { Metadata } from 'next';
import ServicePageContent, { servicePageMetadata } from '@/features/service-pages/ServicePageContent';

export const metadata: Metadata = servicePageMetadata('kierratys-ja-poisvienti');

export default function KierratysJaPoisvientiPage() {
  return <ServicePageContent slug="kierratys-ja-poisvienti" />;
}
