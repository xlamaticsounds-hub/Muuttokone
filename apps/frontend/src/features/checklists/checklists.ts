// Muistilistasivut (/muuton-muistilista, /yritysmuuton-muistilista). Koodissa eikä blogin tietokannassa, jotta
// sisältö, rakenteinen data ja tulostettava lista pysyvät hallinnassa. Search Console 11/2026: "muutto muistilista",
// "muistilista muuttajalle", "muuton muistilista" sijoilla ~18 ja "yritysmuutto muistilista" ~15 ilman omaa sivua.
//
// Viralliset määräajat (tarkistettu 11/2026):
// - Muuttoilmoitus aikaisintaan kuukautta ennen ja viimeistään viikon kuluttua muutosta (DVV / Posti).
// - Vuokralaisen irtisanomisaika toistaiseksi voimassa olevassa sopimuksessa 1 kalenterikuukausi, laskettuna sen
//   kuukauden viimeisestä päivästä, jonka aikana irtisanotaan (laki asuinhuoneiston vuokrauksesta 52 §).
import type { FaqItem } from '@/components/Faq/faqData';
import type { InfoSection } from '@/features/landing/LandingSections';

export type ChecklistItem = { text: string; link?: { href: string; label: string } };
export type ChecklistPhase = { id: string; title: string; icon: string; items: ChecklistItem[] };

export type ChecklistPage = {
  slug: 'muuton-muistilista' | 'yritysmuuton-muistilista';
  path: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  h1: string;
  eyebrow: string;
  lead: string;
  heroImage: string;
  /** Localstoragen avain rastien tallennukseen (vain kävijän omassa selaimessa). */
  storageKey: string;
  phases: ChecklistPhase[];
  tips: InfoSection[];
  faq: FaqItem[];
};

