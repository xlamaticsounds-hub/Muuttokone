'use client';

import { useT } from '@/i18n/useT';
import { ourStoryDictionary } from '@/i18n/homeDictionary';

export default function OurStory() {
  const t = useT(ourStoryDictionary);

  return (
    <section className="bg-gray-1 dark:bg-blacksection py-16 lg:py-24">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top mx-auto max-w-2xl text-center">
          <h4 className="text-primary mb-3 text-lg font-medium">{t('Tarinamme')}</h4>
          <h2 className="xl:text-title-xl mb-6 text-3xl font-semibold text-black md:text-4xl dark:text-white">
            {t('Mistä kaikki alkoi')}
          </h2>
          <p className="text-body-color dark:text-body-color-dark">
            {t(
              'Muuttokone syntyi ajatuksesta, että muuton ei tarvitse olla stressaavaa. [Placeholder — täydennetään myöhemmin oikealla tarinalla: milloin perustettu, mistä idea lähti ja mikä meitä ajaa eteenpäin.]',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
