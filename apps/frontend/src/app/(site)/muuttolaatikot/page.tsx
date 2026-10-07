import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeEuro, Receipt, Clock } from 'lucide-react';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import StructuredData from '@/components/SEO/StructuredData';
import ProcessSteps from '@/components/ProcessSteps';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import Image from 'next/image';
import RentalOrderForm from '@/features/vuokraus/RentalOrderForm';
import RentalHeroImage from '@/features/vuokraus/RentalHeroImage';
import { vuokrausFaqData, vuokrausProcessSteps } from '@/features/vuokraus/vuokrausData';
import { RENTAL_DELIVERY, formatPricePerDay, getAvailableRentalItems } from '@/features/vuokraus/rental';
import { BOX_CITIES } from '@/features/vuokraus/boxCityData';
import { buildBreadcrumbSchema, buildRentalProductSchema } from '@/features/vuokraus/productSchema';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.muuttolaatikot,
  openGraph: {
    title: SEOConfigs.muuttolaatikot.title,
    description: SEOConfigs.muuttolaatikot.description,
    image: '/images/webp/muuttolaatikot/muuttolaatikko.webp',
    type: 'website',
  },
});

// Vuokrattavat tuotteet luetaan features/vuokraus/rental.ts:stä (RENTAL_ITEMS). Uusi tuote
// ilmestyy tämän sivun tuotekortteihin, tilauslomakkeelle, UKK:hon ja käyttöehtoihin lisäämällä
// se sinne. Hero- ja luottamusrivin tekstit ovat käsin kirjoitettuja — päivitä ne kun valikoima kasvaa.
const items = getAvailableRentalItems();
const freeFrom = `${RENTAL_DELIVERY.freeFromRental} €`;
const deliveryFee = `${RENTAL_DELIVERY.feeBothWays} €`;

const trustPoints = [
  {
    icon: BadgeEuro,
    title: 'Ilmainen toimitus',
    desc: `Toimitus ja nouto kotiovelle ilmaiseksi muuton yhteydessä tai kun vuokra on vähintään ${freeFrom}. Muuten ${deliveryFee} yhteensä.`,
  },
  {
    icon: Receipt,
    title: 'Selkeä hinta',
    desc: 'Hinta näkyy heti ja ALV on mukana. Vuokra lasketaan toimituksesta noutoon.',
  },
  {
    icon: Clock,
    title: 'Joustava vuokra-aika',
    desc: 'Valitset vuokra-ajan itse. Vuokra jatkuu samalla päivähinnalla, kunnes noudamme tuotteet.',
  },
];

