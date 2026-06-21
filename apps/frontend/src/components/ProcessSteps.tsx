import React from 'react';
import { Calculator, CalendarCheck, Truck, PartyPopper } from 'lucide-react';

const steps = [
  {
    title: 'Laske tarkka hinta muuttolaskurilla',
    desc: 'Täytä tietosi vain 3 minuutissa ja saat tarkan, sitoumuksettoman hinnan heti – ei arvailua, ei piilokuluja, ei odottelua.',
    icon: Calculator,
    highlight: true,
    href: '#muuttolaskuri',
  },
  {
    title: 'Sovitaan sinulle sopiva ajankohta',
    desc: 'Käymme yhdessä läpi muuton yksityiskohdat ja varmistamme aikataulun, joka sopii juuri sinulle.',
    icon: CalendarCheck,
  },
  {
    title: 'Ammattilaiset hoitavat muuton puolestasi',
    desc: 'Kokenut ja vakuutettu tiimimme pakkaa, kantaa ja kuljettaa tavarasi turvallisesti ja huolellisesti uuteen kotiin.',
    icon: Truck,
  },
  {
    title: 'Rentoudu – muutto on hoidettu',
    desc: 'Varmistamme, että kaikki on kunnossa viimeistä laatikkoa myöten. Maksat vasta kun työ on tehty sovitusti.',
    icon: PartyPopper,
  },
];

export default function ProcessSteps() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-10 text-center mx-auto max-w-2xl">
          <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Muutto selkokielellä</p>
          <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Näin etenemme</h2>
          <p className="text-black/70 dark:text-white/70">
            Selkeä ja nopea prosessi alusta loppuun – tiedät aina hinnan ja seuraavan askeleen etukäteen. Ei piilokuluja, ei yllätyksiä.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const Wrapper = step.href ? 'a' : 'div';
            return (
              <Wrapper
                key={step.title}
                {...(step.href ? { href: step.href } : {})}
                className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm ring-1 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg ${
                  step.highlight
                    ? 'border-primary/30 bg-primary/5 ring-primary/30 hover:ring-primary/50 dark:border-primary/30 dark:bg-primary/10'
                    : 'border-black/5 bg-white/70 ring-black/5 hover:ring-primary/30 dark:border-white/10 dark:bg-slate-900/60 dark:ring-white/5'
                } ${step.href ? 'cursor-pointer block' : ''}`}
              >
                {step.highlight && (
                  <span className="bg-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm sm:absolute sm:top-4 sm:right-4 sm:mb-0">
                    Aloita tästä
                  </span>
                )}
                <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10" />
                <div className="relative flex items-start gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black/90 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-black/70 dark:text-white/70">{step.desc}</p>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