export const CHECKLIST_PAGES: ChecklistPage[] = [
  {
    slug: 'muuton-muistilista',
    path: '/muuton-muistilista',
    seoTitle: 'Muuton muistilista – tulostettava tarkistuslista',
    seoDescription:
      'Muuton muistilista vaihe vaiheelta: mitä tehdä kaksi kuukautta, kuukausi ja viikko ennen muuttoa sekä muuttopäivänä. Tulostettava lista ja vinkit.',
    keywords: ['muuton muistilista', 'muutto muistilista', 'muistilista muuttajalle', 'muuttajan muistilista', 'tulostettava muuttajan muistilista', 'mitä tehdä ennen muuttoa'],
    h1: 'Muuton muistilista',
    eyebrow: 'Tulostettava tarkistuslista',
    lead: 'Kaikki muuton tehtävät aikajärjestyksessä: sopimukset, ilmoitukset, pakkaaminen ja muuttopäivä. Rastita tehdyt kohdat tai tulosta lista jääkaapin oveen.',
    heroImage: '/images/webp/hero/hero-11.jpg',
    storageKey: 'muistilista:koti',
    phases: [
      {
        id: '2-kk',
        title: 'Kaksi kuukautta ennen',
        icon: '/icons/tyoapu/ajankohta.png',
        items: [
          { text: 'Tarkista vuokrasopimuksen irtisanomisaika tai asuntokaupan hallintaoikeuden siirtymispäivä.' },
          { text: 'Päätä muuttopäivä. Kuun vaihde ja kesä ovat kysytyimpiä, joten varaa niihin aikaisin.' },
          { text: 'Valitse, muutatko itse vai teetkö muuton muuttopalvelulla. Laske hinta, niin vertailu on helppo.', link: { href: '/muuttolaskuri', label: 'Muuttolaskuri' } },
          { text: 'Karsi tavaraa: myy, lahjoita tai kierrätä. Vähemmän tavaraa tarkoittaa nopeampaa ja edullisempaa muuttoa.' },
        ],
      },
      {
        id: '1-kk',
        title: 'Kuukausi ennen',
        icon: '/icons/tyoapu/kerro-tarpeesi.png',
        items: [
          { text: 'Varaa muuttopalvelu tai muuttoapu ja vahvista päivä.', link: { href: '/muuttoapu', label: 'Muuttoapu' } },
          { text: 'Irtisano vanha vuokrasopimus. Vuokralaisen irtisanomisaika on yleensä yksi kalenterikuukausi.' },
          { text: 'Tee sähkösopimus uuteen osoitteeseen ja irtisano vanha.' },
          { text: 'Tilaa tai siirrä internetliittymä, jotta yhteys toimii heti muuton jälkeen.' },
          { text: 'Tee muuttoilmoitus Postille tai Digi- ja väestötietovirastolle. Sen voi tehdä aikaisintaan kuukautta ennen muuttoa.' },
        ],
      },
      {
        id: '2-vk',
        title: 'Kaksi viikkoa ennen',
        icon: '/icons/palvelut/muuttolaatikot.png',
        items: [
          { text: 'Tilaa muuttolaatikot. Nyrkkisääntö on noin yksi laatikko asuinneliötä kohti.', link: { href: '/muuttolaatikot', label: 'Muuttolaatikot' } },
          { text: 'Aloita pakkaaminen tavaroista, joita et tarvitse ennen muuttoa: kirjat, koristeet ja kausivaatteet.' },
          { text: 'Päivitä kotivakuutus uuteen osoitteeseen.' },
          { text: 'Ilmoita uusi osoite työnantajalle, pankille, lehtitilauksiin ja jäsenyyksiin.' },
          { text: 'Ilmoita muutosta taloyhtiön isännöitsijälle tai huoltoyhtiölle molemmissa taloissa.' },
        ],
      },
      {
        id: '1-vk',
        title: 'Viikko ennen',
        icon: '/icons/palvelut/pakkauspalvelu.png',
        items: [
          { text: 'Pakkaa loput tavarat ja merkitse laatikkoon huone ja sisältö.' },
          { text: 'Sovi muuttoauton pysäköinti ja tarvittaessa hissin varaus taloyhtiön kanssa.' },
          { text: 'Järjestä lapsille ja lemmikeille hoito muuttopäiväksi.' },
          { text: 'Varaa muuttosiivous tai siivoa itse. Vuokra-asunto luovutetaan siivottuna.', link: { href: '/palvelut', label: 'Muuttosiivous' } },
        ],
      },
      {
        id: 'edellinen-paiva',
        title: 'Muuttoa edeltävä päivä',
        icon: '/icons/palvelut/muuttosiivous.png',
        items: [
          { text: 'Sulata pakastin ja jääkaappi ja kuivaa ne.' },
          { text: 'Irrota kodinkoneet. Asenna pesukoneen kuljetuspultit, jos ne ovat tallessa.' },
          { text: 'Pakkaa oma laukku: avaimet, lääkkeet, tärkeät paperit, laturit ja vaihtovaatteet.' },
          { text: 'Pura sängyt ja hyllyt, jotka eivät mahdu ehjinä ovista.' },
        ],
      },
      {
        id: 'muuttopaiva',
        title: 'Muuttopäivä',
        icon: '/icons/palvelut/kuljetukset.png',
        items: [
          { text: 'Kirjaa vanhan asunnon sähkö- ja vesimittarien lukemat ylös.' },
          { text: 'Tarkista kaapit, varasto ja parveke ennen kuin auto lähtee.' },
          { text: 'Opasta muuttajia uudessa kodissa: mihin huoneeseen mitkin laatikot tulevat.' },
          { text: 'Luovuta vanhan asunnon avaimet sovitusti.' },
        ],
      },
      {
        id: 'jalkeen',
        title: 'Muuton jälkeen',
        icon: '/icons/tyoapu/valmis.png',
        items: [
          { text: 'Tee muuttoilmoitus viimeistään viikon kuluttua muutosta, jos et tehnyt sitä etukäteen.' },
          { text: 'Testaa palovaroittimet ja kirjaa uuden asunnon mittarilukemat.' },
          { text: 'Lisää nimesi oveen ja postiluukkuun.' },
          { text: 'Ilmoita vuokra-asunnon mahdollisista vioista vuokranantajalle kirjallisesti.' },
          { text: 'Palauta vuokralaatikot noutoon tyhjinä.' },
        ],
      },
    ],
    tips: [
      {
        heading: 'Muuttoilmoitus oikeaan aikaan',
        icon: '/icons/tyoapu/tarjous.png',
        paragraphs: [
          'Muuttoilmoituksen voi tehdä aikaisintaan kuukautta ennen muuttoa ja viimeistään viikon kuluttua muutosta. Kun teet sen Postille tai Digi- ja väestötietovirastolle, tiedot välittyvät samalla monille viranomaisille, kuten Kelalle ja Verohallinnolle.',
        ],
      },
      {
        heading: 'Pakkaa huone kerrallaan',
        icon: '/icons/palvelut/pakkauspalvelu.png',
        paragraphs: [
          'Merkitse jokaiseen laatikkoon huone ja sisältö, niin muuttajat vievät laatikot suoraan oikeaan paikkaan. Raskaat tavarat, kuten kirjat ja astiat, kannattaa jakaa useampaan laatikkoon.',
        ],
      },
    ],
    faq: [
      {
        q: 'Milloin muuttoilmoitus pitää tehdä?',
        a: 'Aikaisintaan kuukautta ennen muuttoa ja viimeistään viikon kuluttua muutosta. Ilmoituksen voi tehdä verkossa Postille tai Digi- ja väestötietovirastolle.',
      },
      {
        q: 'Kuinka pitkä on vuokra-asunnon irtisanomisaika?',
        a: 'Toistaiseksi voimassa olevassa vuokrasopimuksessa vuokralaisen irtisanomisaika on yksi kalenterikuukausi. Se lasketaan sen kuukauden viimeisestä päivästä, jonka aikana irtisanot sopimuksen.',
      },
      {
        q: 'Milloin muuttofirma kannattaa varata?',
        a: 'Noin kuukautta ennen, ja kuun vaihteen tai kesän muuttoihin vielä aiemmin. Hinnan näet heti laskurista, joten voit vertailla päiviä ennen varausta.',
      },
      {
        q: 'Montako muuttolaatikkoa tarvitsen?',
        a: 'Nyrkkisääntönä noin yksi laatikko asuinneliötä kohti: yksiöön noin 25, kaksioon noin 50 ja kolmioon noin 75 laatikkoa.',
      },
      {
        q: 'Mitä otan omaan laukkuun muuttopäivänä?',
        a: 'Avaimet, lääkkeet, tärkeät paperit, laturit, hygieniatarvikkeet ja vaihtovaatteet. Ne pysyvät mukanasi, vaikka laatikot purettaisiin vasta seuraavana päivänä.',
      },
    ],
  },
  {
    slug: 'yritysmuuton-muistilista',
    path: '/yritysmuuton-muistilista',
    seoTitle: 'Yritysmuuton muistilista – toimistomuutto',
    seoDescription:
      'Yritysmuuton muistilista: aikataulu, IT-siirto, osoitteenmuutokset ja muuttopäivän tarkistukset. Tulostettava tarkistuslista toimistomuuttoon.',
    keywords: ['yritysmuuton muistilista', 'yritysmuutto muistilista', 'yrityksen muutto muistilista', 'toimistomuutto muistilista', 'toimistomuutto', 'muuton koordinointi'],
    h1: 'Yritysmuuton muistilista',
    eyebrow: 'Tulostettava tarkistuslista',
    lead: 'Toimistomuutto onnistuu, kun aikataulu, IT ja tiedottaminen on mietitty etukäteen. Käy lista läpi tiimin kanssa, rastita tehdyt kohdat tai tulosta lista projektipalaveriin.',
    heroImage: '/images/webp/hero/hero-7.jpg',
    storageKey: 'muistilista:yritys',
    phases: [
      {
        id: '3-6-kk',
        title: '3–6 kuukautta ennen',
        icon: '/icons/tyoapu/ajankohta.png',
        items: [
          { text: 'Nimeä muutolle vastuuhenkilö ja tee alustava aikataulu ja budjetti.' },
          { text: 'Tarkista nykyisen toimitilan irtisanomisaika ja luovutusehdot vuokrasopimuksesta.' },
          { text: 'Suunnittele uusien tilojen pohja: työpisteet, neuvottelutilat, varastot ja arkisto.' },
          { text: 'Tilaa tietoliikenneyhteydet uusiin tiloihin. Toimitus voi kestää viikkoja.' },
        ],
      },
      {
        id: '2-3-kk',
        title: '2–3 kuukautta ennen',
        icon: '/icons/tyoapu/kerro-tarpeesi.png',
        items: [
          { text: 'Pyydä muuttofirmalta kartoitus ja kiinteä tarjous.', link: { href: '/yrityksille', label: 'Yritysmuutot' } },
          { text: 'Suunnittele IT-siirto: palvelimet, verkkolaitteet, tulostimet ja puhelinliittymät.' },
          { text: 'Päätä, mitkä kalusteet muuttavat ja mitkä myydään, lahjoitetaan tai kierrätetään.' },
          { text: 'Sovi uusien tilojen avaimet, kulkuluvat ja hälytysjärjestelmä.' },
        ],
      },
      {
        id: '1-kk',
        title: 'Kuukausi ennen',
        icon: '/icons/tyoapu/tarjous.png',
        items: [
          { text: 'Tiedota muutosta henkilöstölle, asiakkaille ja yhteistyökumppaneille.' },
          { text: 'Päivitä uusi osoite YTJ:hen, Postiin, laskuihin, sopimuksiin ja verkkosivuille.' },
          { text: 'Päivitä Google-yritysprofiilin ja muiden hakemistojen osoite muuttopäivänä.' },
          { text: 'Tilaa painotuotteet, kuten käyntikortit ja kirjekuoret, uudella osoitteella.' },
        ],
      },
      {
        id: '2-vk',
        title: 'Kaksi viikkoa ennen',
        icon: '/icons/palvelut/muuttolaatikot.png',
        items: [
          { text: 'Tilaa muuttolaatikot ja jaa ne työpisteisiin.', link: { href: '/muuttolaatikot', label: 'Muuttolaatikot' } },
          { text: 'Anna henkilöstölle pakkausohjeet ja merkintätapa: työpiste, huone ja sisältö.' },
          { text: 'Numeroi kalusteet ja laitteet uuden pohjapiirroksen mukaan.' },
          { text: 'Pakkaa arkisto ja luottamukselliset asiakirjat suljettuihin, merkittyihin laatikoihin.' },
        ],
      },
      {
        id: '1-vk',
        title: 'Viikko ennen',
        icon: '/icons/palvelut/yritysmuutto.png',
        items: [
          { text: 'Varmista lastauspaikat, hissit ja pysäköinti kummassakin päässä.' },
          { text: 'Sovi muuttajille kulkuluvat ja yhteyshenkilö kumpaankin osoitteeseen.' },
          { text: 'Ota varmuuskopiot ja merkitse kaapelit ja laitteet työpisteittäin.' },
        ],
      },
      {
        id: 'muuttopaiva',
        title: 'Muuttopäivä',
        icon: '/icons/palvelut/kuljetukset.png',
        items: [
          { text: 'Yhteyshenkilö on paikalla ja ohjaa kalusteet ja laatikot oikeisiin tiloihin.' },
          { text: 'Kytke verkko ja palvelimet ensin, jotta työpisteet saadaan käyttöön nopeasti.' },
          { text: 'Tarkista vanhat tilat tyhjiksi ennen kuin muuttoauto lähtee.' },
        ],
      },
      {
        id: 'jalkeen',
        title: 'Muuton jälkeen',
        icon: '/icons/tyoapu/valmis.png',
        items: [
          { text: 'Testaa jokainen työpiste, tulostimet ja puhelinliittymät.' },
          { text: 'Siivoa ja luovuta vanhat tilat sekä avaimet sopimuksen mukaan.' },
          { text: 'Kerää henkilöstöltä palaute ja korjaa puutteet uusissa tiloissa.' },
        ],
      },
    ],
    tips: [
      {
        heading: 'Tietoliikenne ensimmäisenä',
        icon: '/icons/tyoapu/tyokalut.png',
        paragraphs: [
          'Uuden yhteyden toimitus voi kestää viikkoja, ja ilman verkkoa uudet tilat eivät ole käyttövalmiit. Tilaa yhteys heti, kun muuttopäivä on varmistunut, ja pyydä kytkentä valmiiksi ennen muuttoa.',
        ],
      },
      {
        heading: 'Muutto ilman käyttökatkoa',
        icon: '/icons/tyoapu/yrityksille.png',
        paragraphs: [
          'Kun muutto tehdään illalla tai viikonloppuna, työ jatkuu uusissa tiloissa seuraavana arkipäivänä. Numeroidut kalusteet ja työpisteittäin merkityt laatikot nopeuttavat purkamista.',
        ],
      },
    ],
    faq: [
      {
        q: 'Kuinka aikaisin yritysmuuttoa kannattaa alkaa suunnitella?',
        a: 'Pienelle toimistolle riittää usein 1–2 kuukautta, isommalle 3–6 kuukautta. Tietoliikenneyhteydet kannattaa tilata ensimmäisenä, koska niiden toimitus voi kestää viikkoja.',
      },
      {
        q: 'Voiko yritysmuuton tehdä iltaisin tai viikonloppuna?',
        a: 'Kyllä. Teemme yritysmuuttoja myös iltaisin ja viikonloppuisin, jotta työ ei keskeydy ja uudet tilat ovat käytössä seuraavana arkipäivänä.',
      },
      {
        q: 'Mihin yrityksen uusi osoite pitää ilmoittaa?',
        a: 'Yritys- ja yhteisötietojärjestelmään (YTJ), Postille, asiakkaille ja toimittajille, laskuihin ja sopimuksiin sekä verkkosivuille ja Google-yritysprofiiliin.',
      },
      {
        q: 'Kuka pakkaa työpisteet?',
        a: 'Työntekijät pakkaavat yleensä omat työpisteensä merkittyihin laatikoihin, ja muuttofirma hoitaa kalusteet, laitteet ja arkistot. Voimme hoitaa myös pakkaamisen.',
      },
      {
        q: 'Miten IT-laitteet siirretään turvallisesti?',
        a: 'Ota varmuuskopiot, merkitse kaapelit ja laitteet työpisteittäin ja sovi, kuka kytkee laitteet uusissa tiloissa. Kuljetamme laitteet suojattuina.',
      },
    ],
  },
];

export function getChecklistPage(slug: ChecklistPage['slug']): ChecklistPage {
  const page = CHECKLIST_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Tuntematon muistilista: ${slug}`);
  return page;
}

/**
 * Blogiartikkelit, jotka on korvattu koodin sivulla. next.config.mjs ohjaa ne pysyvästi (301) uuteen
 * osoitteeseen, ja sivukartta jättää ne pois. Testi varmistaa, että ohjaus on next.configissa.
 */
export const REPLACED_BLOG_POSTS: Record<string, string> = {
  'muuton-muistilista-2026': '/muuton-muistilista',
};
