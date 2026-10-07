// Muuttolaatikot-sivun (/muuttolaatikot) UKK ja askeleet. Luvut (hinnat, rajat, toimitussäännöt) luetaan
// rental.ts:stä, jotta teksti pysyy aina tuotteiden ja hintojen mukaisena kun niitä muutetaan.
import type { FaqItem } from '@/components/Faq';
import type { ProcessStep } from '@/components/ProcessSteps';
import {
  BOX_ITEM_ID,
  RENTAL_DELIVERY,
  calculateRentalOrder,
  formatEuro,
  formatPricePerDay,
  getAvailableRentalItems,
  getRentalItem,
} from './rental';

const box = getRentalItem(BOX_ITEM_ID);
const available = getAvailableRentalItems();

const exampleOrder = box ? calculateRentalOrder([{ itemId: BOX_ITEM_ID, qty: 50, days: 14 }], { withMove: false }) : null;
const boxesForFreeDelivery = box ? Math.ceil(RENTAL_DELIVERY.freeFromRental / (14 * box.pricePerDay)) : 0;
const boxHints = box?.qtyHints?.map((hint) => `${hint.label.toLowerCase()} noin ${hint.qty}`).join(', ') ?? '';

export const vuokrausProcessSteps: ProcessStep[] = [
  {
    title: 'Valitse ja tilaa',
    desc: 'Valitse tuotteet, määrä ja vuokra-aika. Hinta näkyy heti – ALV mukana.',
    icon: 'ClipboardList',
    highlight: true,
    href: '#tilaa',
  },
  {
    title: 'Sovimme toimituksen',
    desc: 'Vahvistamme toimituspäivän ja aikaikkunan puhelimitse tai sähköpostitse.',
    icon: 'CalendarCheck',
  },
  {
    title: 'Toimitamme kotiovelle',
    desc: 'Tuotteet tulevat sovittuna päivänä pääkaupunkiseudulla.',
    icon: 'Truck',
  },
  {
    title: 'Noudamme ne takaisin',
    desc: 'Haemme tuotteet sovittuna päivänä. Vuokra lasketaan toimituksesta noutoon.',
    icon: 'CheckCircle2',
  },
];

export const vuokrausFaqData: FaqItem[] = [
  {
    q: 'Mitä voin vuokrata?',
    a: `Vuokrattavat tuotteet näkyvät tällä sivulla. Tällä hetkellä vuokrattavana: ${available.map((item) => item.title.toLowerCase()).join(', ')}.`,
  },
  ...(box && exampleOrder
    ? [
        {
          q: 'Paljonko muuttolaatikoiden vuokra maksaa?',
          a: `Vuokra on ${formatPricePerDay(box.pricePerDay)} / laatikko / vuorokausi (sis. ALV). Voit vuokrata ${box.qty.min}–${box.qty.max} laatikkoa ${box.days.min}–${box.days.max} vuorokaudeksi. Esimerkiksi 50 laatikkoa 14 vuorokaudeksi maksaa ${formatEuro(exampleOrder.rentalCost)}.`,
        },
        {
          q: 'Kuinka monta muuttolaatikkoa tarvitsen?',
          a: `Nyrkkisääntönä noin yksi laatikko asuinneliötä kohti: ${boxHints}. Lomakkeen pikavalinnoilla näet suuntaa-antavat määrät.`,
        },
      ]
    : []),
  {
    q: 'Onko toimitus ja nouto ilmaista?',
    a: `Toimitus kotiovelle ja nouto ovat ilmaiset, kun vuokraat muuton yhteydessä. Ilman muuttoa ne ovat ilmaiset, kun vuokran arvo on vähintään ${RENTAL_DELIVERY.freeFromRental} € (esim. ${boxesForFreeDelivery} laatikkoa 14 vuorokaudeksi), muuten toimitus ja nouto maksavat yhteensä ${RENTAL_DELIVERY.feeBothWays} € pääkaupunkiseudulla.`,
  },
  {
    q: 'Miten toimitus ja nouto sovitaan?',
    a: 'Valitset tilauksessa toivotun toimituspäivän ja aikaikkunan. Vahvistamme ajan puhelimitse tai sähköpostitse ja sovimme noudon vuokra-ajan päätyttyä. Vuokra lasketaan toimituspäivästä noutopäivään.',
  },
  {
    q: 'Voinko pidentää vuokra-aikaa?',
    a: 'Kyllä. Vuokra jatkuu samalla päivähinnalla, kunnes tuotteet on noudettu. Ilmoita meille, niin sovimme uuden noutopäivän.',
  },
  ...(box?.lostFee
    ? [
        {
          q: 'Mitä jos laatikko katoaa tai menee rikki?',
          a: `Kadonneesta tai rikkoutuneesta laatikosta veloitetaan ${box.lostFee} € / kpl.`,
        },
      ]
    : []),
  {
    q: 'Toimitatteko pääkaupunkiseudun ulkopuolelle?',
    a: 'Toimitus on pääkaupunkiseudulle (Helsinki, Espoo, Vantaa ja Kauniainen). Muualle toimituksesta sovitaan erikseen – kirjoita osoite lomakkeeseen, niin otamme yhteyttä.',
  },
];
