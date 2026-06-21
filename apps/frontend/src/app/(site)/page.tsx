import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroArea from '@/components/HeroArea';
import About from '@/components/About';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import SmallFeatures from '@/components/SmallFeatures';
import Contact from '@/features/contact';
import Cta from '@/components/Cta';
import Calculator from '@/features/calculator/Calculator';
import StatsBand from '@/components/StatsBand';
import ProcessSteps from '@/components/ProcessSteps';
import PricingPreview from '@/components/PricingPreview';
import Faq from '@/components/Faq';
import type { Service } from '@/types/service';
import staticServiceData from '@/features/services/serviceData';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import { getPageContent } from '@/server/repo/pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.home,
  openGraph: {
    title: SEOConfigs.home.title,
    description: SEOConfigs.home.description,
    image: '/images/og-home.jpg',
    type: 'website',
  },
});

async function getServices(): Promise<Service[]> {
  return staticServiceData;
}

export default async function Home() {
  const services = await getServices();
  const pageData = await getPageContent('home');

  // If we have database content, we could map through pageData.sections here.
  // For now, we maintain the layout but fetch the "Core" data dynamically if available.
  
  return (
    <>
      <HeroArea content={pageData?.sections?.[0]?.props} />
      <StatsBand />
      <ServicesDivider />
      <ProcessSteps />
      <section className="bg-gray-1 dark:bg-bg-color-dark py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-semibold text-black lg:text-3xl dark:text-white">
              Aloita tästä – saat hinta-arvion nopeasti
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Laske tarkka hinta-arvio muutollesi suoraan tästä. Tämä ei sido sinua mihinkään.
            </p>
          </div>
          <Suspense>
            <Calculator />
          </Suspense>
        </div>
      </section>
      <Faq />
      <ServicesDivider />
      <Services
        title={pageData?.sections?.[1]?.props?.title || "Palvelumme"}
        subtitle={pageData?.sections?.[1]?.props?.subtitle || "Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille Helsingissä ja Uudellamaalla."}
        items={services}
      />
      <About />
      <Contact />
      <Cta />
    </>
  );
}
