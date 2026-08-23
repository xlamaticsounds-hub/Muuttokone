'use client';

import TeamCard from '@/features/team/TeamCard';
import teamData from '@/features/team/teamData';
import { useT } from '@/i18n/useT';
import { teamDictionary } from '@/i18n/homeDictionary';

export default function Team() {
  const t = useT(teamDictionary);

  return (
    <section id="tiimi" className="overflow-hidden py-16 lg:py-24 xl:py-28 2xl:py-32">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top mx-auto mb-12.5 max-w-3xl text-center lg:mb-15">
          <h4 className="text-primary mb-3 text-lg font-medium">{t('Muuttokoneen konkkaronkka')}</h4>
          <h2 className="xl:text-title-xl mb-4.5 text-3xl font-semibold text-black md:text-4xl dark:text-white">
            {t('Tiimimme')}
          </h2>
          <p>{t('Ihmiset jotka hoitavat muuttosi alusta loppuun.')}</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-7.5 sm:grid-cols-2 xl:gap-10">
          {teamData.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
