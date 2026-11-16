import Image from 'next/image';
import { Check } from 'lucide-react';
import { BOX_ITEM_ID, getRentalItem } from './rental';

// "Montako muuttolaatikkoa tarvitset?" -osio /muuttolaatikot-sivulle. Hakuja "montako muuttolaatikkoa
// tarvitaan", "muuttolaatikoiden määrä" ym. on Search Consolessa sijoilla 8–18 ilman omaa vastausta.
// Määrät tulevat tilauslomakkeen pikavalinnoista (rental.ts: qtyHints), joten ne pysyvät samoina.
export default function BoxCountGuide() {
  const box = getRentalItem(BOX_ITEM_ID);
  if (!box?.qtyHints?.length) return null;

  const tips = [
    'Laske mukaan varasto, parveke ja vaatehuone – ne unohtuvat helposti.',
    'Keittiö ja kirjahyllyt vievät usein eniten laatikoita.',
    'Vuokralaatikot ovat samankokoisia ja pinoutuvat, joten ne on helppo laskea ja kantaa.',
    `Voit vuokrata ${box.qty.min}–${box.qty.max} laatikkoa ${box.days.min}–${box.days.max} vuorokaudeksi.`,
  ];

  return (
    <section id="montako" className="scroll-mt-20 py-12 lg:py-16">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="grid items-center gap-10 rounded-3xl border border-black/5 bg-white/85 p-7 shadow-sm ring-1 ring-black/5 md:p-10 lg:grid-cols-[1fr_1fr] dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5">
          <div>
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Laatikkomäärä</p>
            <h2 className="mb-3 text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">Montako muuttolaatikkoa tarvitset?</h2>
            <p className="mb-6 text-black/70 dark:text-white/70">
              Nyrkkisääntö on noin yksi laatikko asuinneliötä kohti. Täydet kirjahyllyt ja keittiön kaapit lisäävät tarvetta, pelkistetty koti vähentää.
            </p>
            <ul className="space-y-2">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-black/80 dark:text-white/80">
                  <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {tip}
                </li>
              ))}
            </ul>
            <a href="#tilaa" className="bg-primary hover:shadow-1 mt-7 inline-flex rounded-full px-7.5 py-3 font-semibold text-white duration-300">
              Tilaa laatikot
            </a>
          </div>
          <div className="relative">
            <Image
              src="/images/infografiikka/checklist_upscaled.webp"
              alt=""
              width={320}
              height={320}
              className="absolute -top-28 right-0 hidden h-28 w-28 object-contain mix-blend-multiply lg:block dark:mix-blend-normal"
            />
            <table className="w-full overflow-hidden rounded-2xl text-left">
              <caption className="sr-only">Muuttolaatikoiden suuntaa-antava määrä asunnon koon mukaan</caption>
              <thead>
                <tr className="bg-primary text-white">
                  <th scope="col" className="px-5 py-3 font-semibold">Asunto</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Laatikoita noin</th>
                </tr>
              </thead>
              <tbody>
                {box.qtyHints.map((hint, index) => (
                  <tr key={hint.label} className={index % 2 ? 'bg-primary/5' : 'bg-white dark:bg-slate-900'}>
                    <th scope="row" className="px-5 py-4 font-semibold text-black/90 dark:text-white">{hint.label}</th>
                    <td className="text-primary px-5 py-4 text-lg font-bold">
                      {hint.qty}
                      {index === box.qtyHints!.length - 1 ? '+' : ''} kpl
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
