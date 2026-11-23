import type { Metadata } from 'next';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import StructuredData from '@/components/SEO/StructuredData';
import { organizationRef } from '@/components/SEO/organization';
import { generateSEOMetadata } from '@/components/SEO/SEOHelpers';
import { buildBreadcrumbSchema } from '@/features/vuokraus/productSchema';
import {
  CalculatorSection,
  CityLinks,
  ContactBanner,
  InfoCards,
  LandingHero,
  MovingSteps,
  PackagesSection,
  ServiceCards,
  TrustBar,
} from '@/features/landing/LandingSections';
import { getServicePage, type ServicePageSlug } from './servicePages';

export function servicePageMetadata(slug: ServicePageSlug): Metadata {
  const page = getServicePage(slug);
  return generateSEOMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    keywords: page.keywords,
    canonical: page.path,
    openGraph: { title: page.seoTitle, description: page.seoDescription, image: '/images/og/muuttokone-tiimi.jpg', type: 'website' },
  });
}

// Palvelusivu: sama rakenne kuin kaupunkisivuilla, sisältö servicePages.ts:stä.
export default function ServicePageContent({ slug }: { slug: ServicePageSlug }) {
  const page = getServicePage(slug);
  const siteUrl = process.env.SITE_URL ?? 'https://muuttokone.fi';

  return (
    <>
      <StructuredData
        type="Custom"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: page.h1,
          serviceType: page.name,
          url: `${siteUrl}${page.path}`,
          description: page.lead,
          provider: organizationRef(siteUrl),
          areaServed: ['Helsinki', 'Espoo', 'Vantaa', 'Tampere'].map((name) => ({ '@type': 'City', name })),
        }}
      />
      <StructuredData type="FAQPage" data={{ faqs: page.faq }} />
      <StructuredData
        type="BreadcrumbList"
        data={buildBreadcrumbSchema([
          { name: 'Etusivu', path: '/' },
          { name: 'Muuttopalvelut', path: '/palvelut' },
          { name: page.name, path: page.path },
        ])}
      />

      <LandingHero
        crumbs={[{ name: 'Etusivu', href: '/' }, { name: 'Muuttopalvelut', href: '/palvelut' }, { name: page.name }]}
        eyebrow={page.eyebrow}
        title={page.h1}
        lead={page.lead}
        firstImage={page.heroImage}
        ctaLabel={page.ctaLabel}
      />
      <TrustBar />
      <CalculatorSection
        title={page.calculator.title}
        text={page.calculator.text}
        initialService={page.calculator.service}
        initialCleaning={page.calculator.cleaning}
      />
      {page.packagesTitle && <PackagesSection title={page.packagesTitle} />}
      <InfoCards eyebrow={page.name} title={page.infoTitle} sections={page.sections} />
      <MovingSteps />
      <ServiceCards title="Muut palvelumme" services={page.related} />
      <ContactBanner title={page.contactTitle} />
      <Faq title={page.faqTitle} subtitle="Vastauksia yleisimpiin kysymyksiin." items={page.faq} />
      <CityLinks title="Palvelualueet" />
      <Cta title={page.ctaTitle} description="Laske hinta heti tai pyydä tarjous – vastaamme yleensä vuorokauden sisällä." href="#laskuri" label="Laske hinta" />
    </>
  );
}
