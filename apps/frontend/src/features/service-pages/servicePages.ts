// Palvelusivut (/muuttoapu, /muuttosiivous, /kuljetuspalvelu, /kierratys-ja-poisvienti). Sama ilme kuin
// kaupunkisivuilla (LandingSections.tsx). Hakusanat Search Consolesta 11/2026. Paketit, kuljettajat ja
// jätelajit vastaavat laskuria (Calculator.tsx, pricing.ts). Leipätekstissä ei ole hintoja; UKK:n
// hintakysymyksissä on laskurin alkaen-hinnat (priceFrom.ts).
//
// UUSI PALVELUSIVU: lisää olio SERVICE_PAGES-taulukkoon ja reitti app/(site)/<slug>/page.tsx kuten muut.
import type { FaqItem } from '@/components/Faq/faqData';
import { PRICE_FROM_TEXT } from '@/features/calculator/priceFrom';
import type { InfoSection, ServiceCard } from '@/features/landing/LandingSections';

export type ServicePageSlug = 'muuttoapu' | 'muuttosiivous' | 'kuljetuspalvelu' | 'kierratys-ja-poisvienti';

export type ServicePage = {
  slug: ServicePageSlug;
  path: string;
  /** Murupolun ja Service-schemassa käytetty lyhyt nimi. */
  name: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  h1: string;
  eyebrow: string;
  lead: string;
  heroImage: string;
  calculator: { title: string; text: string; service?: 'moving' | 'transport' | 'recycling'; cleaning?: boolean };
  /** Heron pääpainike (oletus "Laske muuton hinta"). */
  ctaLabel?: string;
  /** Muuton palvelutasot (täyspalvelu, kuljettaja ja auto, kantoapu). Ei kuljetus- ja kierrätyssivuilla. */
  packagesTitle?: string;
  infoTitle: string;
  sections: InfoSection[];
  related: ServiceCard[];
  contactTitle: string;
  faqTitle: string;
  faq: FaqItem[];
  ctaTitle: string;
};

