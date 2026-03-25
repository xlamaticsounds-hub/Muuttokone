import SectionTitle from '@/components/SectionTitle';
import ServiceItem from '@/features/services/ServiceItem';
import type { Service } from '@/types/service';
import CallCta from './CallCta';

interface ServicesProps {
  title: string;
  subtitle: string;
  items?: Service[];
}

export default function Services({ title, subtitle, items = [] }: ServicesProps) {
  return (
    <>
      <section
        id="palvelut"
        className="scroll-mt-20 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-12 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Palvelut</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">{title}</h2>
            <p className="mt-2 text-black/70 dark:text-white/70">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(items.length ? items : []).map((service, index) => (
              <ServiceItem key={index} service={service} index={index} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-5 text-sm text-black/70 dark:text-white/70">
              Tarvitsetko yhdistelmäpalvelun tai räätälöidyn ratkaisun? Soita tai täytä lomake.
            </p>
            <CallCta />
          </div>
        </div>
      </section>
    </>
  );
}
