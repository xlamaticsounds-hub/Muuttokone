'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import { useT } from '@/i18n/useT';
import { faqDictionary } from '@/i18n/homeDictionary';
import { generalFaqData, type FaqItem } from './faqData';

export type { FaqItem } from './faqData';

export default function Faq({
  title,
  subtitle,
  items,
  moreHref,
  moreLabel,
}: {
  title?: string;
  subtitle?: string;
  items?: FaqItem[];
  // Linkki koko kysymyslistaan, kun sivulla näytetään vain osa (esim. etusivu).
  moreHref?: string;
  moreLabel?: string;
} = {}) {
  const t = useT(faqDictionary);
  const [openId, setOpenId] = useState<number | null>(null);
  const activeItems = items ?? generalFaqData;

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="bg-gray-1 dark:bg-blacksection py-20 lg:py-25">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top mb-15 text-center">
          <SectionTitle
            title={t(title ?? 'Usein kysytyt kysymykset')}
            subtitle={t(subtitle ?? 'Vastauksia yleisimpiin kysymyksiin muutostamme ja palveluistamme.')}
          />
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
          {activeItems.map((item, index) => {
            const isOpen = openId === index;
            return (
              <div
                key={item.q}
                className={`transition-colors duration-300 ${
                  isOpen ? 'ring-2 ring-inset ring-primary/30 bg-primary/5 dark:bg-primary/10' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  className="flex w-full items-center gap-4 p-5 text-left md:p-6"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                      isOpen ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 text-lg font-semibold text-black/90 dark:text-white">{t(item.q)}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 flex-shrink-0 text-black/60 transition-transform duration-300 dark:text-white/60 ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                <div
                  id={`faq-panel-${index}`}
                  className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0 pl-[68px] pr-5 pb-5 md:pl-[72px] md:pr-6 md:pb-6">
                    <p className="text-sm text-black/70 dark:text-white/70">{t(item.a)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {moreHref && (
          <div className="mt-8 text-center">
            <Link href={moreHref} className="font-semibold text-primary hover:underline">
              {t(moreLabel ?? 'Katso kaikki kysymykset')} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
