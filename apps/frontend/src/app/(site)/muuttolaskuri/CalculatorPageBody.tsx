'use client';

import React, { Suspense } from 'react';
import Calculator from '@/features/calculator/Calculator';
import { useT } from '@/i18n/useT';
import { muuttolaskuriPageDictionary } from '@/i18n/homeDictionary';

// Laskurisivun runko (suomi ja englanti). Suomenkielinen sivu lisää perään hakukoneille ja
// asiakkaille ohjetekstin (CalculatorGuide), englanninkielinen näyttää pelkän laskurin.
export default function CalculatorPageBody() {
  const t = useT(muuttolaskuriPageDictionary);
  return (
    <div className="pt-30 pb-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="animate_top relative z-10 mx-auto max-w-1390 px-4 text-center md:px-8 xl:px-0">
            <h1 className="xl:text-title-xl mx-auto mb-4.5 text-3xl font-semibold text-black dark:text-white">
              {t('Muuttolaskuri – laske muuton hinta heti')}
            </h1>
            <p className="mx-auto md:w-4/5">
              {t('Laske ja saa hinta heti – tarkka hinta-arvio sekunneissa, ei piilokuluja. Suomen tarkin muuttolaskuri perustuu oikeaan tavaramäärään.')}
            </p>
          </div>
        </div>

        <Suspense>
          <Calculator />
        </Suspense>

        <div className="mx-auto mt-20 grid max-w-3xl gap-8 text-center md:grid-cols-3">
          <div>
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full font-bold">1</div>
            <h2 className="mb-2 font-bold">{t('Syötä tiedot')}</h2>
            <p className="text-sm text-gray-500">{t('Kerro meille mistä mihin muutat ja asunnon koko.')}</p>
          </div>
          <div>
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full font-bold">2</div>
            <h2 className="mb-2 font-bold">{t('Saat hinnan')}</h2>
            <p className="text-sm text-gray-500">{t('Algoritmimme laskee reilun hinnan perustuen kilometri- ja tuntiveloitukseen.')}</p>
          </div>
          <div>
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full font-bold">3</div>
            <h2 className="mb-2 font-bold">{t('Varaa heti')}</h2>
            <p className="text-sm text-gray-500">{t('Valitse sopiva päivä ja vahvista varaus. Helppoa!')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
