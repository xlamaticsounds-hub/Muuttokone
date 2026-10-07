// Muuttolaatikot-kaupunkisivut (/muuttolaatikot/helsinki, /espoo, /vantaa). Jokaisella sivulla on
// omaa paikallista sisältöä (alueet, postinumerot, vinkki, UKK), jotta sivut eivät ole kopioita
// toisistaan. Hinnat ja toimitussäännöt luetaan rental.ts:stä.
//
// UUDEN KAUPUNGIN LISÄÄMINEN: lisää olio BOX_CITIES-taulukkoon ja tarkista, että toimitat sinne
// oikeasti (lomakkeen toimitusalue on pääkaupunkiseutu, ks. isDeliveryAreaPostalCode rental.ts:ssä).
// Sivu, sivukartta ja linkitykset poimivat sen automaattisesti.
import { BOX_ITEM_ID, RENTAL_DELIVERY, calculateRentalOrder, formatEuro, formatPricePerDay, getRentalItem } from './rental';

export type BoxCity = {
  slug: string;
  name: string;
  inessive: string; // missä: "Helsingissä"
  illative: string; // mihin: "Helsinkiin"
  postalCodes: string; // esim. "00-alkaiset postinumerot"
  districts: string[];
  intro: string;
  localTip: { title: string; text: string };
};

export const BOX_CITIES: BoxCity[] = [
  {
    slug: 'helsinki',
    name: 'Helsinki',
    inessive: 'Helsingissä',
    illative: 'Helsinkiin',
    postalCodes: '00-alkaiset postinumerot (00100–00990)',
    districts: ['Kallio', 'Töölö', 'Kruununhaka', 'Punavuori', 'Pasila', 'Vallila', 'Käpylä', 'Herttoniemi', 'Itäkeskus', 'Vuosaari', 'Lauttasaari', 'Munkkiniemi', 'Malmi'],
    intro:
      'Toimitamme muuttolaatikot kotiovelle kaikkialle Helsinkiin – kantakaupungista kaupunginosiin. Valitset määrän ja vuokra-ajan, me tuomme laatikot sovittuna päivänä ja haemme ne tyhjinä muuton jälkeen.',
    localTip: {
      title: 'Kantakaupungin kerrostaloihin',
      text: 'Helsingin vanhoissa kerrostaloissa hissit ovat usein pieniä ja rappukäytävät kapeita. Samanlaiset pinottavat laatikot kulkevat hississä ja portaissa helpommin kuin eri kokoiset pahvilaatikot.',
    },
  },
  {
    slug: 'espoo',
    name: 'Espoo',
    inessive: 'Espoossa',
    illative: 'Espooseen',
    postalCodes: '02-alkaiset postinumerot (Espoo ja Kauniainen)',
    districts: ['Tapiola', 'Leppävaara', 'Matinkylä', 'Olari', 'Espoon keskus', 'Espoonlahti', 'Kauklahti', 'Otaniemi', 'Kauniainen'],
    intro:
      'Toimitamme muuttolaatikot koko Espooseen ja Kauniaisiin – Tapiolasta Kauklahteen ja Leppävaarasta Espoonlahteen. Laatikot tulevat ovelle sovittuna päivänä, ja noudamme ne tyhjinä muuton jälkeen.',
    localTip: {
      title: 'Rivi- ja omakotitaloihin',
      text: 'Espoossa asutaan paljon rivi- ja omakotitaloissa, joissa tavaraa kertyy enemmän kuin kerrostaloasunnossa. Isompaan kotiin laatikoita kannattaa varata noin 90–150 kappaletta; enimmäismäärä tilausta kohti on 150.',
    },
  },
  {
    slug: 'vantaa',
    name: 'Vantaa',
    inessive: 'Vantaalla',
    illative: 'Vantaalle',
    postalCodes: '01-alkaiset postinumerot',
    districts: ['Tikkurila', 'Myyrmäki', 'Korso', 'Hakunila', 'Kivistö', 'Aviapolis', 'Martinlaakso', 'Koivukylä'],
    intro:
      'Toimitamme muuttolaatikot koko Vantaalle – Tikkurilasta Myyrmäkeen, Korsosta Kivistöön. Vuokraat vain tarvitsemasi ajan, ja me hoidamme toimituksen ja noudon.',
    localTip: {
      title: 'Kerrostalosta pientaloon ja päinvastoin',
      text: 'Vantaalla on sekä kerrostalo- että pientaloalueita, ja laatikoiden tarve vaihtelee: kerrostalokaksioon riittää usein noin 50 laatikkoa, rivitaloon noin 90. Lomakkeen pikavalinnat auttavat arvioimaan määrän.',
    },
  },
];

