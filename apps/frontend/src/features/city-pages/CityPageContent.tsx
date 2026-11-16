import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import StructuredData from '@/components/SEO/StructuredData';
import { buildBreadcrumbSchema } from '@/features/vuokraus/productSchema';
import {
  CalculatorSection,
  CityLinks,
  ContactBanner,
  InfoCards,
  LandingHero,
  MASCOT,
  MovingSteps,
  PackagesSection,
  ServiceCards,
  TrustBar,
  card,
  container,
  type ServiceCard,
} from '@/features/landing/LandingSections';
import { CITY_PAGES, getCityPage, type CitySlug } from './cityData';
import { buildCityServiceSchema } from './citySchema';

// Kaupunkisivu (/muuttopalvelu-<kaupunki>): paikallinen sisältö cityData.ts:stä, osiot LandingSections.tsx:stä.
export default function CityPageContent({ slug }: { slug: CitySlug }) {
  const city = getCityPage(slug);
  const cityByName = new Map(CITY_PAGES.map((c) => [c.name, c]));

  const services: ServiceCard[] = [
    { icon: '/icons/palvelut/pakkauspalvelu.png', title: 'Kaikki muuttopalvelut', text: 'Pakkaus, muuttosiivous, kuolinpesät ja kuljetukset.', href: '/palvelut' },
    { icon: '/icons/tyoapu/kantoapu.png', title: 'Muuttoapu ja kantoapu', text: 'Muuttomiehet ja lisäkädet juuri tarpeeseen.', href: '/muuttoapu' },
    { icon: '/icons/palvelut/yritysmuutto.png', title: 'Yritysmuutot', text: 'Toimistot ja liiketilat, myös iltaisin ja viikonloppuisin.', href: '/yrityksille' },
    city.boxPath
      ? { icon: '/icons/palvelut/muuttolaatikot.png', title: `Muuttolaatikot ${city.inessive}`, text: 'Vuokralaatikot kotiovelle ja nouto tyhjinä.', href: city.boxPath }
      : { icon: '/icons/tyoapu/kerro-tarpeesi.png', title: 'Muuttoblogi', text: 'Muistilistat ja vinkit muuton suunnitteluun.', href: '/blogi' },
  ];

  return (
    <>
      <StructuredData type="Custom" data={buildCityServiceSchema(city)} />
      <StructuredData type="FAQPage" data={{ faqs: city.faq }} />
      <StructuredData
        type="BreadcrumbList"
        data={buildBreadcrumbSchema([
          { name: 'Etusivu', path: '/' },
          { name: 'Muuttopalvelut', path: '/palvelut' },
          { name: city.name, path: city.path },
        ])}
      />

      <LandingHero
        crumbs={[{ name: 'Etusivu', href: '/' }, { name: 'Muuttopalvelut', href: '/palvelut' }, { name: city.name }]}
        eyebrow={city.baseNote}
        title={city.h1}
        lead={city.lead}
        firstImage={city.heroImage}
      />
      <TrustBar />
      <CalculatorSection
        title={city.localByQuote ? `Laske muuton hinta ${city.illative} tai ${city.elative}` : `Laske muuton hinta ${city.inessive}`}
        text={
          city.localByQuote
            ? `Kaukomuuton hinnan näet heti. Kaupungin sisäisissä muutoissa ${city.inessive} lähetämme tarjouksen sähköpostiisi.`
            : 'Syötä osoitteet ja tavarat, niin näet kiinteän hinnan heti. Laskeminen ei sido sinua mihinkään.'
        }
      />
      <PackagesSection />
      <InfoCards eyebrow={city.name} title={`Muutto ${city.inessive} – hyvä tietää`} sections={city.sections} />
      <MovingSteps />

      {/* Palvelualue (kaupunkikohtainen) */}
      <section className="py-14 lg:py-20">
        <div className={container}>
          <div className={`${card} grid items-center gap-8 overflow-hidden p-7 md:p-10 lg:grid-cols-[1fr_auto]`}>
            <div>
              <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Palvelualue</p>
              <h2 className="mb-6 text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">Muutot {city.inessive} ja lähialueilla</h2>
              <ul className="flex flex-wrap gap-2">
                {city.districts.map((district) => (
                  <li key={district} className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {district}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-black/70 dark:text-white/70">
                {city.nearby.text}{' '}
                {city.nearby.places.map((place, index) => {
                  const page = cityByName.get(place);
                  return (
                    <span key={place}>
                      {page ? (
                        <Link href={page.path} className="text-primary font-semibold hover:underline">{place}</Link>
                      ) : (
                        place
                      )}
                      {index < city.nearby.places.length - 1 ? ', ' : '.'}
                    </span>
                  );
                })}
              </p>
            </div>
            {/* Kuvassa on vaalea tausta: multiply sulauttaa sen valkoiseen korttiin */}
            <Image src={MASCOT.keys} alt="" width={320} height={320} className="mx-auto hidden h-56 w-56 object-contain mix-blend-multiply lg:block dark:mix-blend-normal" />
          </div>
        </div>
      </section>

      <ServiceCards title={`Palvelut ${city.inessive}`} services={services} />
      <ContactBanner title={`Kysyttävää muutosta ${city.inessive}?`} />
      <Faq title={`Usein kysyttyä: muutto ${city.inessive}`} subtitle={`Vastauksia yleisimpiin kysymyksiin muutosta ${city.inessive}.`} items={city.faq} />
      <CityLinks exclude={city.slug} />
      <Cta
        title={`Suunnitteletko muuttoa ${city.illative}?`}
        description="Laske hinta heti tai pyydä tarjous – vastaamme yleensä vuorokauden sisällä."
        href="#laskuri"
        label="Laske hinta"
      />
    </>
  );
}
