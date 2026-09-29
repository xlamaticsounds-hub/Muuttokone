import type { FaqItem } from '@/components/Faq';
import type { ProcessStep } from '@/components/ProcessSteps';

// Työapu-sivun sisältö. Kategoriat ovat samat kuin tarjouslomakkeen valikossa
// (TyoapuQuoteForm), jotta asiakas löytää oman tarpeensa kummastakin.
export type TyoapuCategory = {
  id: string;
  title: string;
  intro: string;
  items: { title: string; desc: string }[];
};

export const tyoapuCategories: TyoapuCategory[] = [
  {
    id: 'kodin-asennukset',
    title: 'Kodin asennukset',
    intro: 'Kodinkoneet, televisiot ja kalusteet paikoilleen — ilman omia työkaluja ja selkäkipuja.',
    items: [
      { title: 'TV:n asennus seinälle', desc: 'Seinätelineen kiinnitys, television nosto paikalleen ja johtojen siisti piilotus.' },
      { title: 'Pesukoneen ja astianpesukoneen asennus', desc: 'Kone paikalleen ja kytkentä valmiisiin vesi- ja viemäriliitäntöihin, vanha kone pois.' },
      { title: 'Kalusteiden kokoaminen', desc: 'Kaapit, sängyt, hyllyt ja työpöydät koottuna ja tarvittaessa seinään kiinnitettynä.' },
      { title: 'Hyllyt, taulut ja verhotangot', desc: 'Kiinnitykset oikeilla tulpilla seinämateriaalin mukaan, suoraan ja tukevasti.' },
    ],
  },
  {
    id: 'it-apu',
    title: 'IT-apu',
    intro: 'Laitteet toimimaan kotona ja toimistolla — selitämme asiat selkokielellä.',
    items: [
      { title: 'Tietokoneen käyttöönotto', desc: 'Uusi kone käyttökuntoon, tiedostot vanhalta koneelta ja tarvittavat ohjelmat asennettuna.' },
      { title: 'Wifi, tulostin ja älytv', desc: 'Verkon asennus ja kuuluvuuden parannus, tulostimen ja älytelevision yhdistäminen.' },
      { title: 'Toimiston IT-laitteiden asennus', desc: 'Työpisteet, näytöt, telakat ja verkkolaitteet paikoilleen ja kaapeloituna siististi.' },
    ],
  },
  {
    id: 'piha-ja-ulkotyot',
    title: 'Piha- ja ulkotyöt',
    intro: 'Raskaammat ulkotyöt pihalla, mökillä ja yrityksen tiloissa.',
    items: [
      { title: 'Kaivuutyöt', desc: 'Kuopat ja kaivannot käsin tai pienkoneella esimerkiksi altaalle, perustuksille tai istutuksille.' },
      { title: 'Porealtaan asennus', desc: 'Kuoppa, pohjatyöt ja altaan siirto paikoilleen. Sähköliitännän tekee valtuutettu sähköasentaja.' },
      { title: 'Terassi- ja pihakalusteet', desc: 'Kalusteet paikoilleen keväällä ja talvisäilytykseen syksyllä.' },
      { title: 'Piha- ja puutarhajätteen poisvienti', desc: 'Oksat, lehdet, vanhat kalusteet ja rakennusjäte kerättynä ja vietynä pois.' },
    ],
  },
  {
    id: 'kantoapu',
    title: 'Kantoapu',
    intro: 'Kun jotain raskasta pitää siirtää, emmekä tarvitse koko muuttoa.',
    items: [
      { title: 'Raskaat esineet', desc: 'Kassakaapit, kuntolaitteet, pianot ja muut painavat esineet portaissa ja ahtaissa paikoissa.' },
      { title: 'Kalusteiden siirrot', desc: 'Huonekalut toiseen huoneeseen, kerrokseen tai varastoon, esim. remontin ajaksi.' },
      { title: 'Tavaran poisvienti', desc: 'Vanhat huonekalut ja kodinkoneet ulos ja kierrätykseen tai jäteasemalle.' },
    ],
  },
  {
    id: 'yrityksille',
    title: 'Yrityksille',
    intro: 'Lisäkädet yrityksen arkeen — kertaluonteisesti tai sovitusti toistuvasti.',
    items: [
      { title: 'Säännölliset kuljetukset', desc: 'Sovittu ajo esim. kerran viikossa varastosta toimipisteisiin, sama tiimi joka kerta.' },
      { title: 'Kausisiirrot', desc: 'Terassikalusteet, sesonkituotteet ja kampanjasomisteet oikeaan paikkaan oikeaan aikaan.' },
      { title: 'Tapahtumat ja messut', desc: 'Osastot, kalusteet ja tekniikka paikalle ja takaisin, myös iltaisin ja viikonloppuisin.' },
    ],
  },
];

export const tyoapuProcessSteps: ProcessStep[] = [
  {
    title: 'Kerro tarpeesi',
    desc: 'Täytä lomake tai soita. Kuvat ja mitat nopeuttavat tarjousta.',
    icon: 'ClipboardList',
    highlight: true,
    href: '#tarjous',
  },
  {
    title: 'Saat tarjouksen',
    desc: 'Sovimme kiinteästä hinnasta tai tuntiveloituksesta — kumpi sopii työhön paremmin.',
    icon: 'Calculator',
  },
  {
    title: 'Sovitaan ajankohta',
    desc: 'Tulemme sovittuna päivänä, tarvittaessa myös iltaisin ja viikonloppuisin.',
    icon: 'CalendarCheck',
  },
  {
    title: 'Työ valmiiksi',
    desc: 'Teemme työn alusta loppuun ja viemme ylimääräiset pakkaukset mennessämme.',
    icon: 'CheckCircle2',
  },
];

export const tyoapuFaqData: FaqItem[] = [
  {
    q: 'Paljonko työapu maksaa?',
    a: 'Hinta riippuu työstä. Voimme sopia kiinteän hinnan, jolloin tiedät kokonaissumman etukäteen, tai tuntiveloituksen, joka sopii töihin joiden kestoa on vaikea arvioida. Pyydä tarjous, niin kerromme vaihtoehdot.',
  },
  {
    q: 'Saanko kotitalousvähennyksen?',
    a: 'Kotona tehdyistä asennus-, kunnossapito- ja pihatöistä voit yleensä saada kotitalousvähennyksen työn osuudesta. Erittelemme työn osuuden laskulle. Tarkista ajantasaiset ehdot ja enimmäismäärät Verohallinnon sivuilta.',
  },
  {
    q: 'Teettekö myös sähkö- ja putkitöitä?',
    a: 'Emme tee luvanvaraisia sähkötöitä emmekä uusia vesi- tai viemäriliitäntöjä. Kytkemme koneet valmiisiin liitäntöihin, ja esimerkiksi porealtaan sähköliitännän tekee valtuutettu sähköasentaja.',
  },
  {
    q: 'Tarvitseeko minun hankkia työkalut tai tarvikkeet?',
    a: 'Ei — tuomme omat työkalut. Kiinnitystarvikkeet voimme hankkia puolestasi, tai voit hankkia esimerkiksi TV-telineen itse etukäteen.',
  },
  {
    q: 'Voiko teiltä tilata apua säännöllisesti?',
    a: 'Kyllä. Yrityksille sovimme esimerkiksi viikoittaisista kuljetuksista tai kausittaisista siirroista, ja pyrimme lähettämään saman tiimin joka kerta.',
  },
];