export function getBoxCity(slug: string): BoxCity | undefined {
  return BOX_CITIES.find((city) => city.slug === slug);
}

const box = getRentalItem(BOX_ITEM_ID);

export function getBoxCitySeo(city: BoxCity) {
  const rate = box ? formatPricePerDay(box.pricePerDay) : '';
  return {
    title: `Muuttolaatikot vuokralle ${city.inessive} – ${rate}/vrk`,
    description: `Vuokraa muuttolaatikot ${city.inessive}: ${rate}/laatikko/vrk. Toimitus ja nouto kotiovelle ilmaiseksi muuton yhteydessä tai kun vuokra on vähintään ${RENTAL_DELIVERY.freeFromRental} €.`,
    keywords: [
      `muuttolaatikot ${city.name}`,
      `muuttolaatikot ${city.inessive}`,
      `muuttolaatikoiden vuokraus ${city.name}`,
      `vuokraa muuttolaatikot ${city.name}`,
      'muuttolaatikon vuokra hinta',
    ],
    canonical: `/muuttolaatikot/${city.slug}`,
  };
}

/** Kaupunkikohtaiset UKK:t (omat sanamuodot, ei kopioita muilta sivuilta). */
export function getBoxCityFaq(city: BoxCity): { q: string; a: string }[] {
  if (!box) return [];
  const example = calculateRentalOrder([{ itemId: BOX_ITEM_ID, qty: 50, days: 14 }], { withMove: false });
  return [
    {
      q: `Toimitatteko muuttolaatikot ${city.illative}?`,
      a: `Kyllä. Toimitamme laatikot ${city.illative} kaikkiin osoitteisiin, joiden postinumero kuuluu alueeseen: ${city.postalCodes}. Toimitus ja nouto ovat ilmaiset, kun vuokraat laatikot muuton yhteydessä tai kun vuokran arvo on vähintään ${RENTAL_DELIVERY.freeFromRental} €. Muuten toimitus ja nouto maksavat yhteensä ${RENTAL_DELIVERY.feeBothWays} €.`,
    },
    {
      q: `Paljonko muuttolaatikoiden vuokra maksaa ${city.inessive}?`,
      a: `Hinta on sama koko pääkaupunkiseudulla: ${formatPricePerDay(box.pricePerDay)} / laatikko / vuorokausi (sis. ALV).${example ? ` Esimerkiksi 50 laatikkoa 14 vuorokaudeksi maksaa ${formatEuro(example.rentalCost)}.` : ''} Voit vuokrata ${box.qty.min}–${box.qty.max} laatikkoa ${box.days.min}–${box.days.max} vuorokaudeksi.`,
    },
    {
      q: `Kuinka monta laatikkoa tarvitsen ${city.inessive} asuntoon?`,
      a: `Nyrkkisääntönä noin yksi laatikko asuinneliötä kohti: ${box.qtyHints?.map((h) => `${h.label.toLowerCase()} noin ${h.qty}`).join(', ')}. Tilauslomakkeen pikavalinnoilla näet suuntaa-antavat määrät.`,
    },
  ];
}
