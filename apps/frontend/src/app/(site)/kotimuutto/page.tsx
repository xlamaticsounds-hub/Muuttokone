import type { Metadata } from 'next';
import Cta from '@/components/Cta';
import SmallFeatures from '@/components/SmallFeatures';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.residentialMoves,
  openGraph: {
    title: SEOConfigs.residentialMoves.title,
    description: SEOConfigs.residentialMoves.description,
    image: '/images/og-kotimuutto.jpg',
    type: 'website',
  },
});

export default function Page() {
  return (
    <section className="py-17.5 lg:py-22.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <h1 className="text-3xl font-semibold text-black dark:text-white">Kotimuutto</h1>
        <p className="mt-4 max-w-3xl text-black/70 dark:text-white/80">
          Räätälöity kotimuutto – me huolehdimme kalusteiden suojauksesta ja turvallisesta
          kuljetuksesta.
        </p>
        <div className="mt-10">
          <SmallFeatures />
        </div>
        <div className="mt-15">
          <Cta />
        </div>
      </div>
    </section>
  );
}
