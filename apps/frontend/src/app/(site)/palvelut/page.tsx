import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import type { Service } from '@/types/service';
import serviceData from '@/features/services/serviceData';
import Cta from '@/components/Cta';
import Calculator from '@/features/calculator/Calculator';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.services,
  openGraph: {
    title: SEOConfigs.services.title,
    description: SEOConfigs.services.description,
    image: '/images/og-services.jpg',
    type: 'website',
  },
});

async function getServices(): Promise<Service[]> {
  try {
    return serviceData;
  } catch {
    return [];
  }
}

export default async function Page() {
  const items = await getServices();
  return (
    <>
      <Services
        title="Palvelumme"
        subtitle="Luotettavat ja monipuoliset muuttopalvelut koteihin ja yrityksille Helsingissä ja Uudellamaalla."
        items={items}
      />
      <section className="bg-gray-50 dark:bg-black/20 py-16 lg:py-24">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-black lg:text-4xl dark:text-white">
              Laske muuton hinta
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Käytä älykästä muuttolaskuriamme saadaksesi välittömän hinta-arvion muutollesi.
              Laskuri ottaa huomioon etäisyyden, asunnon koon ja muut erityistarpeet.
            </p>
          </div>
          <Suspense>
            <Calculator />
          </Suspense>
        </div>
      </section>
      <ServicesDivider />
      <Cta />
    </>
  );
}
