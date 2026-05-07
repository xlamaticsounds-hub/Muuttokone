'use client';

import React, { useState } from 'react';

interface PricingRoute {
  from: string;
  to: string;
  basePrice: number;
  description: string;
}

const pricingRoutes: PricingRoute[] = [
  {
    from: 'Helsinki',
    to: 'Espoo',
    basePrice: 450,
    description: '2h kuljetus, noin 20 km',
  },
  {
    from: 'Helsinki',
    to: 'Vantaa',
    basePrice: 400,
    description: '1.5h kuljetus, noin 15 km',
  },
  {
    from: 'Helsinki',
    to: 'Tampere',
    basePrice: 750,
    description: '2.5h kuljetus, noin 170 km',
  },
  {
    from: 'Helsinki',
    to: 'Turku',
    basePrice: 850,
    description: '2.5h kuljetus, noin 170 km',
  },
  {
    from: 'Helsinki',
    to: 'Oulu',
    basePrice: 1200,
    description: '4h kuljetus, noin 600 km',
  },
  {
    from: 'Espoo',
    to: 'Vantaa',
    basePrice: 500,
    description: '1.5h kuljetus, noin 25 km',
  },
  {
    from: 'Tampere',
    to: 'Turku',
    basePrice: 600,
    description: '2h kuljetus, noin 130 km',
  },
  {
    from: 'Turku',
    to: 'Pori',
    basePrice: 550,
    description: '1.5h kuljetus, noin 110 km',
  },
];

export default function PricingGuide() {
  const [selectedFrom, setSelectedFrom] = useState('Helsinki');
  const [selectedTo, setSelectedTo] = useState('Espoo');

  const cities = Array.from(new Set(pricingRoutes.flatMap((r) => [r.from, r.to]))).sort();

  const selectedRoute = pricingRoutes.find((r) => r.from === selectedFrom && r.to === selectedTo);

  const calculateTotal = (basePrice: number, apartmentSize: string) => {
    const sizeMultipliers: { [key: string]: number } = {
      yksiö: 1,
      '1h+k': 1.2,
      '2h+k': 1.5,
      '3h+k': 2,
      '4h+k': 2.5,
      talo: 3,
    };
    return Math.round(basePrice * (sizeMultipliers[apartmentSize] || 1));
  };

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-black lg:text-3xl dark:text-white">
            Hinnoitteluopas
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Valitse kuljetusreitit ja kohteen koko saadaksesi suuntaa-antavan arvion. Lopullinen
            hinta määritellään ilmaisen kartoituksen jälkeen.
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg lg:p-10 dark:bg-black">
          {/* Route Selection */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-semibold text-black dark:text-white">
                Mistä
              </label>
              <select
                value={selectedFrom}
                onChange={(e) => setSelectedFrom(e.target.value)}
                className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-black dark:text-white">
                Minne
              </label>
              <select
                value={selectedTo}
                onChange={(e) => setSelectedTo(e.target.value)}
                className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRoute ? (
            <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  {selectedRoute.from} → {selectedRoute.to}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRoute.description}
                </p>
              </div>

              {/* Price Examples by Apartment Size */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="text-xs tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    Yksiö
                  </p>
                  <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                    {calculateTotal(selectedRoute.basePrice, 'yksiö')}€
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pohjahinta</p>
                </div>

                <div className="border-primary bg-primary/5 rounded-lg border-2 p-4">
                  <p className="text-xs tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    2h+k
                  </p>
                  <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                    {calculateTotal(selectedRoute.basePrice, '2h+k')}€
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Suosituin</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="text-xs tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    Talo
                  </p>
                  <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                    {calculateTotal(selectedRoute.basePrice, 'talo')}€
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Suurin</p>
                </div>
              </div>

              {/* All Sizes */}
              <div className="mt-8">
                <h4 className="mb-4 font-semibold text-black dark:text-white">Kaikki kokoluokat</h4>
                <div className="space-y-2">
                  {(['yksiö', '1h+k', '2h+k', '3h+k', '4h+k', 'talo'] as const).map((size) => (
                    <div
                      key={size}
                      className="flex items-center justify-between rounded bg-gray-50 px-4 py-3 dark:bg-gray-900"
                    >
                      <span className="text-sm font-medium text-gray-700 capitalize dark:text-gray-300">
                        {size}
                      </span>
                      <span className="text-lg font-semibold text-black dark:text-white">
                        {calculateTotal(selectedRoute.basePrice, size)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Huomio:</span> Nämä ovat suuntaa-antavia hintoja.
                  Lopullinen tarjous määritellään ilmaisen kartoituksen jälkeen, johon vaikuttavat
                  mm. kulkuesteet, lisäpalvelut (pakkaus, kuljetukset) ja kohteen erityispiirteet.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Valituille kaupungeille ei ole suoria hintatietoja. Ota yhteyttä saadaksesi tarkka
                tarjous.
              </p>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-10 text-center">
            <a
              href="/muuttolaskuri"
              className="bg-primary hover:bg-secondary rounded-lg px-8 py-4 font-semibold text-white transition-colors"
            >
              Pyydä ilmainen kartoitus
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
