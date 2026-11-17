import { COMPANY_FACTS, companyFactRows } from '@/config/companyFacts';

// "Muuttokone.fi lyhyesti": yrityksen perustiedot yhtenä selkeänä listana (Yhteystiedot-sivu). Palvelinkomponentti,
// jotta teksti on valmiina HTML:ssä hakukoneille ja tekoälyhauille. Tiedot: config/companyFacts.ts.
export default function CompanyFacts() {
  return (
    <section className="py-12 lg:py-16" aria-labelledby="company-facts-title">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mx-auto max-w-4xl">
          <h2 id="company-facts-title" className="mb-3 text-center text-2xl font-semibold text-black md:text-3xl dark:text-white">
            Muuttokone.fi lyhyesti
          </h2>
          <p className="mb-8 text-center text-black/70 dark:text-white/70">Perustiedot yrityksestä yhdellä silmäyksellä.</p>

          <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 md:p-8 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
            <dl className="divide-y divide-black/5 dark:divide-white/10">
              {companyFactRows().map((row) => (
                <div key={row.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-black dark:text-white">{row.label}</dt>
                  <dd className="text-black/75 dark:text-white/75">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <h3 className="mt-10 mb-4 text-center text-xl font-semibold text-black dark:text-white">Miksi Muuttokone.fi?</h3>
          <ul className="grid gap-4 md:grid-cols-3">
            {COMPANY_FACTS.differentiators.map((text) => (
              <li
                key={text}
                className="rounded-2xl border border-black/5 bg-white/80 p-5 text-black/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:text-white/80 dark:ring-white/5"
              >
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
