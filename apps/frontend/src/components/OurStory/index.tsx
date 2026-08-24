'use client';

import Image from 'next/image';
import { useT } from '@/i18n/useT';
import { ourStoryDictionary } from '@/i18n/homeDictionary';

export default function OurStory() {
  const t = useT(ourStoryDictionary);

  return (
    <section className="bg-gray-1 dark:bg-blacksection py-16 lg:py-24">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top rounded-2xl bg-white p-8 shadow-solid-8 md:p-12 xl:p-16 dark:bg-blacksection dark:border dark:border-strokedark">
          <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
            <div className="relative flex w-full justify-center md:w-2/5">
              <div className="bg-primary/10 pointer-events-none absolute h-56 w-56 rounded-full blur-2xl md:h-72 md:w-72" />
              {/* logo.png:n tausta oli oikeasti kermanvärinen (ei aitoa alfaa) — logo-transparent.png
                  on siitä ajettu versio jossa tausta on poistettu (ks. scratchpad/remove_bg.py). */}
              <Image
                src="/images/logo/logo-transparent.png"
                alt="Muuttokoneen hahmo"
                width={649}
                height={485}
                className="relative w-56 sm:w-72 md:w-full md:max-w-sm"
              />
            </div>

            <div className="w-full text-center md:w-3/5 md:text-left">
              <h4 className="text-primary mb-3 text-lg font-medium">{t('Tarinamme')}</h4>
              <h2 className="xl:text-title-xl mb-6 text-3xl font-semibold text-black md:text-4xl dark:text-white">
                {t('Mistä kaikki alkoi')}
              </h2>
              <p className="text-body-color dark:text-body-color-dark">
                {t(
                  'Muuttokone syntyi, kun päätimme kaverin kanssa ottaa asiat omiin käsiimme — Suomen työtilanne ei tarjonnut meille eikä kavereillemme sitä mitä halusimme, joten loimme työpaikat itse. Mukaan on sittemmin liittynyt niin kavereita kuin muitakin tekijöitä. Halusimme tuoda perinteiseen muuttoalaan jotain uutta: täyden läpinäkyvyyden ja aidon, rehellisen tekemisen ilman turhia vääntöjä. Tiedämme, että muutto on jo valmiiksi stressaavaa — siksi asiakkaamme ei tarvitse miettiä, osaavatko muuttomiehet hommansa tai yllättääkö lasku suurempana kuin sovittiin. Muutto on meille vasta alku — tähtäämme kasvuun kohti isompaa logistiikka- ja kuljetusalan toimijaa.',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
