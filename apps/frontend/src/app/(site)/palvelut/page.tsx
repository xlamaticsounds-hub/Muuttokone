import type { Metadata } from 'next';
import Services from '@/features/services';
import ServicesDivider from '@/components/ServicesDivider';
import type { Service } from '@/types/service';
import serviceData from '@/features/services/serviceData';
import Cta from '@/components/Cta';

export const metadata: Metadata = {
  title: 'Palvelut – Muuttokone.fi',
  description:
    'Muuttopalvelut koteihin ja yrityksille: kotimuutto, yritysmuutto, pakkaus, varastointi, siivous ja pianot.',
};

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
      subtitle="Luotettavat ja monipuoliset muuttopalvelut koteihin ja yrityksille – kaikki sujuvaan muuttoon yhdestä paikasta."
      items={items}
      />
      <ServicesDivider />
      <Cta />
    </>
  );
}
