const steps = [
  {
    title: 'Alkukartoitus ja suunnitelma',
    description:
      'Kartoitamme kohteen, kantoreitit ja aikataulun – suunnitelma syntyy ennen muuttopäivää.',
  },
  {
    title: 'Avaimet meille, stressi pois',
    description:
      'Voit olla paikalla tai luovuttaa avaimet. Hoidamme muuton sovitussa aikataulussa.',
  },
  {
    title: 'Muutto & lisäpalvelut',
    description: 'Puramme, suojaamme ja kasaamme. Kuljetamme tavarat suoraan oikeille paikoille.',
  },
  {
    title: 'Muuttosiivous',
    description: 'Siivoamme lähtöasunnon ja halutessasi aloitamme uuden kodin puhtaalta pöydältä.',
  },
  {
    title: 'Valmis muutto',
    description: 'Koti odottaa kalustettuna, tekniikka kytkettynä ja arki voi alkaa heti.',
  },
];

export default function Graphics() {
  return (
    <div className="animate_left flex w-full flex-col items-center justify-center md:w-1/2">
      <div className="relative w-full max-w-[520px] md:pl-16 lg:pl-20">
        <div className="shadow-primary/10 relative z-0 w-full rounded-3xl border border-black/10 bg-white/90 p-8 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/85">
          <div className="text-primary mb-6 text-center text-base font-semibold tracking-[0.35em] uppercase">
            Miten muutto etenee?
          </div>

          <div className="relative">
            {/* Fixed connecting line - aligned to center of circles */}
            <span className="bg-primary/20 pointer-events-none absolute top-6 left-6 h-[calc(100%-6rem)] w-[3px] rounded-full" />

            <ol className="space-y-8">
              {steps.map((step, index) => (
                <li key={step.title} className="relative pl-20">
                  <div className="bg-primary shadow-primary/30 absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white shadow-lg">
                    {index + 1}
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                    <h4 className="text-base font-semibold text-black dark:text-white">
                      {step.title}
                    </h4>
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
