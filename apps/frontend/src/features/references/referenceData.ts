export type ReferenceCase = {
  title: string;
  body: string;
  badge: string;
};

// Jaettu lähde /referenssit-sivulle ja /yrityksille-sivun B2B-caseille (suodatettu badge==='B2B'),
// jotta sisältö ei eriydy kahteen paikkaan kopioituna.
export const cases: ReferenceCase[] = [
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
    badge: 'B2B',
  },
  {
    title: 'Ravintolan terassikalusteet kesäksi ja talveksi',
    body: 'Keväällä 40 tuolia, 12 pöytää, aurinkovarjot ja lämmittimet varastosta terassille ja aseteltuna valmiiksi ennen aukeamista. Syksyllä samat takaisin talvisäilytykseen puhdistettuina ja pinottuina. Molemmat siirrot aamulla ennen lounasta.',
    badge: 'B2B',
  },
  {
    title: 'Myymälän sesonkituotteet varastosta hyllyyn',
    body: 'Joulusesongin somisteet, esittelytelineet ja kausituotteet kuljetettiin varastosta myymälään ennen kampanjan alkua ja palautettiin tammikuussa. Toteutus aamulla ennen myymälän aukeamista, ettei asiakaspalvelu häiriintynyt.',
    badge: 'B2B',
  },
  {
    title: 'Viikoittainen kuljetus varastosta toimipisteisiin',
    body: 'Sovittu ajo kerran viikossa: tavarat noudetaan varastolta ja toimitetaan kahteen toimipisteeseen kannettuna perille asti. Sama kuljettaja joka viikko, joten reitit ja toimituspaikat ovat tuttuja eikä erillistä ohjeistusta tarvita.',
    badge: 'B2B',
  },
  {
    title: 'Porealtaan asennus yritysasiakkaalle Espoossa',
    body: 'Elokuussa 2026 kaivoimme yritysasiakkaalle kuopan ja asensimme porealtaan paikoilleen. Työ valmistui muutamassa tunnissa.',
    badge: 'Työapu',
  },
  {
    title: '75 tuuman television nouto ja seinäasennus Helsingissä',
    body: 'Asiakas osti 75-tuumaisen television verkkokaupasta. Noudimme sen noutopisteestä, kannoimme kotiin ja asensimme betoniseinälle valmiiksi katsottavaksi — asiakkaan ei tarvinnut itse kuljettaa, kantaa eikä asentaa mitään.',
    badge: 'Työapu',
  },
  {
    title: 'Kuolinpesätyhjennnys Helsingissä',
    body: 'Kokonainen asunto tyhjennetty hienotunteisesti. Tavarat lajiteltu – kierrätys, lahjoitus ja kaatopaikka-ajo hoidettu saman päivän aikana.',
    badge: 'Kuolinpesä',
  },
];
