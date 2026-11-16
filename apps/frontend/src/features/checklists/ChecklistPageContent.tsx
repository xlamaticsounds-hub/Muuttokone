import type { Metadata } from 'next';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import StructuredData from '@/components/SEO/StructuredData';
import { generateSEOMetadata } from '@/components/SEO/SEOHelpers';
import { buildBreadcrumbSchema } from '@/features/vuokraus/productSchema';
import { CalculatorSection, ContactBanner, InfoCards, LandingHero, ServiceCards } from '@/features/landing/LandingSections';
import InteractiveChecklist from './InteractiveChecklist';
import { CHECKLIST_PAGES, getChecklistPage, type ChecklistPage } from './checklists';

// Sisällön viimeisin tarkistus (näkyy sivulla ja Article-schemassa). Päivitä, kun listaa muutetaan.
const UPDATED = '2026-11-15';
const UPDATED_LABEL = 'Päivitetty marraskuussa 2026';

export function checklistMetadata(slug: ChecklistPage['slug']): Metadata {
  const page = getChecklistPage(slug);
  return generateSEOMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    keywords: page.keywords,
    canonical: page.path,
    openGraph: { title: page.seoTitle, description: page.seoDescription, image: '/images/webp/hero/hero.webp', type: 'article' },
  });
}

const siteUrl = () => process.env.SITE_URL ?? 'https://muuttokone.fi';

// Muistilistasivu: hero, rastitettava ja tulostettava lista, vinkit, laskuri ja UKK. Muu kuin lista piilotetaan tulosteesta.
export default function ChecklistPageContent({ slug }: { slug: ChecklistPage['slug'] }) {
  const page = getChecklistPage(slug);
  const other = CHECKLIST_PAGES.find((p) => p.slug !== slug)!;
  const isBusiness = slug === 'yritysmuuton-muistilista';

  return (
    <>
      <StructuredData
        type="Custom"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: page.h1,
          description: page.seoDescription,
          dateModified: UPDATED,
          inLanguage: 'fi',
          mainEntityOfPage: `${siteUrl()}${page.path}`,
          author: { '@type': 'Organization', name: 'Muuttokone.fi', url: siteUrl() },
          publisher: { '@type': 'Organization', name: 'Muuttokone.fi', logo: { '@type': 'ImageObject', url: `${siteUrl()}/images/logo/logo.png` } },
        }}
      />
      <StructuredData type="FAQPage" data={{ faqs: page.faq }} />
      <StructuredData
        type="BreadcrumbList"
        data={buildBreadcrumbSchema([
          { name: 'Etusivu', path: '/' },
          { name: 'Muuttoblogi', path: '/blogi' },
          { name: page.h1, path: page.path },
        ])}
      />

      <div className="print:hidden">
        <LandingHero
          crumbs={[{ name: 'Etusivu', href: '/' }, { name: 'Muuttoblogi', href: '/blogi' }, { name: page.h1 }]}
          eyebrow={page.eyebrow}
          eyebrowIcon="list"
          title={page.h1}
          lead={page.lead}
          firstImage={page.heroImage}
        />
      </div>

      {/* Lista: ainoa osa, joka tulostuu */}
      <section className="py-14 lg:py-20 print:py-0">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          {/* Tulosteen otsikko (ei H1: sivun ainoa H1 on herossa) */}
          <div className="mb-8 hidden print:block">
            <p className="text-2xl font-bold">{page.h1}</p>
            <p className="text-sm">muuttokone.fi{page.path}</p>
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <p className="text-sm text-black/60 dark:text-white/60">{UPDATED_LABEL}</p>
            <nav aria-label="Vaiheet" className="flex flex-wrap gap-2">
              {page.phases.map((phase) => (
                <a key={phase.id} href={`#${phase.id}`} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold hover:bg-primary/20">
                  {phase.title}
                </a>
              ))}
            </nav>
          </div>
          <InteractiveChecklist phases={page.phases} storageKey={page.storageKey} />
        </div>
      </section>

      <div className="print:hidden">
        <InfoCards eyebrow="Vinkit" title={isBusiness ? 'Näin toimistomuutto sujuu' : 'Näin muutto sujuu helpommin'} sections={page.tips} />
        <CalculatorSection
          title={isBusiness ? 'Laske muuton hinta tai pyydä kartoitus' : 'Lista valmis? Laske muuton hinta'}
          text={
            isBusiness
              ? 'Pieneen toimistomuuttoon näet hinnan heti laskurista. Isommista muutoista teemme maksuttoman kartoituksen.'
              : 'Syötä osoitteet ja tavarat, niin näet kiinteän hinnan heti. Laskeminen ei sido sinua mihinkään.'
          }
        />
        <ServiceCards
          title="Apua muuttoon"
          services={[
            { icon: '/icons/tyoapu/kantoapu.png', title: 'Muuttoapu', text: 'Muuttomiehet, kantoapu tai kuljettaja autolla.', href: '/muuttoapu' },
            { icon: '/icons/palvelut/muuttolaatikot.png', title: 'Muuttolaatikot', text: 'Vuokralaatikot kotiovelle ja nouto tyhjinä.', href: '/muuttolaatikot' },
            { icon: '/icons/palvelut/yritysmuutto.png', title: 'Yritysmuutot', text: 'Toimistot ja liiketilat ilman käyttökatkoa.', href: '/yrityksille' },
            { icon: '/icons/tyoapu/kerro-tarpeesi.png', title: other.h1, text: isBusiness ? 'Kotimuuton tehtävät aikajärjestyksessä.' : 'Toimistomuuton tehtävät aikajärjestyksessä.', href: other.path },
          ]}
        />
        <ContactBanner title={isBusiness ? 'Suunnitteletteko toimistomuuttoa?' : 'Haluatko, että hoidamme muuton puolestasi?'} />
        <Faq title={`Usein kysyttyä: ${page.h1.toLowerCase()}`} subtitle="Vastauksia yleisimpiin kysymyksiin muuton valmistelusta." items={page.faq} />
        <Cta
          title={isBusiness ? 'Muutto ilman käyttökatkoa' : 'Muutto ilman stressiä'}
          description="Laske hinta heti tai pyydä tarjous – vastaamme yleensä vuorokauden sisällä."
          href="#laskuri"
          label="Laske hinta"
        />
      </div>
    </>
  );
}
