import { Suspense } from 'react';
import type { Metadata } from 'next';
import QuoteForm from '@/components/Forms/QuoteForm';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.quote,
  openGraph: {
    title: SEOConfigs.quote.title,
    description: SEOConfigs.quote.description,
    image: '/images/og-quote.jpg',
    type: 'website',
  },
});

export default function Page() {
  return (
    <main className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-4xl px-4 md:px-8 xl:px-21">
        <h1 className="mb-6 text-3xl font-semibold text-black lg:text-4xl dark:text-white">
          Pyydä tarjous
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Täytä alla olevat tiedot. Vähintään puhelinnumero ja muuttopäivä vaaditaan.
        </p>
        <Suspense fallback={<div>Ladataan lomaketta...</div>}>
          <QuoteForm />
        </Suspense>
      </div>
    </main>
  );
}
