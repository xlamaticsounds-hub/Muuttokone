import type { Metadata } from 'next';

const faqs = [
  {
    q: 'Kuinka nopeasti saamme tarjouksen?',
    a: 'Useimmiten saman arkipäivän aikana. Kiireisissä tapauksissa soitamme heti lomakkeen lähetyksen jälkeen.',
  },
  {
    q: 'Sisältyykö pakkausmateriaali hintaan?',
    a: 'Perus pakkausmateriaalit voidaan tuoda lisäpalveluna. Suojaukset (peitteet, kutistekalvo) sisältyvät aina.',
  },
  {
    q: 'Miten hinnoittelette?',
    a: 'Selkeä kiinteä hinta tai tuntihinnoittelu kohteen mukaan. Ei viikonloppu- tai iltalisäyllätyksiä, sovimme kaiken etukäteen.',
  },
  {
    q: 'Teettekö muuttosiivouksia?',
    a: 'Kyllä. Voimme hoitaa siivouksen samassa paketissa, jolloin avaimet voi luovuttaa kerralla.',
  },
  {
    q: 'Voinko muuttaa aikataulua?',
    a: 'Usein onnistuu jopa 48h varoitusajalla. Ilmoitathan muutoksesta heti, niin järjestämme kaluston uudelleen.',
  },
];

export const metadata: Metadata = {
  title: 'Usein kysytyt kysymykset | Muuttokone',
  description: 'Nopeat vastaukset yleisimpiin kysymyksiin hinnoittelusta, aikatauluista ja pakkauspalveluista.',
};

export default function FAQPage() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-10 text-center mx-auto max-w-3xl">
          <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">FAQ</p>
          <h1 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Usein kysytyt kysymykset</h1>
          <p className="text-black/70 dark:text-white/70">Nopea yhteenveto siitä, miten työskentelemme ja mitä palveluihimme sisältyy.</p>
        </div>

        <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
          {faqs.map((item) => (
            <div key={item.q} className="p-5 md:p-6">
              <h2 className="text-lg font-semibold text-black/90 dark:text-white">{item.q}</h2>
              <p className="text-sm text-black/70 dark:text-white/70">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
