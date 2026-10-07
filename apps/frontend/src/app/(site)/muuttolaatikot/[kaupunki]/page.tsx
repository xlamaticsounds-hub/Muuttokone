import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { generateSEOMetadata } from '@/components/SEO/SEOHelpers';
import StructuredData from '@/components/SEO/StructuredData';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import RentalOrderForm from '@/features/vuokraus/RentalOrderForm';
import RentalHeroImage from '@/features/vuokraus/RentalHeroImage';
import { BOX_CITIES, getBoxCity, getBoxCityFaq, getBoxCitySeo } from '@/features/vuokraus/boxCityData';
import { buildBreadcrumbSchema, buildRentalProductSchema } from '@/features/vuokraus/productSchema';
import { BOX_ITEM_ID, RENTAL_DELIVERY, formatPricePerDay, getRentalItem } from '@/features/vuokraus/rental';

type CityParams = { params: Promise<{ kaupunki: string }> };

// Vain tunnetut kaupungit; muu osoite palauttaa 404:n.
export const dynamicParams = false;

export function generateStaticParams() {
  return BOX_CITIES.map((city) => ({ kaupunki: city.slug }));
}

export async function generateMetadata({ params }: CityParams): Promise<Metadata> {
  const { kaupunki } = await params;
  const city = getBoxCity(kaupunki);
  if (!city) return {};
  const seo = getBoxCitySeo(city);
  return generateSEOMetadata({
    ...seo,
    openGraph: { title: seo.title, description: seo.description, image: '/images/webp/muuttolaatikot/muuttolaatikko.webp', type: 'website' },
  });
}

export default async function MuuttolaatikotKaupunkiPage({ params }: CityParams) {
  const { kaupunki } = await params;
  const city = getBoxCity(kaupunki);
  const box = getRentalItem(BOX_ITEM_ID);
  if (!city || !box) notFound();

  const faq = getBoxCityFaq(city);
  const otherCities = BOX_CITIES.filter((c) => c.slug !== city.slug);
  const path = `/muuttolaatikot/${city.slug}`;

  return (
    <>
      <StructuredData type="Product" data={buildRentalProductSchema(box, { path, areaServed: [city.name] })} />
      <StructuredData type="FAQPage" data={{ faqs: faq }} />
      <StructuredData
        type="BreadcrumbList"
        data={buildBreadcrumbSchema([
          { name: 'Etusivu', path: '/' },
          { name: 'Muuttolaatikot', path: '/muuttolaatikot' },
          { name: city.name, path },
        ])}
      />

      {/* Hero */}
      <section className="bg-primary relative overflow-hidden py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/80">
              <MapPin className="h-4 w-4" /> {city.name}
            </p>
            <h1 className="mb-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Muuttolaatikot vuokralle {city.inessive}</h1>
            <p className="mb-8 text-lg text-white/90">{city.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="#tilaa" className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-medium text-black duration-300 ease-out">
                Vuokraa laatikot
              </Link>
              <Link href="/muuttolaskuri" className="inline-flex rounded-full border border-white/60 px-7.5 py-3 font-medium text-white duration-300 ease-out hover:bg-white/10">
                Laske myös muuton hinta
              </Link>
            </div>
          </div>
          <RentalHeroImage />
          </div>
        </div>
      </section>

      {/* Hinta ja toimitus */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
              <p className="text-3xl font-bold text-primary">{formatPricePerDay(box.pricePerDay)}</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">laatikko / vuorokausi, ALV mukana</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
              <p className="text-3xl font-bold text-primary">0 €</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">toimitus ja nouto muuton yhteydessä tai kun vuokra on vähintään {RENTAL_DELIVERY.freeFromRental} €</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
              <p className="text-3xl font-bold text-primary">{RENTAL_DELIVERY.feeBothWays} €</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">toimitus ja nouto yhteensä muissa tapauksissa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Toimitusalue */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-2xl font-bold text-black/90 dark:text-white sm:text-3xl">Toimitusalue {city.inessive}</h2>
              <p className="mb-4 text-black/70 dark:text-white/70">
                Toimitamme laatikot kaikkiin osoitteisiin, joiden postinumero kuuluu alueeseen: {city.postalCodes}. Muun muassa seuraaviin kaupunginosiin:
              </p>
              <ul className="flex flex-wrap gap-2">
                {city.districts.map((district) => (
                  <li key={district} className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                    {district}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
              <h3 className="mb-2 text-lg font-semibold text-black/90 dark:text-white">{city.localTip.title}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{city.localTip.text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tilauslomake */}
      <section id="tilaa" className="scroll-mt-20 bg-gray-1 py-16 lg:py-24 dark:bg-bg-color-dark">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-10 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Tilaa</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Vuokraa muuttolaatikot {city.inessive}</h2>
            <p className="mt-2 text-black/70 dark:text-white/70">Valitse määrä, vuokra-aika ja toimituspäivä – näet hinnan heti.</p>
          </div>
          <RentalOrderForm />
        </div>
      </section>

      <Faq title={`Usein kysyttyä: muuttolaatikot ${city.inessive}`} subtitle="Toimitus, hinta ja laatikoiden määrä." items={faq} />

      {/* Muut alueet */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p className="text-black/70 dark:text-white/70">
            Toimitamme muuttolaatikot koko pääkaupunkiseudulle:{' '}
            {otherCities.map((other, index) => (
              <span key={other.slug}>
                {index > 0 ? ', ' : ''}
                <Link href={`/muuttolaatikot/${other.slug}`} className="font-semibold text-primary hover:underline">
                  {other.name}
                </Link>
              </span>
            ))}
            . Katso myös{' '}
            <Link href="/muuttolaatikot" className="font-semibold text-primary hover:underline">
              kaikki tiedot muuttolaatikoiden vuokrauksesta
            </Link>
            .
          </p>
        </div>
      </section>

      <Cta
        title="Muutat pian?"
        description="Lisää laatikot muuttolaskurin lisäpalveluihin – toimitus ja nouto ovat silloin ilmaiset."
        href="/muuttolaskuri"
        label="Laske muuton hinta"
      />
    </>
  );
}
