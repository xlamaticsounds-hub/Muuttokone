'use client';

import React, { Suspense } from 'react';
import Calculator from '@/features/calculator/Calculator';
import SectionTitle from '@/components/SectionTitle';
import { useT } from '@/i18n/useT';
import { muuttolaskuriPageDictionary } from '@/i18n/homeDictionary';

export default function MuuttolaskuriPage() {
  const t = useT(muuttolaskuriPageDictionary);
  return (
    <div className="pt-30 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <SectionTitle
            title={t('Muuttolaskuri')}
            subtitle={t('Laske ja saa hinta heti – tarkka hinta-arvio sekunneissa, ei piilokuluja. Suomen tarkin muuttolaskuri perustuu oikeaan tavaramäärään.')}
          />
        </div>

        <Suspense>
          <Calculator />
        </Suspense>

        <div className="mt-20 max-w-3xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">1</div>
            <h3 className="font-bold mb-2">{t('Syötä tiedot')}</h3>
            <p className="text-sm text-gray-500">{t('Kerro meille mistä mihin muutat ja asunnon koko.')}</p>
          </div>
          <div>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">2</div>
            <h3 className="font-bold mb-2">{t('Saat hinnan')}</h3>
            <p className="text-sm text-gray-500">{t('Algoritmimme laskee reilun hinnan perustuen kilometri- ja tuntiveloitukseen.')}</p>
          </div>
          <div>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold">3</div>
            <h3 className="font-bold mb-2">{t('Varaa heti')}</h3>
            <p className="text-sm text-gray-500">{t('Valitse sopiva päivä ja vahvista varaus. Helppoa!')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
