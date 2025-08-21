import type { Metadata } from 'next';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import { directusFetch, assetUrl } from '@/lib/directus';
import type { Service } from '@/types/service';

export const metadata: Metadata = {
  title: 'Palvelut – Muuttokone.fi',
  description:
    'Muuttopalvelut koteihin ja yrityksille: kotimuutto, yritysmuutto, pakkaus, varastointi, siivous ja pianot.',
};

async function getServices(): Promise<Service[]> {
  try {
    const data = await directusFetch<{ data: any[] }>(
      '/items/services?fields=title,description,icon',
      { cache: 'no-store' },
    );
    return (data?.data || []).map((item) => ({
      title: item.title,
      description: item.description,
      icon:
        typeof item.icon === 'string' && item.icon.startsWith('http')
          ? item.icon
          : assetUrl(item.icon) || '/images/icon/icon-01.svg',
      bgClass: 'hover:bg-primary/5',
    }));
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
        subtitle="Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille koko Suomessa."
        items={items}
      />
      <ServicesDivider />
    </>
  );
}
