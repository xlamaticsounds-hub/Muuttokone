import Link from 'next/link';
import { MapPin, ShieldCheck, Clock, Wallet } from 'lucide-react';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import type { CityData } from './cityData';

const trustPoints = [
  { icon: ShieldCheck, title: 'Vakuutettu kuljetus', desc: 'Kaikki kuljetukset vakuutettu tiekuljetuslain mukaisesti.' },
  { icon: Wallet, title: 'Kiinteä hinta', desc: 'Näet hinnan etukäteen muuttolaskurilla — ei piilokuluja.' },
  { icon: Clock, title: 'Joustava aikataulu', desc: 'Sovimme ajankohdan, joka sopii sinulle parhaiten.' },
];

export default function CityPageContent({ city }: { city: CityData }) {
  return (
    <>
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="max-w-2xl">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <MapPin className="h-4 w-4" /> {city.name}
            </p>
            <h1 className="mb-5 text-3xl font-bold text-black/90 dark:text-white sm:text-4xl lg:text-5xl">
              {city.title}
            </h1>
            <p className="mb-8 text-lg text-black/70 dark:text-white/70">{city.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/muuttolaskuri"
                className="hover:shadow-1 inline-flex rounded-full bg-primary px-7.5 py-3 font-medium text-white duration-300 ease-out"
              >
                Laske hinta {city.illative}
              </Link>
              <Link
                href="/yhteystiedot"
                className="inline-flex rounded-full border border-gray-300 px-7.5 py-3 font-medium text-black/80 duration-300 ease-out hover:border-primary dark:border-gray-700 dark:text-white"
              >
                Ota yhteyttä
              </Link>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-10 max-w-2xl">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Palvelualue</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">
              Muutot {city.inessive} ja lähialueilla
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {city.districts.map((district) => (
              <span
                key={district}
                className="rounded-full border border-black/5 bg-white/80 px-4 py-2 text-sm font-medium text-black/80 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-white/80 dark:ring-white/5"
              >
                {district}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">
            Palvelumme kattavat kotimuutot, yritysmuutot, pakkauspalvelun ja kuljetukset — katso{' '}
            <Link href="/palvelut" className="font-semibold text-primary hover:underline">
              kaikki palvelumme
            </Link>
            .
          </p>
        </div>
      </section>

      <Faq />

      <Cta
        title={`Suunnitteletko muuttoa ${city.illative.toLowerCase()}?`}
        description="Saat meiltä maksuttoman kartoituksen ja tarjouksen 24 tunnin sisällä."
        href="/muuttolaskuri"
        label="Pyydä tarjous"
      />
    </>
  );
}
