'use client';

import { useT } from '@/i18n/useT';
import { heroDictionary } from '@/i18n/homeDictionary';

export default function CalculatorIntro() {
  const t = useT(heroDictionary);
  return (
    <div className="mb-5 text-center">
      <h2 className="text-xl font-semibold text-black lg:text-3xl dark:text-white">
        {t('Aloita tästä – saat hinta-arvion nopeasti')}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        {t('Laske tarkka hinta-arvio muutollesi suoraan tästä. Tämä ei sido sinua mihinkään.')}
      </p>
    </div>
  );
}
