'use client';

import SectionTitle from '@/components/SectionTitle';
import ServiceItem from '@/features/services/ServiceItem';
import type { Service } from '@/types/service';
import CallCta from './CallCta';
import { useT } from '@/i18n/useT';
import { servicesDictionary, servicesDataDictionary } from '@/i18n/homeDictionary';

interface ServicesProps {
  title?: string;
  subtitle?: string;
  items?: Service[];
}

export default function Services({ title, subtitle, items = [] }: ServicesProps) {
  const t = useT(servicesDictionary);
  const tData = useT(servicesDataDictionary);
  const translatedItems = items.map((service) => ({
    ...service,
    title: tData(service.title),
    description: tData(service.description),
  }));
  return (
    <>
      <section
        id="palvelut"
        className="scroll-mt-20 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-12 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">{t('Palvelut')}</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">{title || t('Palvelumme')}</h2>
            <p className="mt-2 text-black/70 dark:text-white/70">{subtitle || t('Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille Helsingissä ja Uudellamaalla.')}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {translatedItems.map((service, index) => (
              <ServiceItem key={index} service={service} index={index} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-5 text-sm text-black/70 dark:text-white/70">
              {t('Tarvitsetko yhdistelmäpalvelun tai räätälöidyn ratkaisun? Soita tai täytä lomake.')}
            </p>
            <CallCta />
          </div>
        </div>
      </section>
    </>
  );
}
