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
import CalculatorIntro from '@/components/CalculatorIntro';
import ProcessSteps from '@/components/ProcessSteps';
import PricingPreview from '@/components/PricingPreview';
import Faq from '@/components/Faq';
import ServiceAreaChecker from '@/features/service-area/ServiceAreaChecker';
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
      <ServicesDivider />
      <ProcessSteps />
      <section id="muuttolaskuri" className="bg-gray-1 dark:bg-bg-color-dark py-8 lg:py-12 scroll-mt-20">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <CalculatorIntro />
          <Suspense>
            <Calculator />
          </Suspense>
        </div>
      </section>
      <PricingPreview />
      <ServiceAreaChecker />
      <Faq />
      <ServicesDivider />
      <Services
        title={pageData?.sections?.[1]?.props?.title}
        subtitle={pageData?.sections?.[1]?.props?.subtitle}
        items={services}
      />
      <About />
      <Contact />
      <Cta />
    </>
  );
}
