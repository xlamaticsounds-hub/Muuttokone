import type { Metadata } from 'next';

const cases = [
  {
    title: 'Helsinki → Turku: 4h yritysmuutto',
    body: 'Kaksi pakettiautoa, neljä kantajaa. Kalusteet suojattu huovilla ja kutistekalvolla, palveluun sisältyi työpisteiden merkintä ja kaapelointi.',
    badge: 'B2B',
  },
  {
    title: 'Perheasunnon muutto Espoossa',
    body: 'Pakkasimme keittiön ja lastenhuoneen, suojaukset hisseille ja käytäville. Valmis ennen klo 17 ja luovutus siivottuna.',
    badge: 'Kotimuutto',
  },
  {
    title: 'Arkistosiirto 1200 laatikkoa',
    body: 'Reititys ja kantoluvat etukäteen, nosto-ovien aikataulutus. Toteutus kahdessa yössä ilman liiketoiminnan katkoa.',
    badge: 'Kuljetus',
  },
  {
    title: 'Kuolinpesätyhjennnys Helsingissä',
    body: 'Kokonainen asunto tyhjennetty hienotunteisesti. Tavarat lajiteltu – kierrätys, lahjoitus ja kaatopaikka-ajo hoidettu saman päivän aikana.',
    badge: 'Kuolinpesä',
  },
];

export const metadata: Metadata = {
  title: 'Referenssit | Muuttokone',
  description: 'Poimintoja toteutetuista muuttoprojekteista: kotimuutot, yritysmuutot ja erikoiskuljetukset.',
};

export default function ReferenssitPage() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-10 max-w-3xl">
          <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Referenssit</p>
          <h1 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Näin olemme auttaneet</h1>
          <p className="text-black/70 dark:text-white/70">
            Ote projekteista, joissa nopeus, selkeys ja hyvä viestintä ratkaisivat. Kysy lisää tai pyydä
            viitteitä vastaavista kohteista.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cases.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5"
            >
              <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {item.badge}
              </div>
              <h2 className="text-xl font-semibold text-black/90 dark:text-white">{item.title}</h2>
              <p className="text-sm text-black/70 dark:text-white/70">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
