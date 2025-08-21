import type { Metadata } from 'next';
import HeroArea from '@/components/HeroArea';
import About from '@/components/About';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import SmallFeatures from '@/components/SmallFeatures';
import Contact from '@/features/contact';
import Cta from '@/components/Cta';
import QuickQuote from '@/features/quote/quick-quote';
import type { Service } from '@/types/service';
import staticServiceData from '@/features/services/serviceData';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';

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
  return (
    <>
      <HeroArea />
      <ServicesDivider />
      <SmallFeatures />
      <QuickQuote />
      <ServicesDivider />
      <Services
        title="Palvelumme"
        subtitle="Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille koko Suomessa."
        items={services}
      />
      <About />
      {/* <Testimonials /> */}
      <Contact />
      <Cta />
    </>
  );
}
