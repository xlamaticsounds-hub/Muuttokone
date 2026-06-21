import React from 'react';

const steps = [
  {
    title: '1) Laske tarkka hinta muuttolaskurilla',
    desc: 'Täytä tietosi vain 3 minuutissa ja saat tarkan, sitoumuksettoman hinnan heti – ei arvailua, ei piilokuluja, ei odottelua.',
  },
  {
    title: '2) Sovitaan sinulle sopiva ajankohta',
    desc: 'Käymme yhdessä läpi muuton yksityiskohdat ja varmistamme aikataulun, joka sopii juuri sinulle.',
  },
  {
    title: '3) Ammattilaiset hoitavat muuton puolestasi',
    desc: 'Kokenut ja vakuutettu tiimimme pakkaa, kantaa ja kuljettaa tavarasi turvallisesti ja huolellisesti uuteen kotiin.',
  },
  {
    title: '4) Rentoudu – muutto on hoidettu',
    desc: 'Varmistamme, että kaikki on kunnossa viimeistä laatikkoa myöten. Maksat vasta kun työ on tehty sovitusti.',
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
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg hover:ring-primary/30 dark:border-white/10 dark:bg-slate-900/60 dark:ring-white/5"
            >
              <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black/90 dark:text-white">{step.title}</h3>
                  <p className="text-sm text-black/70 dark:text-white/70">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
