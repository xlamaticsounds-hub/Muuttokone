'use client';

import React from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/useT';
import { useLocale } from '@/i18n/LocaleContext';
import { boxRentalDictionary } from '@/i18n/homeDictionary';
import { BOX_RENTAL } from '@/features/calculator/boxRental';
import { BOX_CITIES } from '@/features/vuokraus/boxCityData';

const STEPS = [
  {
    title: 'Valitse laatikot',
    text: 'Lisää laatikot lisäpalveluna muuttolaskuriin. Laskuri ehdottaa määrän tavaralistasi tai asunnon koon mukaan.',
  },
  {
    title: 'Toimitamme kotiovelle',
    text: 'Laatikot tulevat sovittuna päivänä noin viikkoa ennen muuttoa.',
  },
  {
    title: 'Pakkaa ja muuta',
    text: 'Samanlaiset pinottavat laatikot kulkevat suoraan muuttoautoon, joten muutto sujuu nopeammin.',
  },
  {
    title: 'Noudamme tyhjät laatikot',
    text: 'Haemme laatikot uudesta kodistasi. Vuokra lasketaan toimituksesta noutoon.',
  },
];

const cardClass =
  'rounded-3xl bg-white p-6 shadow-solid-8 transition-all hover:shadow-solid-4 dark:bg-blacksection dark:border dark:border-strokedark';

export default function BoxRentalSection() {
  const t = useT(boxRentalDictionary);
  const { locale } = useLocale();

  const rate = locale === 'en' ? `€${BOX_RENTAL.ratePerBoxPerDay.toFixed(2)}` : `${BOX_RENTAL.ratePerBoxPerDay.toFixed(2).replace('.', ',')} €`;
  const freeFrom = locale === 'en' ? `€${BOX_RENTAL.freeDeliveryMinRental}` : `${BOX_RENTAL.freeDeliveryMinRental} €`;
  const deliveryFee = locale === 'en' ? `€${BOX_RENTAL.deliveryFeeBothWays}` : `${BOX_RENTAL.deliveryFeeBothWays} €`;

  return (
    <section id="laatikkovuokra" className="relative z-20 scroll-mt-24 py-16 lg:py-20">
      <div className="mx-auto max-w-1390 px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Vasen: viesti ja toimintakutsu */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {t('Uusi palvelu')}
            </span>
            <h2 className="mb-4 text-3xl font-semibold text-black xl:text-title-xl dark:text-white">
              {t('Muuttolaatikot vuokralle')}
            </h2>
            <p className="mb-6 text-black/70 dark:text-white/70">
              {t('Älä osta pahvilaatikoita, jotka päätyvät roskiin. Vuokraa kestävät, pinottavat muuttolaatikot – toimitamme kotiovelle ja noudamme tyhjinä muuton jälkeen.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#muuttolaskuri"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-3 font-medium text-white duration-300 ease-in-out hover:bg-primary/90"
              >
                {t('Lisää laatikot muuttoon')}
              </a>
              <Link
                href="/muuttolaatikot"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary/10 px-7 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white dark:bg-white/10 dark:hover:bg-primary"
              >
                {t('Vuokraa vain laatikot')}
              </Link>
            </div>
            <p className="mt-4 text-xs text-black/50 dark:text-white/50">
              {t('Hinnat sisältävät ALV:n. Toimitus pääkaupunkiseudulle.')}
            </p>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {t('Toimitusalue')}:{' '}
              {BOX_CITIES.map((city, index) => (
                <span key={city.slug}>
                  {index > 0 ? ' · ' : ''}
                  <Link href={`/muuttolaatikot/${city.slug}`} className="font-semibold text-primary hover:underline">
                    {city.name}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* Oikea: hinnat */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cardClass}>
              <p className="text-3xl font-bold text-primary">{rate}</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">{t('laatikko / vuorokausi')}</p>
            </div>
            <div className={cardClass}>
              <p className="text-3xl font-bold text-primary">{locale === 'en' ? '€0' : '0 €'}</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {t('toimitus ja nouto kotiovelle muuton yhteydessä')}
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-3xl font-bold text-primary">{deliveryFee}</p>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {t('toimitus ja nouto yhteensä ilman muuttoa – ilmainen, kun vuokra on vähintään')} {freeFrom}
              </p>
            </div>
          </div>
        </div>

        {/* Näin se toimii */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className={cardClass}>
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="mb-2 text-lg font-bold text-black dark:text-white">{t(step.title)}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{t(step.text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
