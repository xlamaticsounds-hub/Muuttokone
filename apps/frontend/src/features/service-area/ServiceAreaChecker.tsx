'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/SectionTitle';
import { lookupPostalCode } from './postalLookup';

const PRIMARY_REGION = 'Uusimaa';

export default function ServiceAreaChecker() {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState('');
  const [result, setResult] = useState<{ checked: boolean; valid: boolean; region?: string }>({
    checked: false,
    valid: false,
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const lookup = lookupPostalCode(postalCode);
    setResult({ checked: true, ...lookup });
  };

  const handleRequestQuote = () => {
    router.push(`/muuttolaskuri?postal=${postalCode}`);
  };

  const isPrimaryArea = result.region === PRIMARY_REGION;

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <SectionTitle
          title="Toimimmeko alueellasi?"
          subtitle="Päätoiminta-alueemme on Helsinki ja Uusimaa, mutta autamme muutoissa laajemminkin. Tarkista postinumerolla ja pyydä tarjous saman tien."
        />

        <div className="mx-auto mt-10 max-w-lg">
          <form onSubmit={handleCheck} className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="Postinumero, esim. 00100"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                setResult({ checked: false, valid: false });
              }}
              required
              className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-secondary shrink-0 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
            >
              Tarkista
            </button>
          </form>

          {result.checked && (
            <div className="mt-6 text-center">
              {result.valid ? (
                <>
                  {isPrimaryArea ? (
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ✓ Palvelemme alueellasi nopeasti ({result.region}, päätoiminta-alueemme)
                    </p>
                  ) : (
                    <p className="text-black dark:text-white">
                      Päätoiminta-alueemme on {PRIMARY_REGION}, mutta autamme mielellämme myös
                      {result.region ? ` ${result.region}-alueella` : ' alueellasi'} — jätä
                      tarjouspyyntö ja katsotaan yhdessä.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRequestQuote}
                    className="bg-primary hover:bg-secondary mt-4 inline-flex rounded-lg px-7.5 py-3 font-semibold text-white transition-colors"
                  >
                    Pyydä tarjous tähän alueeseen
                  </button>
                </>
              ) : (
                <p className="text-red-500">Tarkista postinumero – sen tulee olla 5 numeroa.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
