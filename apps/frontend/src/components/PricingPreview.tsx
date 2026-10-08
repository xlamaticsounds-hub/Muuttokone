'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/i18n/useT';
import { useLocale } from '@/i18n/LocaleContext';
import { pricingPreviewDictionary } from '@/i18n/homeDictionary';
import { BOX_RENTAL } from '@/features/calculator/boxRental';

const PLANS = [
  {
    title: 'Yksiö (25-35m²)',
    badge: 'Suosittu',
    text: 'Sopii opiskelijoille ja sinkuille. Nopea ja ketterä muutto.',
    price: '189€',
    features: ['2 muuttomiestä', 'Kuorma-auto (20m³)', 'Noin 2-3 tuntia'],
  },
  {
    title: 'Kaksio (40-60m²)',
    text: 'Pariskunnille ja pienille perheille. Tehokas palvelu.',
    price: '299€',
    features: ['2-3 muuttomiestä', 'Iso kuorma-auto', 'Noin 3-5 tuntia'],
  },
  {
    title: 'Kolmio+ (70m²+)',
    text: 'Perheasunnot ja omakotitalot. Täyden palvelun muutto.',
    price: '599€',
    features: ['3-4 muuttomiestä', 'Iso kuorma-auto', 'Koko päivä'],
  },
];

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
      fill="currentColor"
    />
  </svg>
);

// Kortit vievät muuttolaskuriin samalla sivulla (#muuttolaskuri). Mobiilissa kortit ovat tiiviitä
// rivejä (hinta otsikon vieressä, kuvaus piilossa) ja yksi yhteinen painike korttien alla.
export default function PricingPreview() {
  const t = useT(pricingPreviewDictionary);
  const { locale } = useLocale();
  const rate =
    locale === 'en'
      ? `€${BOX_RENTAL.ratePerBoxPerDay.toFixed(2)}`
      : `${BOX_RENTAL.ratePerBoxPerDay.toFixed(2).replace('.', ',')} €`;

  return (
    <section className="relative z-20 py-14 lg:py-20">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        {/* Pricing Badge */}
        <div className="animate_top mx-auto mb-8 max-w-fit rounded-full bg-white px-6 py-2 text-center shadow-lg ring-1 ring-black/5 md:mb-10 md:px-8 md:py-3 dark:bg-black dark:ring-white/10">
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-black md:text-base dark:text-white">
            <span className="text-primary">{t('🔥 Muutot alk. 189€')}</span>
            <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block"></span>
            <span>{t('5 km sisältyy hintaan')}</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.title}
              className="animate_top group rounded-2xl bg-white p-4 shadow-solid-8 transition-all hover:shadow-solid-4 sm:flex sm:flex-col sm:rounded-3xl sm:p-6 dark:bg-blacksection dark:border dark:border-strokedark"
            >
              <div className="flex items-start justify-between gap-3 sm:mb-4 sm:items-center">
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-black sm:text-xl dark:text-white">{t(plan.title)}</h3>
                  {plan.badge && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {t(plan.badge)}
                    </span>
                  )}
                </div>
                <p className="shrink-0 text-right sm:hidden">
                  <span className="block text-xs font-medium text-black/60 dark:text-white/60">{t('Alkaen')}</span>
                  <span className="text-2xl font-bold text-primary">{plan.price}</span>
                </p>
              </div>
              <p className="mb-4 hidden text-sm text-black/60 sm:block sm:min-h-10 dark:text-white/60">{t(plan.text)}</p>
              <div className="mb-6 hidden items-baseline gap-1 sm:flex">
                <span className="text-sm font-medium text-black/60 dark:text-white/60">{t('Alkaen')}</span>
                <span className="text-3xl font-bold text-primary">{plan.price}</span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-black/70 sm:mt-0 sm:mb-8 sm:block sm:space-y-3 sm:text-sm sm:text-black dark:text-white/70 sm:dark:text-white">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5 sm:gap-3">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] text-primary sm:h-5 sm:w-5 sm:text-[10px]">
                      ✓
                    </span>
                    {t(feature)}
                  </li>
                ))}
              </ul>
              <a
                href="#muuttolaskuri"
                className="group hidden w-full items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white sm:mt-auto sm:inline-flex dark:bg-white/10 dark:hover:bg-primary"
              >
                {t('Laske tarkka hinta')}
                <ArrowIcon />
              </a>
            </div>
          ))}
        </div>
        <a
          href="#muuttolaskuri"
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-primary/90 sm:hidden"
        >
          {t('Laske tarkka hinta')}
          <ArrowIcon />
        </a>

        {/* Laatikkovuokra yhtenä rivinä; tarkemmat tiedot ja tilaus /muuttolaatikot-sivulla */}
        <div className="animate_top mt-8 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-solid-8 ring-1 ring-primary/15 sm:flex-row sm:items-center sm:gap-6 sm:p-5 lg:mt-10 dark:bg-blacksection dark:ring-white/10">
          <div className="flex items-center gap-4 sm:flex-1">
            <Image
              src="/images/webp/muuttolaatikot/muuttolaatikko.webp"
              alt={t('Vuokrattava muuttolaatikko')}
              width={96}
              height={64}
              sizes="96px"
              className="h-16 w-24 shrink-0 rounded-lg bg-white object-contain"
            />
            <div>
              <p className="font-bold text-black dark:text-white">
                {t('Muuttolaatikot vuokralle')}{' '}
                <span className="whitespace-nowrap text-primary">
                  {rate} {t('/ laatikko / vrk')}
                </span>
              </p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {t('Toimitus ja nouto ilmaiseksi muuton yhteydessä. Lisää laatikot laskurin lisäpalveluista.')}
              </p>
            </div>
          </div>
          <Link
            href="/muuttolaatikot"
            className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white dark:bg-white/10 dark:hover:bg-primary"
          >
            {t('Katso laatikot')}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
