import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroArea from '@/components/HeroArea';
import Cta from '@/components/Cta';
import Calculator from '@/features/calculator/Calculator';
import CalculatorIntro from '@/components/CalculatorIntro';
import PricingPreview from '@/components/PricingPreview';
import ServicesGrid from '@/components/ServicesGrid';
import Faq from '@/components/Faq';
import { homeFaqData } from '@/components/Faq/faqData';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import { getPageContent } from '@/server/repo/pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.home,
  openGraph: {
    title: SEOConfigs.home.title,
    description: SEOConfigs.home.description,
    image: '/images/webp/hero/hero.webp',
    type: 'website',
  },
});

export default async function Home() {
  const pageData = await getPageContent('home');

  // Etusivu ohjaa yhteen tehtävään: hero → laskuri heti perään → hinnat → palvelut lyhyesti → UKK.
  // Pidemmät sisällöt (palvelukuvaukset, laatikkovuokra, yhteydenottolomake) ovat omilla sivuillaan.
  return (
    <>
      <HeroArea content={pageData?.sections?.[0]?.props} />
      <section id="muuttolaskuri" className="bg-gray-1 dark:bg-bg-color-dark py-8 lg:py-12 scroll-mt-20">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <CalculatorIntro />
          <Suspense>
            <Calculator />
          </Suspense>
        </div>
      </section>
      <PricingPreview />
      <ServicesGrid
        title={pageData?.sections?.[1]?.props?.title}
        subtitle={pageData?.sections?.[1]?.props?.subtitle}
      />
      <Faq items={homeFaqData} moreHref="/usein-kysytyt-kysymykset" />
      <Cta href="#muuttolaskuri" label="Laske hinta" />
    </>
  );
}
