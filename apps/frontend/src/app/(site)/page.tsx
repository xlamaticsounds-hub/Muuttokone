import type { Metadata } from 'next';
import HeroArea from '@/components/HeroArea';
import About from '@/components/About';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import SmallFeatures from '@/components/SmallFeatures';
import Contact from '@/features/contact';
import Cta from '@/components/Cta';
import QuickQuote from '@/features/quote/quick-quote';
import StatsBand from '@/components/StatsBand';
import ProcessSteps from '@/components/ProcessSteps';
import PricingPreview from '@/components/PricingPreview';
import Testimonials from '@/components/Testimonials';
import MobileStickyCTA from '@/components/MobileStickyCTA';
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
      <Testimonials />
      <QuickQuote />
      <ServicesDivider />
      <Services
        title={pageData?.sections?.[1]?.props?.title || "Palvelumme"}
        subtitle={pageData?.sections?.[1]?.props?.subtitle || "Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille koko Suomessa."}
        items={services}
      />
      <About />
      <Contact />
      <Cta />
      <MobileStickyCTA />
    </>
  );
}
