import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { NextPage } from 'next';
import Services from '@/features/services';
import SectionTitle from '@/components/SectionTitle';
import ContactFormBox from '@/features/contact/ContactFormBox';
import Cta from '@/components/Cta';
import { getServices } from '@server/data';
import serviceData from '@/features/services/serviceData';

export const metadata: Metadata = {
  title: 'Services - Muuttokone',
  description: 'Our moving services.',
};

async function getServicesData() {
  try {
    // Try to get services from Directus with caching
    const directusServices = await getServices();
    if (directusServices?.length > 0) {
      return directusServices;
    }
    // Fallback to static data if no Directus services
    return serviceData;
  } catch (error) {
    console.warn('Failed to fetch services from Directus, using static data:', error);
    return serviceData;
  }
}

const ServicesPage: NextPage = async () => {
  const items = await getServicesData();
  return (
    <>
      <Services
        title="Our Services"
        subtitle="We offer a wide range of moving services to meet your needs."
        items={items}
      />

      <section className="py-8">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="shadow-3 flex items-center justify-between gap-4 rounded-lg bg-white p-4 dark:bg-black">
            <div>
              <strong>Trusted by over 10,000 customers</strong>
              <p className="text-sm">
                Google rating: 4.9/5 — Member of Finnish Moving Companies Association
              </p>
            </div>
            <div className="flex gap-4">
              <Image
                src="/images/brand/brand-dark-01.svg"
                alt="partner"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <Image
                src="/images/brand/brand-dark-02.svg"
                alt="partner"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <Image
                src="/images/brand/brand-dark-03.svg"
                alt="partner"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-whiter dark:bg-blacksection py-12">
        <SectionTitle
          title="How our process works"
          subtitle="From a quick quote to a full-service move — clear steps and optional virtual surveys to ensure accurate estimates."
        />

        <div className="mx-auto mt-8 max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="shadow-3 rounded-lg bg-white p-6 dark:bg-black">
              <h4 className="mb-2 font-medium">1. Quick Quote</h4>
              <p className="text-sm">
                Provide basic details online (move date, origin, destination) to get a ballpark
                estimate.
              </p>
            </div>

            <div className="shadow-3 rounded-lg bg-white p-6 dark:bg-black">
              <h4 className="mb-2 font-medium">2. Free Survey</h4>
              <p className="text-sm">
                Choose a free virtual or on-site survey for an accurate, itemized quote.
              </p>
            </div>

            <div className="shadow-3 rounded-lg bg-white p-6 dark:bg-black">
              <h4 className="mb-2 font-medium">3. Move Day</h4>
              <p className="text-sm">
                Professional crew, insured handling, and optional packing/assembly services.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <SectionTitle
          title="Request a free quote"
          subtitle="A short form is enough — we'll follow up to schedule a survey or provide a detailed estimate."
        />

        <div className="mx-auto mt-8 flex justify-center px-4 md:px-8 xl:px-21">
          <ContactFormBox />
        </div>
      </section>

      <Cta />
    </>
  );
};

export default ServicesPage;
