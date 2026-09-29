import { Metadata } from 'next';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.calculatorEn,
  openGraph: {
    title: SEOConfigs.calculatorEn.title,
    description: SEOConfigs.calculatorEn.description,
    type: 'website',
  },
});

export default function MuuttolaskuriEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
