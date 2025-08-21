import type { Metadata } from 'next';
import HeroArea from '@/components/HeroArea';
import About from '@/components/About';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import SmallFeatures from '@/components/SmallFeatures';
import Contact from '@/features/contact';
import Cta from '@/components/Cta';
import QuickQuote from '@/features/quote/quick-quote';
import { directusFetch, assetUrl } from '@/lib/directus';
import type { Service } from '@/types/service';
import staticServiceData from '@/features/services/serviceData';

export const metadata: Metadata = {
  title: 'Muuttokone.fi - Luotettava muuttopalvelu koko Suomessa',
  description:
    'Nopea, turvallinen ja läpinäkyvä muutto. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous. Vakuutettu SMPY-jäsen. Pyydä maksuton tarjous!',
};

async function getServices(): Promise<Service[]> {
  try {
    const data = await directusFetch<{ data: any[] }>(
      '/items/services?fields=title,description,icon',
      { cache: 'no-store' },
    );
    const items = (data?.data || []).map((item) => ({
      title: item.title,
      description: item.description,
      icon:
        typeof item.icon === 'string' && item.icon.startsWith('http')
          ? item.icon
          : assetUrl(item.icon) || '/images/icon/icon-01.svg',
      bgClass: 'hover:bg-primary/5',
    }));
    return items.length ? items : staticServiceData;
  } catch {
    return staticServiceData;
  }
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
