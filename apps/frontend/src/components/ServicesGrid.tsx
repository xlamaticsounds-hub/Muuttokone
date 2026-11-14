'use client';

import Image from 'next/image';
import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import { useT } from '@/i18n/useT';
import { useLocale } from '@/i18n/LocaleContext';
import { servicesGridDictionary } from '@/i18n/homeDictionary';
import { BOX_RENTAL } from '@/features/calculator/boxRental';

// Etusivun tiivis palvelulista: yksi rivi per palvelu ja linkki eteenpäin. Pitkät kuvaukset ovat
// /palvelut-sivulla (features/services). Kuvitukset: public/icons/palvelut/ (512×512 PNG).
const ITEMS: { icon: string; title: string; text: string; href: string }[] = [
  { icon: '/icons/palvelut/kotimuutto.png', title: 'Kotimuutto', text: 'Ovelta ovelle, kiinteä hinta etukäteen.', href: '#muuttolaskuri' },
  { icon: '/icons/palvelut/yritysmuutto.png', title: 'Yritysmuutto', text: 'Toimistot ja liiketilat aikataulussa.', href: '/yrityksille' },
  { icon: '/icons/palvelut/muuttolaatikot.png', title: 'Muuttolaatikot', text: 'Vuokralle {rate}/vrk, toimitus kotiovelle.', href: '/muuttolaatikot' },
  { icon: '/icons/palvelut/tyoapu.png', title: 'Työapu ja asennukset', text: 'TV, pesukone, kalusteet ja IT-apu.', href: '/tyoapu' },
  { icon: '/icons/palvelut/pakkauspalvelu.png', title: 'Pakkauspalvelu', text: 'Pakkaamme keittiöt ja hauraat esineet.', href: '/palvelut' },
  { icon: '/icons/palvelut/muuttosiivous.png', title: 'Muuttosiivous', text: 'Luovutussiivous samalla kertaa.', href: '/palvelut' },
  { icon: '/icons/palvelut/kuolinpesa.png', title: 'Kuolinpesän tyhjennys', text: 'Hienovaraisesti, kierrätys hoidettuna.', href: '/palvelut' },
  { icon: '/icons/palvelut/kuljetukset.png', title: 'Kuljetukset', text: 'Kaatopaikka-ajot ja yksittäiset kuljetukset.', href: '/palvelut' },
];

export default function ServicesGrid({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  const t = useT(servicesGridDictionary);
  const { locale } = useLocale();
  const rate =
    locale === 'en'
      ? `€${BOX_RENTAL.ratePerBoxPerDay.toFixed(2)}`
      : `${BOX_RENTAL.ratePerBoxPerDay.toFixed(2).replace('.', ',')} €`;

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-10">
          <SectionTitle
            title={t(title ?? 'Muuttopalvelut')}
            subtitle={t(
              subtitle ?? 'Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille Helsingissä ja Uudellamaalla.',
            )}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {ITEMS.map(({ icon, title: itemTitle, text, href }) => (
            <Link
              key={itemTitle}
              href={href}
              className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 dark:bg-slate-900/80 dark:ring-white/10"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <Image src={icon} alt="" width={96} height={96} className="h-12 w-12 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-black transition-colors group-hover:text-primary dark:text-white">
                  {t(itemTitle)}
                </span>
                <span className="block text-sm text-black/60 dark:text-white/60">{t(text).replace('{rate}', rate)}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/palvelut" className="font-semibold text-primary hover:underline">
            {t('Kaikki palvelut')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