export default function MuuttolaatikotPage() {
  return (
    <>
      <StructuredData type="FAQPage" data={{ faqs: vuokrausFaqData }} />
      {items.map((item) => (
        <StructuredData key={item.id} type="Product" data={buildRentalProductSchema(item, { path: '/muuttolaatikot' })} />
      ))}
      <StructuredData
        type="BreadcrumbList"
        data={buildBreadcrumbSchema([
          { name: 'Etusivu', path: '/' },
          { name: 'Muuttolaatikot', path: '/muuttolaatikot' },
        ])}
      />

      {/* Hero */}
      <section className="bg-primary relative overflow-hidden py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Muuttolaatikot</p>
            <h1 className="mb-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Muuttolaatikot vuokralle Helsingissä, Espoossa ja Vantaalla
            </h1>
            <p className="mb-8 text-lg text-white/90">
              Kestävät, pinottavat muuttolaatikot ilman pahvijätettä – toimitamme kotiovelle koko pääkaupunkiseudulle. Toimitus
              ja nouto ilmaiseksi muuton yhteydessä tai kun vuokra on vähintään {freeFrom}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#tilaa"
                className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-medium text-black duration-300 ease-out"
              >
                Vuokraa nyt
              </Link>
              <Link
                href="#hinnat"
                className="inline-flex rounded-full border border-white/60 px-7.5 py-3 font-medium text-white duration-300 ease-out hover:bg-white/10"
              >
                Katso hinnat
              </Link>
            </div>
          </div>
          <RentalHeroImage />
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="relative rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-8 dark:border-white/10 dark:bg-white/5 dark:ring-white/5">
            <div className="grid gap-7.5 sm:grid-cols-3">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-black/90 dark:text-white">{point.title}</h3>
                      <p className="text-sm text-black/70 dark:text-white/70">{point.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Vuokrattavat tuotteet */}
      <section id="hinnat" className="scroll-mt-20 py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-8 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Vuokrattavat tuotteet</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Mitä voit vuokrata?</h2>
          </div>
          {/* Keskitetty rivi: yksi tuote ei jää yksinäiseksi vasempaan reunaan, ja uudet tuotteet täyttävät rivin. */}
          <div className="flex flex-wrap justify-center gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex w-full flex-col rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? item.title}
                    width={1200}
                    height={800}
                    sizes="(min-width: 1024px) 400px, 90vw"
                    className="mb-4 h-auto w-full rounded-xl bg-white"
                  />
                ) : (
                  <div className="mb-3 text-4xl">{item.emoji}</div>
                )}
                <h3 className="text-xl font-semibold text-black/90 dark:text-white">{item.title}</h3>
                {!item.inStock && (
                  <p className="mt-1 inline-block self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Tilapäisesti loppu – jätä pyyntö, niin otamme yhteyttä
                  </p>
                )}
                <p className="mt-1 text-2xl font-bold text-primary">
                  {formatPricePerDay(item.pricePerDay)} <span className="text-sm font-medium text-black/60 dark:text-white/60">/ kpl / vrk</span>
                </p>
                <p className="mt-3 text-sm text-black/70 dark:text-white/70">{item.description}</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-black/70 dark:text-white/70">
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                  <li>
                    Määrä {item.qty.min}–{item.qty.max} kpl, vuokra-aika {item.days.min}–{item.days.max} vrk
                  </li>
                  {item.lostFee ? <li>Kadonnut tai rikki: {item.lostFee} € / kpl</li> : null}
                </ul>
                <Link
                  href="#tilaa"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-primary/90"
                >
                  Vuokraa
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Toimitusalue */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-8 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Toimitusalue</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Toimitamme koko pääkaupunkiseudulle</h2>
            <p className="mx-auto mt-2 max-w-2xl text-black/70 dark:text-white/70">
              Helsinki, Espoo, Vantaa ja Kauniainen. Valitse oma kaupunkisi nähdäksesi alueet ja paikalliset tiedot.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {BOX_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/muuttolaatikot/${city.slug}`}
                className="rounded-2xl border border-black/5 bg-white/80 p-5 text-center shadow-sm ring-1 ring-black/5 transition-colors hover:border-primary dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5"
              >
                <span className="block text-lg font-semibold text-black/90 dark:text-white">Muuttolaatikot {city.inessive}</span>
                <span className="mt-1 block text-xs text-black/60 dark:text-white/60">{city.districts.slice(0, 4).join(', ')} ja muut</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tilauslomake */}
      <section id="tilaa" className="scroll-mt-20 bg-gray-1 py-16 lg:py-24 dark:bg-bg-color-dark">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-10 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Tilaa</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Tee vuokrauspyyntö</h2>
            <p className="mt-2 text-black/70 dark:text-white/70">
              Valitse tuotteet ja toimituspäivä – näet hinnan heti. Vahvistamme toimituksen puhelimitse tai sähköpostitse.
            </p>
          </div>
          <RentalOrderForm />
        </div>
      </section>

      {/* Näin se toimii */}
      <ProcessSteps
        eyebrow="Näin vuokraat"
        title="Helppoa alusta loppuun"
        subtitle="Valitse tuotteet, me toimitamme ja noudamme."
        steps={vuokrausProcessSteps}
      />

      {/* Ehdot lyhyesti */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-8 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
            <h2 className="mb-4 text-xl font-bold text-black/90 dark:text-white">Vuokrausehdot lyhyesti</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-black/70 dark:text-white/70">
              <li>Hinnat sisältävät ALV:n (25,5 %). Vuokra lasketaan toimituspäivästä noutopäivään.</li>
              {items.map((item) => (
                <li key={item.id}>
                  {item.title}: {formatPricePerDay(item.pricePerDay)} / kpl / vrk, vähintään {item.qty.min} ja enintään {item.qty.max} kpl,
                  vuokra-aika {item.days.min}–{item.days.max} vrk.
                  {item.lostFee ? ` Kadonneesta tai rikkoutuneesta tuotteesta veloitetaan ${item.lostFee} € / kpl.` : ''}
                </li>
              ))}
              <li>
                Toimitus kotiovelle ja nouto pääkaupunkiseudulla ovat ilmaiset muuton yhteydessä tai kun vuokran arvo on vähintään {freeFrom}.
                Muuten toimituksesta ja noudosta veloitetaan yhteensä {deliveryFee}.
              </li>
              <li>Tuotteet palautetaan tyhjinä sovittuna noutopäivänä. Vuokra jatkuu, kunnes tuotteet on noudettu.</li>
            </ul>
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">
              Kaikki ehdot löytyvät{' '}
              <Link href="/kayttoehdot" className="font-semibold text-primary hover:underline">
                käyttöehdoista
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Faq
        title="Usein kysyttyä vuokrauksesta"
        subtitle="Hinnat, toimitus ja nouto sekä vuokra-aika."
        items={vuokrausFaqData}
      />

      <Cta
        title="Muutat pian?"
        description="Lisää laatikot muuttolaskurin lisäpalveluihin – toimitus ja nouto ovat silloin ilmaiset."
        href="/muuttolaskuri"
        label="Laske muuton hinta"
      />
    </>
  );
}
