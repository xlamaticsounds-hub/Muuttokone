'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionTitle from '@/components/SectionTitle';

const faqData = [
  {
    q: 'Miksi valita meidät?',
    a: 'Olemme vakuutettu ja rekisteröity muuttopalvelu, joka tarjoaa rehellisen, kiinteän hinnan ilman piilokuluja ja nopean vastauksen tarjouspyyntöihin. Asiakkaamme arvostavat ammattitaitoista, joustavaa palveluamme ja selkeää hinnoittelua.',
  },
  {
    q: 'Mitä tapahtuu, jos muutto kestää pidempään kuin tarjouksessa – kenelle maksu menee?',
    a: 'Ei mitään ylimääräistä – jos tarjouksessa ilmoitetut tavarat ja tiedot vastaavat todellisuutta, sinulle ei tule lisäkuluja, vaikka muutto kestäisi arvioitua pidempään. Maksu suoritetaan suoraan meille, Muuttokone.fi:lle, muuton valmistuttua.',
  },
  {
    q: 'Mitä hyötyä muuttolaskurista on?',
    a: 'Muuttolaskuri antaa sinulle tarkan, kiinteän hinta-arvion vain 3 minuutissa antamiesi tietojen perusteella – ei tarvitse odottaa puhelinsoittoa tai sähköpostia. Näet suoraan arvioidun työajan, tarvittavan kaluston ja hinnan haarukan, ja voit verrata eri palvelupaketteja ennen päätöksentekoa.',
  },
  {
    q: 'Sisältyykö muuttooni vakuutus?',
    a: 'Kyllä, kaikkiin täyspalvelumuuttoihimme sisältyy muuttovakuutus, joka kattaa tavaroidesi kuljetuksen aikana sattuvat vahingot. Vakuutus on automaattisesti mukana hinnassa, eikä siitä tarvitse maksaa erikseen.',
  },
  {
    q: 'Kuinka pitkälle etukäteen muutto kannattaa varata?',
    a: 'Suosittelemme varaamaan vähintään 1–2 viikkoa etukäteen, erityisesti kuun vaihteen ja kesäkuukausien aikana kysynnän ollessa suurimmillaan. Tarvittaessa autamme myös kiireellisissä, lyhyellä varoitusajalla tehtävissä muutoissa.',
  },
];

export default function Faq() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="bg-gray-1 dark:bg-blacksection py-20 lg:py-25">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="animate_top mb-15 text-center">
          <SectionTitle
            title="Usein kysytyt kysymykset"
            subtitle="Vastauksia yleisimpiin kysymyksiin muutostamme ja palveluistamme."
          />
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
          {faqData.map((item, index) => {
            const isOpen = openId === index;
            return (
              <div
                key={item.q}
                className={`border-l-4 transition-colors duration-300 ${
                  isOpen ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-transparent'
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
                  <span className="flex-1 text-lg font-semibold text-black/90 dark:text-white">{item.q}</span>
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
                    <p className="text-sm text-black/70 dark:text-white/70">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
