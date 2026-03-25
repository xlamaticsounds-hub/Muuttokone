import React from 'react';

const steps = [
  {
    title: '1) Pyydä tarjous verkossa tai puhelimitse',
    desc: 'Täytä lomake minuutissa tai soita. Saat hinta-arvion nopeasti ilman sitoumuksia.',
  },
  {
    title: '2) Sovitaan aika & arvioidaan muutto',
    desc: 'Käymme läpi muuton yksityiskohdat ja lyömme lukkoon sinulle sopivan ajankohdan.',
  },
  {
    title: '3) Ammattimiehet hoitaa muuton',
    desc: 'Kokenut tiimimme pakkaa, kantaa ja kuljettaa tavarasi turvallisesti uuteen kotiin.',
  },
  {
    title: '4) Tyytyväinen asiakas',
    desc: 'Varmistamme, että kaikki on kunnossa. Maksat vasta kun työ on tehty sovitusti.',
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
            Selkeä prosessi, jossa tiedät aina seuraavan askeleen. Ei piilokuluja, ei yllätyksiä.
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
