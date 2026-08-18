import { Metadata } from 'next';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.calculator,
  openGraph: {
    title: SEOConfigs.calculator.title,
    description: SEOConfigs.calculator.description,
    type: 'website',
  },
});

export default function MuuttolaskuriLayout({ children }: { children: React.ReactNode }) {
  return children;
}
