import React from 'react';
import Link from 'next/link';

export default function PricingPreview() {
  return (
    <section className="relative z-20 py-20 lg:py-25">
      <div className="mx-auto max-w-1390 px-4">
        {/* Pricing Badge */}
        <div className="animate_top mx-auto mb-10 max-w-fit rounded-full bg-white px-6 py-2 text-center shadow-lg ring-1 ring-black/5 md:px-8 md:py-3 dark:bg-black dark:ring-white/10">
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-black md:text-base dark:text-white">
            <span className="text-primary">🔥 Tuntihinta 100–150€/h</span>
            <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block"></span>
            <span>+ 0.59€/km</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="animate_top group rounded-3xl bg-white p-6 shadow-solid-8 transition-all hover:shadow-solid-4 dark:bg-blacksection dark:border dark:border-strokedark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">Yksiö (25-35m²)</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Suosittu
              </span>
            </div>
            <p className="mb-4 text-sm text-black/60 dark:text-white/60">
              Sopii opiskelijoille ja sinkuille. Nopea ja ketterä muutto.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-medium text-black/60 dark:text-white/60">Alkaen</span>
              <span className="text-3xl font-bold text-primary">350€</span>
            </div>
            <ul className="mb-8 space-y-3 text-sm font-medium text-black dark:text-white">
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                2 muuttomiestä
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Kuorma-auto (20m³)
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Noin 2-3 tuntia
              </li>
            </ul>
            <Link
              href="/muuttolaskuri"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white dark:bg-white/10 dark:hover:bg-primary"
            >
              Laske tarkka hinta
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>

          {/* Card 2 */}
          <div className="animate_top group rounded-3xl bg-white p-6 shadow-solid-8 transition-all hover:shadow-solid-4 dark:bg-blacksection dark:border dark:border-strokedark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">Kaksio (40-60m²)</h3>
            </div>
            <p className="mb-4 text-sm text-black/60 dark:text-white/60">
              Pariskunnille ja pienille perheille. Tehokas palvelu.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-medium text-black/60 dark:text-white/60">Alkaen</span>
              <span className="text-3xl font-bold text-primary">550€</span>
            </div>
            <ul className="mb-8 space-y-3 text-sm font-medium text-black dark:text-white">
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                2-3 muuttomiestä
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Iso kuorma-auto
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Noin 3-5 tuntia
              </li>
            </ul>
            <Link
              href="/muuttolaskuri"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white dark:bg-white/10 dark:hover:bg-primary"
            >
              Laske tarkka hinta
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>

          {/* Card 3 */}
          <div className="animate_top group rounded-3xl bg-white p-6 shadow-solid-8 transition-all hover:shadow-solid-4 dark:bg-blacksection dark:border dark:border-strokedark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">Kolmio+ (70m²+)</h3>
            </div>
            <p className="mb-4 text-sm text-black/60 dark:text-white/60">
              Perheasunnot ja omakotitalot. Täyden palvelun muutto.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-medium text-black/60 dark:text-white/60">Alkaen</span>
              <span className="text-3xl font-bold text-primary">850€</span>
            </div>
            <ul className="mb-8 space-y-3 text-sm font-medium text-black dark:text-white">
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                3-4 muuttomiestä
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Iso kuorma-auto
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">✓</span>
                Koko päivä
              </li>
            </ul>
            <Link
              href="/muuttolaskuri"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white dark:bg-white/10 dark:hover:bg-primary"
            >
              Laske tarkka hinta
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