const CARD = {
  palvelut: { icon: '/icons/palvelut/pakkauspalvelu.png', title: 'Kaikki muuttopalvelut', text: 'Pakkaus, muuttosiivous, kuolinpesät ja kuljetukset.', href: '/palvelut' },
  muuttoapu: { icon: '/icons/tyoapu/kantoapu.png', title: 'Muuttoapu', text: 'Muuttomiehet, kantoapu tai kuljettaja autolla.', href: '/muuttoapu' },
  laatikot: { icon: '/icons/palvelut/muuttolaatikot.png', title: 'Muuttolaatikot', text: 'Vuokralaatikot kotiovelle ja nouto tyhjinä.', href: '/muuttolaatikot' },
  yritys: { icon: '/icons/palvelut/yritysmuutto.png', title: 'Yritysmuutot', text: 'Toimistot ja liiketilat, myös iltaisin ja viikonloppuisin.', href: '/yrityksille' },
  tyoapu: { icon: '/icons/palvelut/tyoapu.png', title: 'Työapu', text: 'Asennukset, kantoapu ilman muuttoa ja arjen työt.', href: '/tyoapu' },
  siivous: { icon: '/icons/palvelut/muuttosiivous.png', title: 'Muuttosiivous', text: 'Vanha koti luovutuskuntoon muuton yhteydessä.', href: '/muuttosiivous' },
  kuljetus: { icon: '/icons/palvelut/kuljetukset.png', title: 'Kuljetuspalvelu', text: 'Pakettiauto ja yksi tai kaksi kuljettajaa.', href: '/kuljetuspalvelu' },
  kierratys: { icon: '/icons/palvelut/kuolinpesa.png', title: 'Kierrätys ja poisvienti', text: 'Vanhat huonekalut, kodinkoneet ja jätteet pois.', href: '/kierratys-ja-poisvienti' },
  muistilista: { icon: '/icons/tyoapu/kerro-tarpeesi.png', title: 'Muuton muistilista', text: 'Kaikki muuton tehtävät aikajärjestyksessä.', href: '/muuton-muistilista' },
} satisfies Record<string, ServiceCard>;

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'muuttoapu',
    path: '/muuttoapu',
    name: 'Muuttoapu',
    seoTitle: 'Muuttoapu – muuttomiehet ja kantoapu',
    seoDescription:
      'Muuttoapu pääkaupunkiseudulla ja Tampereella: muuttomiehet, kantoapu tai kuljettaja autolla. Valitse, paljonko teet itse, ja näe hinta heti laskurista.',
    keywords: ['muuttoapu', 'muuttomiehet', 'kantoapu', 'muuttoapu helsinki', 'muuttoapu tampere', 'muuttoapu espoo', 'edullinen muuttoapu', 'muuttomies hinta'],
    h1: 'Muuttoapu ja muuttomiehet',
    eyebrow: 'Pääkaupunkiseutu ja Tampere',
    lead: 'Tarvitsetko lisäkädet muuttoon? Saat meiltä muuttomiehet, pelkän kantoavun tai kuljettajan autolla – juuri niin paljon apua kuin tarvitset. Näet hinnan heti laskurista.',
    heroImage: '/images/webp/hero/hero-8.jpg',
    calculator: {
      title: 'Laske muuttoavun hinta',
      text: 'Valitse laskurissa täyspalvelu, kuljettaja ja auto tai pelkkä kantoapu – näet kiinteän hinnan heti.',
    },
    packagesTitle: 'Kolme tapaa saada muuttoapua',
    infoTitle: 'Juuri niin paljon apua kuin tarvitset',
    sections: [
      {
        heading: 'Kantoapu, kun auto on jo varattu',
        icon: '/icons/tyoapu/kantoapu.png',
        paragraphs: [
          'Jos olet vuokrannut pakettiauton tai sinulla on oma, tarvitset vain lisäkädet. Kantoavussa paikalle tulee kaksi kantajaa, jotka kantavat huonekalut ja laatikot portaissa ja hississä ja auttavat lastaamaan auton.',
          'Kerro laskurissa molempien osoitteiden kerrokset ja hissit, niin kantajien työaika ja hinta lasketaan oikein.',
        ],
      },
      {
        heading: 'Kuljettaja ja auto, kun autat itse',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Kuljettaja tuo kuorma-auton ja ajaa kuorman perille. Kun pääset itse kantamaan, tämä on usein edullisin tapa muuttaa, esimerkiksi opiskelijamuutoissa ja pienissä muutoissa.',
        ],
      },
      {
        heading: 'Täyspalvelu, kun et halua nostaa mitään',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Täyspalvelussa muuttajat kantavat, suojaavat herkät tavarat ja kuljettavat kaiken. Sinun tehtäväksesi jää kertoa, mihin tavarat tulevat.',
          'Samalla voit tilata pakkauspalvelun, muuttosiivouksen ja vuokralaatikot, jolloin koko muutto hoituu yhdellä tilauksella.',
        ],
      },
      {
        heading: 'Raskaat ja hankalat esineet',
        icon: '/icons/tyoapu/tyokalut.png',
        paragraphs: [
          'Kuntolaitteet, amerikkalaiset jääkaapit, pesutornit ja isot kulmasohvat vaativat oikeat välineet ja riittävästi käsiä. Lisää ne laskuriin muiden tavaroiden tapaan, niin ne huomioidaan hinnassa etukäteen. Pianoja ja kassakaappeja emme muuta.',
        ],
      },
      {
        heading: 'Edullinen muuttoapu – näin säästät',
        icon: '/icons/tyoapu/hinta.png',
        paragraphs: [
          'Valitse tiistai tai keskiviikko, varsinkin kuun puolivälistä, pakkaa tavarat valmiiksi laatikoihin ja valitse paketti, jossa teet itse sen, mihin pystyt. Laskuri näyttää jokaisen päivän hinnan, joten näet säästön heti.',
        ],
      },
      {
        heading: 'Muuttoapu pääkaupunkiseudulla ja Tampereella',
        icon: '/icons/tyoapu/suosituimmat.png',
        paragraphs: [
          'Palvelemme koko pääkaupunkiseudulla sekä Tampereen seudulla, jossa meillä on oma tiimi ja tukikohta Hervannassa. Muutamme myös kaupunkien välillä ja muualle Suomeen.',
        ],
      },
    ],
    related: [CARD.palvelut, CARD.laatikot, CARD.yritys, CARD.tyoapu],
    contactTitle: 'Mietitkö, minkä verran apua tarvitset?',
    faqTitle: 'Usein kysyttyä muuttoavusta',
    faq: [
      {
        q: 'Paljonko muuttoapu maksaa?',
        a: `Muuttoavussa ${PRICE_FROM_TEXT.lighterPackages}. Täyspalvelumuutossa, jossa me kannamme ja kuljetamme kaiken, ${PRICE_FROM_TEXT.fullService}. Hinnat sisältävät ALV:n. Lopullinen hinta riippuu paketista, tavaramäärästä, kerroksista ja hisseistä sekä muuttopäivästä. Näet kiinteän hinnan heti tämän sivun laskurista, eikä laskeminen sido sinua mihinkään.`,
      },
      {
        q: 'Mitä eroa on kantoavulla ja täyspalvelulla?',
        a: 'Kantoavussa tulee kaksi kantajaa ilman autoa, joten auto järjestetään itse. Täyspalvelussa saat muuttajat ja muuttoauton, ja me hoidamme kantamisen, suojauksen ja kuljetuksen.',
      },
      {
        q: 'Kannatteko portaissa, jos talossa ei ole hissiä?',
        a: 'Kyllä. Kerro laskurissa kerros ja hissi molemmissa osoitteissa, niin portaissa kantaminen sisältyy hintaan valmiiksi.',
      },
      { q: 'Onko muuttoapu vakuutettu?', a: 'Kyllä. Muuttovakuutus sisältyy kaikkiin paketteihin, myös pelkkään kantoapuun.' },
      {
        q: 'Voinko tilata muuttoavun viikonlopuksi?',
        a: 'Kyllä. Palvelemme joka päivä, ja laskuri näyttää hinnan myös viikonlopuille. Perjantait ja viikonloput ovat suosituimpia, joten ne kannattaa varata ajoissa.',
      },
      {
        q: 'Autatteko kantamisessa ilman muuttoa?',
        a: 'Kyllä. Jos tarvitset kantoapua esimerkiksi huonekalujen siirtoon tai kierrätykseen ilman muuttoa, katso Työapu-palvelumme.',
      },
    ],
    ctaTitle: 'Tarvitsetko muuttoapua?',
  },
  {
    slug: 'muuttosiivous',
    path: '/muuttosiivous',
    name: 'Muuttosiivous',
    seoTitle: 'Muuttosiivous – luovutussiivous muuton kanssa',
    seoDescription:
      'Muuttosiivous kiinteällä hinnalla asunnon koon mukaan samalla tilauksella muuton kanssa. Vanha koti luovutetaan siistinä vuokranantajalle tai ostajalle.',
    keywords: ['muuttosiivous', 'luovutussiivous', 'muuttosiivous hinta', 'muuttosiivous helsinki', 'loppusiivous vuokra-asunto', 'muutto ja siivous'],
    h1: 'Muuttosiivous',
    eyebrow: 'Muuton lisäpalvelu',
    lead: 'Kun muutamme tavarasi, siivoamme samalla vanhan kodin luovutuskuntoon. Muuttosiivouksella on kiinteä hinta asunnon koon mukaan, ja lisäät sen muuttoon laskurissa yhdellä valinnalla.',
    heroImage: '/images/webp/hero/hero-14.jpg',
    calculator: {
      title: 'Laske muutto ja muuttosiivous',
      text: 'Muuttosiivous on valittu valmiiksi. Syötä muuton tiedot, niin näet koko hinnan heti.',
      cleaning: true,
    },
    packagesTitle: 'Valitse muuton palvelutaso',
    infoTitle: 'Vanha koti luovutuskuntoon',
    sections: [
      {
        heading: 'Kiinteä hinta asunnon koon mukaan',
        icon: '/icons/tyoapu/hinta.png',
        paragraphs: [
          'Muuttosiivouksen hinta määräytyy asunnon koon mukaan, eikä siihen vaikuta siivoukseen kuluva aika. Hinta näkyy laskurissa omana rivinään, ja se lisätään muuton hintaan ilman yllätyksiä.',
        ],
      },
      {
        heading: 'Muutto ja siivous samalla tilauksella',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Kun muutto ja siivous tilataan yhdessä, sinun ei tarvitse sovittaa aikatauluja eri yritysten kesken. Siivous tehdään tyhjään asuntoon, kun tavarat on muutettu.',
        ],
      },
      {
        heading: 'Mitä luovutussiivouksessa siivotaan?',
        icon: '/icons/palvelut/muuttosiivous.png',
        paragraphs: [
          'Luovutussiivouksessa siivotaan tyypillisesti lattiat, keittiö ja kaapit sisältä, kodinkoneet, kylpyhuone ja WC sekä pinnat ja ikkunalaudat. Kerro varauksen yhteydessä, jos asunnossa on jotain erityistä huomioitavaa.',
        ],
      },
      {
        heading: 'Vuokra-asunnon luovutus ilman jälkiselvittelyjä',
        icon: '/icons/tyoapu/valmis.png',
        paragraphs: [
          'Vuokra-asunto luovutetaan siivottuna. Kun siivous on hoidettu, avainten luovutus ja vuokranantajan tarkastus sujuvat ilman jälkiselvittelyjä.',
        ],
      },
    ],
    related: [CARD.muuttoapu, CARD.laatikot, CARD.muistilista, CARD.palvelut],
    contactTitle: 'Kysyttävää muuttosiivouksesta?',
    faqTitle: 'Usein kysyttyä muuttosiivouksesta',
    faq: [
      {
        q: 'Paljonko muuttosiivous maksaa?',
        a: `Muuttosiivouksella on kiinteä hinta asunnon koon mukaan: ${PRICE_FROM_TEXT.cleaning} (sis. ALV). Hinta ei riipu tavaramäärästä. Näet sen laskurissa heti, kun valitset muuttosiivouksen ja asunnon koon.`,
      },
      {
        q: 'Saako muuttosiivoukseen päiväalennuksen?',
        a: 'Ei. Muuttosiivous on kiinteähintainen, eikä edullisten päivien alennus koske sitä. Alennus koskee itse muuttoa.',
      },
      {
        q: 'Kenen vastuulla vuokra-asunnon loppusiivous on?',
        a: 'Yleensä vuokralaisen. Asunto luovutetaan siivottuna, ja vuokranantaja voi periä siivouksen kustannukset, jos asunto jää likaiseksi.',
      },
      {
        q: 'Siivotaanko asunto tyhjänä?',
        a: 'Kyllä. Siivous tehdään, kun tavarat on muutettu pois, jolloin myös kaappien sisäpuolet ja lattiat saadaan siivottua kunnolla.',
      },
      {
        q: 'Miten muuttosiivous varataan?',
        a: 'Valitse laskurissa muutto ja lisää muuttosiivous lisäpalveluista. Siivous varataan samalla, kun vahvistat muuton.',
      },
    ],
    ctaTitle: 'Muutto ja siivous samalla kertaa',
  },
  {
    slug: 'kuljetuspalvelu',
    path: '/kuljetuspalvelu',
    name: 'Kuljetuspalvelu',
    seoTitle: 'Kuljetuspalvelu – pakettiauto kuljettajalla',
    seoDescription:
      'Kuljetuspalvelu pääkaupunkiseudulla ja Tampereella: huonekalut, kodinkoneet ja ostokset pakettiautolla, yksi tai kaksi kuljettajaa. Näe hinta heti laskurista.',
    keywords: ['kuljetuspalvelu', 'pakettiauto kuljettajalla', 'muuttokuljetus', 'huonekalujen kuljetus', 'kodinkoneiden kuljetus', 'muuttoauto kuljettajalla', 'kuljetus helsinki'],
    h1: 'Kuljetuspalvelu ja pakettiauto kuljettajalla',
    eyebrow: 'Pääkaupunkiseutu ja Tampere',
    lead: 'Sohva kirpputorilta, pesukone kaupasta tai pieni muutto opiskelijakämpästä? Tuomme pakettiauton ja yhden tai kaksi kuljettajaa, ja näet hinnan heti laskurista.',
    heroImage: '/images/webp/hero/hero-13.jpg',
    ctaLabel: 'Laske kuljetuksen hinta',
    calculator: {
      title: 'Laske kuljetuksen hinta',
      text: 'Laskuri on valmiiksi kuljetuksessa. Syötä osoitteet ja tavarat, niin näet kiinteän hinnan heti.',
      service: 'transport',
    },
    infoTitle: 'Kuljetus kotiovelta kotiovelle',
    sections: [
      {
        heading: 'Yksi vai kaksi kuljettajaa?',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Yksi kuljettaja riittää, kun tavarat ovat kevyitä tai autat itse kantamisessa. Kaksi kuljettajaa kannattaa valita sohvalle, kodinkoneille ja muille painaville tavaroille, jotka vaativat kaksi kantajaa.',
        ],
      },
      {
        heading: 'Huonekalut ja kodinkoneet',
        icon: '/icons/tyoapu/kantoapu.png',
        paragraphs: [
          'Kuljetamme sohvat, sängyt, kaapit, pesukoneet ja jääkaapit kotiovelta kotiovelle. Lisää tavarat laskuriin, niin hinta vastaa todellista kuormaa.',
        ],
      },
      {
        heading: 'Ostokset ja kirpputorilöydöt',
        icon: '/icons/palvelut/muuttolaatikot.png',
        paragraphs: [
          'Haemme ostoksesi huonekaluliikkeestä, kirpputorilta tai verkkokaupan noutopisteestä ja kannamme ne sisälle.',
        ],
      },
      {
        heading: 'Pienet muutot',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Opiskelijakämpän tai varastokopin tyhjennykseen ei tarvita koko muuttotiimiä. Kuljetuspalvelu on edullinen tapa siirtää muutama huonekalu ja laatikot.',
        ],
      },
    ],
    related: [CARD.muuttoapu, CARD.kierratys, CARD.tyoapu, CARD.palvelut],
    contactTitle: 'Kysyttävää kuljetuksesta?',
    faqTitle: 'Usein kysyttyä kuljetuspalvelusta',
    faq: [
      {
        q: 'Paljonko kuljetus maksaa?',
        a: `Kuljetus maksaa ${PRICE_FROM_TEXT.transport} (sis. ALV). Lopullinen hinta riippuu matkasta, tavaroista, kerroksista ja kuljettajien määrästä. Laske hinta tämän sivun laskurilla – näet sen heti ilman sitoumusta.`,
      },
      {
        q: 'Kantavatteko kuljettajat tavarat sisälle?',
        a: 'Kyllä. Kuljettajat kantavat tavarat autoon ja perillä sisälle. Kerro laskurissa kerrokset ja hissit, niin ne huomioidaan hinnassa.',
      },
      {
        q: 'Kuljetatteko kodinkoneita?',
        a: 'Kyllä. Pesukoneet, jääkaapit ja muut kodinkoneet kuljetetaan suojattuina. Valitse painaville koneille kaksi kuljettajaa.',
      },
      { q: 'Onko kuljetus vakuutettu?', a: 'Kyllä. Kuljetusvakuutus sisältyy hintaan.' },
      {
        q: 'Kuljetatteko toiselle paikkakunnalle?',
        a: 'Kyllä. Laskuri laskee hinnan osoitteiden välisen matkan mukaan, myös pidemmille kuljetuksille.',
      },
    ],
    ctaTitle: 'Tarvitsetko kuljetusta?',
  },
  {
    slug: 'kierratys-ja-poisvienti',
    path: '/kierratys-ja-poisvienti',
    name: 'Kierrätys ja poisvienti',
    seoTitle: 'Kierrätys ja poisvienti – tavarat pois kotoa',
    seoDescription:
      'Vanhojen huonekalujen, kodinkoneiden ja jätteiden poisvienti: haemme, kannamme ja viemme oikeaan vastaanottopaikkaan. Näe hinta heti laskurista.',
    keywords: ['kierrätys', 'poisvienti', 'huonekalujen poisvienti', 'kodinkoneiden poisvienti', 'jätteiden noutopalvelu', 'tavaroiden noutopalvelu', 'vanhan pesukoneen poisvienti', 'suurjätteen nouto'],
    h1: 'Kierrätys ja poisvienti',
    eyebrow: 'Vanhat tavarat pois kotoa',
    lead: 'Vanha sohva, rikkinäinen pesukone tai varaston täysi tyhjennys? Haemme tavarat, kannamme ne autoon ja viemme kierrätykseen tai jäteasemalle. Näet hinnan heti laskurista.',
    heroImage: '/images/webp/hero/hero-12.jpg',
    ctaLabel: 'Laske poisviennin hinta',
    calculator: {
      title: 'Laske poisviennin hinta',
      text: 'Laskuri on valmiiksi kierrätyksessä. Valitse tavarat ja jätelajit, niin näet hinnan heti.',
      service: 'recycling',
    },
    infoTitle: 'Viemme tavarat oikeaan paikkaan',
    sections: [
      {
        heading: 'Huonekalut ja suurjäte',
        icon: '/icons/tyoapu/kantoapu.png',
        paragraphs: [
          'Sohvat, sängyt, patjat, matot ja kaapit viedään suurjätteenä oikeaan vastaanottopaikkaan. Kannamme tavarat itse portaista, kellarista ja varastosta.',
        ],
      },
      {
        heading: 'Kodinkoneet ja elektroniikka',
        icon: '/icons/tyoapu/kodin-asennukset.png',
        paragraphs: [
          'Metalliset kodinkoneet ja elektroniikka (SER) kierrätetään ilman jätemaksua, joten niiden poisviennissä maksat vain työstä ja kuljetuksesta.',
        ],
      },
      {
        heading: 'Remontti- ja sekajäte',
        icon: '/icons/tyoapu/tyokalut.png',
        paragraphs: [
          'Viemme myös puujätteen, sekajätteen ja remontista jääneen rakennusjätteen. Jätelaji vaikuttaa hintaan, koska vastaanottopaikat veloittavat jätelajit eri tavoin.',
        ],
      },
      {
        heading: 'Lajittelu hoituu puolestasi',
        icon: '/icons/tyoapu/valmis.png',
        paragraphs: [
          'Valitse laskurissa kuorman jätelajit, niin tiedämme etukäteen, mihin kuorma viedään. Ehjät tavarat voidaan sopimuksen mukaan viedä myös kierrätyskeskukseen uudelleenkäyttöön.',
        ],
      },
      {
        heading: 'Kuolinpesät ja isot tyhjennykset',
        icon: '/icons/palvelut/kuolinpesa.png',
        paragraphs: [
          'Tyhjennämme myös kokonaisia asuntoja, varastoja ja kuolinpesiä hienovaraisesti. Isommissa tyhjennyksissä teemme tarjouksen kohteen mukaan.',
        ],
      },
    ],
    related: [CARD.kuljetus, CARD.muuttoapu, CARD.tyoapu, CARD.palvelut],
    contactTitle: 'Kysyttävää poisviennistä?',
    faqTitle: 'Usein kysyttyä kierrätyksestä ja poisviennistä',
    faq: [
      {
        q: 'Paljonko poisvienti maksaa?',
        a: 'Hinta muodostuu työstä, kuljetuksesta ja jätelajien vastaanottomaksuista. Valitse laskurissa tavarat ja jätelajit, niin näet hinnan heti.',
      },
      {
        q: 'Mistä ei peritä jätemaksua?',
        a: 'Metalliset kodinkoneet ja elektroniikka (SER) kierrätetään ilman jätemaksua.',
      },
      {
        q: 'Viettekö vanhan pesukoneen tai jääkaapin?',
        a: 'Kyllä. Kodinkoneet ovat kierrätettävää metallia tai elektroniikkaa, joten niistä ei peritä jätemaksua.',
      },
      {
        q: 'Täytyykö tavarat lajitella itse?',
        a: 'Ei. Riittää, että kerrot laskurissa, mitä jätelajeja kuormassa on. Viemme tavarat oikeisiin vastaanottopaikkoihin.',
      },
      {
        q: 'Hoidatteko kuolinpesän tyhjennyksen?',
        a: 'Kyllä. Tyhjennämme kuolinpesät hienovaraisesti ja sovitusti: ehjät tavarat voidaan lahjoittaa tai viedä kierrätyskeskukseen ja loput kierrätetään.',
      },
    ],
    ctaTitle: 'Tavarat pois kotoa',
  },
];

export function getServicePage(slug: ServicePageSlug): ServicePage {
  const page = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Tuntematon palvelusivu: ${slug}`);
  return page;
}
