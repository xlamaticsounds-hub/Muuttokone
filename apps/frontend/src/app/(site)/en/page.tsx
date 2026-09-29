import type { Metadata } from 'next';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

// Sama sivukomponentti kuin suomenkielisellä etusivulla — LocaleContext (initialLocale,
// ks. (site)/layout.tsx) päättää kummalla kielellä useT()-käännökset renderöityvät.
// Vain metadata (title/description/canonical/hreflang) on tälle reitille omansa.
export { default } from '../page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.homeEn,
  openGraph: {
    title: SEOConfigs.homeEn.title,
    description: SEOConfigs.homeEn.description,
    image: '/images/webp/hero/hero.webp',
    type: 'website',
  },
});
