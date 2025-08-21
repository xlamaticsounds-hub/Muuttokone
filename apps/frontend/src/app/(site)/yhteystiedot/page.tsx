import type { Metadata } from 'next';
import Contact from '@/features/contact';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.contact,
  openGraph: {
    title: SEOConfigs.contact.title,
    description: SEOConfigs.contact.description,
    image: '/images/og-contact.jpg',
    type: 'website',
  },
});

export default function Page() {
  return <Contact />;
}
