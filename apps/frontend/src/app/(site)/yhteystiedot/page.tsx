import type { Metadata } from 'next';
import Contact from '@/features/contact';
import Team from '@/features/team';
import OurStory from '@/components/OurStory';
import CompanyFacts from '@/components/CompanyFacts';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.contact,
  openGraph: {
    title: SEOConfigs.contact.title,
    description: SEOConfigs.contact.description,
    image: '/images/webp/hero/hero.webp',
    type: 'website',
  },
});

export default function Page() {
  return (
    <>
      <section className="pt-16 lg:pt-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="xl:text-title-xl mb-4 text-3xl font-semibold text-black md:text-4xl dark:text-white">Yhteystiedot</h1>
          <p className="text-black/70 dark:text-white/70">
            Palvelemme joka päivä pääkaupunkiseudulla ja Tampereella. Soita, lähetä sähköpostia tai jätä viesti lomakkeella.
          </p>
          <p className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold">
            <a href={`tel:${siteConfig.contact.phone.tel}`} className="text-primary hover:underline">
              {siteConfig.contact.phone.display}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="text-primary hover:underline">
              {siteConfig.contact.email}
            </a>
          </p>
        </div>
      </section>
      <Team />
      <OurStory />
      <Contact />
      <CompanyFacts />
    </>
  );
}
