import type { Metadata } from 'next';
import Contact from '@/features/contact';
import Team from '@/features/team';
import OurStory from '@/components/OurStory';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.contact,
  openGraph: {
    title: SEOConfigs.contact.title,
    description: SEOConfigs.contact.description,
    image: '/images/webp/hero/hero.webp',
    type: 'website',
  },
});

export default function Page() {
  return (
    <>
      <Team />
      <OurStory />
      <Contact />
    </>
  );
}
