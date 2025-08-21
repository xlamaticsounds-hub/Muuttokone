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
        className="scroll-mt-20 bg-gradient-to-b from-white to-gray-50/60 py-8 lg:py-12 xl:py-14 dark:from-[#0b0c0f] dark:to-black"
      >
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <SectionTitle title={title} subtitle={subtitle} />

          <div className="mx-auto mt-15 max-w-6xl">
            <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
              {(items.length ? items : []).map((service, index) => (
                <ServiceItem key={index} service={service} index={index} />
              ))}
            </div>
          </div>

          <div className="mt-12.5 text-center">
            <p className="text-body mb-6">
              Tarvitsetko räätälöityä ratkaisua? Ota yhteyttä ja keskustellaan tarpeistasi.
            </p>
            <CallCta />
          </div>
        </div>
      </section>
    </>
  );
}
