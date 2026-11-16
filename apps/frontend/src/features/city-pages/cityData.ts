// Muuttopalvelun kaupunkisivut (/muuttopalvelu-<kaupunki>). Jokaisella sivulla on omaa paikallista
// sisältöä (alueen erityispiirteet, kaupunginosat, UKK), jotta sivut eivät ole kopioita toisistaan:
// Google ei nosta lähes samanlaisia kaupunkisivuja. Hintoja ei kirjoiteta tekstiin: sivulla on muuttolaskuri.
//
// UUDEN KAUPUNGIN LISÄÄMINEN: lisää olio CITY_PAGES-taulukkoon, tee reitti app/(site)/muuttopalvelu-<slug>
// (kuten muut, pelkkä cityPageMetadata + CityPageContent) ja kirjoita kaupungille omat tekstit.
// Sivukartta, footer ja linkitykset poimivat sen taulukosta.
import type { FaqItem } from '@/components/Faq/faqData';

export type CitySlug = 'helsinki' | 'espoo' | 'vantaa' | 'tampere' | 'turku' | 'pirkanmaa';

/** Kuvitus public/icons/-kansiosta (sama kuvakesarja kuin muualla sivustolla). */
export type CitySection = { heading: string; icon: string; paragraphs: string[] };

export type CityData = {
  slug: CitySlug;
  path: string;
  name: string;
  inessive: string; // missä: "Helsingissä"
  illative: string; // mihin: "Helsinkiin"
  elative: string; // mistä: "Helsingistä"
  seoTitle: string;
  /** Kuvaus hakutulokseen (120–170 merkkiä). */
  seoDescription: string;
  keywords: string[];
  h1: string;
  lead: string;
  /** Tukikohta, josta keikat ajetaan, näkyy herossa. */
  baseNote: string;
  /** Herossa ensimmäisenä näkyvä työkuva; sen jälkeen kuvat vaihtuvat kuten etusivulla (heroImages.ts). */
  heroImage: string;
  sections: CitySection[];
  districts: string[];
  nearby: { text: string; places: string[] };
  /** Muuttolaatikkosivu samassa kaupungissa, jos laatikoita toimitetaan sinne. */
  boxPath?: string;
  /** Kaupungin sisäiset muutot hinnoitellaan tarjouksella (kaukana tukikohdista, esim. Turku). */
  localByQuote?: boolean;
  /** Maakuntasivu (esim. Pirkanmaa): districts ovat kuntia ja schema käyttää AdministrativeArea-tyyppiä. */
  region?: boolean;
  faq: FaqItem[];
};

export const CITY_PAGES: CityData[] = [
  {
    slug: 'helsinki',
    path: '/muuttopalvelu-helsinki',
    name: 'Helsinki',
    inessive: 'Helsingissä',
    illative: 'Helsinkiin',
    elative: 'Helsingistä',
    seoTitle: 'Muuttopalvelu Helsinki – laske hinta heti',
    seoDescription:
      'Muuttopalvelu Helsingissä: kotimuutot, yritysmuutot ja kantoapu kiinteällä hinnalla. Laske muuton hinta heti laskurilla ja varaa sopiva päivä.',
    keywords: ['muuttopalvelu helsinki', 'muuttofirma helsinki', 'muutto helsinki', 'muuttoapu helsinki', 'muuttomiehet helsinki', 'muuttopalvelu hinta helsinki'],
    h1: 'Muuttopalvelu Helsingissä',
    lead: 'Muutamme koteja ja yrityksiä kaikkialla Helsingissä – Kalliosta Vuosaareen ja Lauttasaaresta Malmille. Näet muuton hinnan heti laskurista, ja hinta pysyy samana, kun tiedot pitävät paikkansa.',
    baseNote: 'Helsingin tukikohdasta koko pääkaupunkiseudulle',
    heroImage: '/images/webp/hero/hero-13.jpg',
    sections: [
      {
        heading: 'Kantakaupungin muutot ilman yllätyksiä',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Kantakaupungin vanhoissa kerrostaloissa hissi on usein pieni tai sitä ei ole lainkaan, ja rappukäytävät ovat kapeita. Kun kerrot laskurissa kerroksen ja hissin, ne näkyvät hinnassa heti eivätkä tule laskulle jälkikäteen.',
          'Kapeilla kaduilla muuttoauton paikka kannattaa miettiä etukäteen. Sovimme ennen muuttopäivää, mihin auto pysäköidään lastauksen ajaksi, ja tarvittaessa kysymme taloyhtiöltä luvan ajaa pihaan. Mitä lyhyempi kantomatka, sitä nopeampi ja edullisempi muutto.',
        ],
      },
      {
        heading: 'Täyspalvelu, kuljettaja ja auto tai pelkkä kantoapu',
        icon: '/icons/tyoapu/kantoapu.png',
        paragraphs: [
          'Täyspalvelussa paikalle tulevat muuttajat ja muuttoauto: kannamme, suojaamme herkät tavarat ja kuljetamme kaiken uuteen kotiin. Jos pääset itse kantamaan, kuljettaja ja auto on edullisempi vaihtoehto, ja jos sinulla on oma auto, pelkkä kantoapu riittää.',
          'Yrityksille muutamme toimistot ja liiketilat tarvittaessa iltaisin tai viikonloppuna, jotta työ ei keskeydy. Muuttolaatikot tuomme vuokralle kotiovelle ja haemme ne tyhjinä pois.',
        ],
      },
      {
        heading: 'Muutto Helsingistä muualle Suomeen',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Ajamme Helsingistä säännöllisesti Tampereelle, Turkuun ja muualle Suomeen. Sama tiimi lastaa, kuljettaa ja purkaa kuorman, joten tavarat eivät vaihda autoa matkalla. Pitkässä muutossa hinta on sama joka päivä, ja laskuri huomioi ajomatkan automaattisesti.',
        ],
      },
    ],
    districts: ['Kallio', 'Töölö', 'Kamppi', 'Punavuori', 'Kruununhaka', 'Lauttasaari', 'Munkkiniemi', 'Pasila', 'Vallila', 'Käpylä', 'Herttoniemi', 'Itäkeskus', 'Vuosaari', 'Malmi', 'Kannelmäki'],
    nearby: { text: 'Muutamme myös naapurikuntiin samalla hinnoittelulla:', places: ['Espoo', 'Vantaa', 'Kauniainen', 'Sipoo', 'Kerava'] },
    boxPath: '/muuttolaatikot/helsinki',
    faq: [
      {
        q: 'Paljonko muutto maksaa Helsingissä?',
        a: 'Muuton hinta Helsingissä riippuu tavaramäärästä, kerroksista ja hisseistä, ajomatkasta sekä muuttopäivästä. Laske oma hintasi tämän sivun muuttolaskurilla: näet kiinteän hinnan heti, ja se pysyy samana, kun tiedot pitävät paikkansa.',
      },
      {
        q: 'Mihin muuttoauto pysäköidään kantakaupungissa?',
        a: 'Sovimme pysäköinnin ennen muuttopäivää. Yleensä auto pysäköidään talon eteen tai pihaan lastauksen ajaksi. Jos kadulla ei ole tilaa, kysymme taloyhtiöltä luvan ajaa pihaan tai etsimme lähimmän paikan, josta kantomatka on lyhin.',
      },
      {
        q: 'Muutatteko myös Espooseen ja Vantaalle?',
        a: 'Kyllä. Pääkaupunkiseudun sisäiset muutot hinnoitellaan samalla tavalla kuin Helsingin sisäiset: hinta muodostuu tavaramäärästä, kerroksista ja osoitteiden välisestä ajomatkasta, eikä erillistä lisämaksua tule.',
      },
      {
        q: 'Muutatteko Helsingistä Tampereelle?',
        a: 'Kyllä. Ajamme Helsingistä Tampereelle ja takaisin säännöllisesti. Laskuri huomioi ajomatkan automaattisesti, ja pitkässä muutossa hinta on sama joka viikonpäivä.',
      },
      {
        q: 'Onko muutto vakuutettu?',
        a: 'Kyllä. Kuljetukset on vakuutettu tiekuljetuslain mukaisesti, ja suojaamme huonekalut ennen kantamista.',
      },
    ],
  },
  {
    slug: 'espoo',
    path: '/muuttopalvelu-espoo',
    name: 'Espoo',
    inessive: 'Espoossa',
    illative: 'Espooseen',
    elative: 'Espoosta',
    seoTitle: 'Muuttopalvelu Espoo – kodit ja yritykset',
    seoDescription:
      'Muuttopalvelu Espoossa: kerros-, rivi- ja omakotitalojen muutot sekä yritysmuutot kiinteällä hinnalla. Laske muuton hinta heti laskurilla.',
    keywords: ['muuttopalvelu espoo', 'muuttofirma espoo', 'muutto espoo', 'muuttoapu espoo', 'yritysmuutto espoo'],
    h1: 'Muuttopalvelu Espoossa',
    lead: 'Muutamme koteja ja yrityksiä koko Espoossa ja Kauniaisissa – Tapiolasta Espoonlahteen ja Leppävaarasta Kalajärvelle. Laskuri näyttää hinnan heti, myös rivi- ja omakotitalon muutolle.',
    baseNote: 'Helsingin tukikohdasta koko pääkaupunkiseudulle',
    heroImage: '/images/webp/hero/hero-6.jpg',
    sections: [
      {
        heading: 'Rivitalot ja omakotitalot',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Espoossa asutaan paljon rivi- ja omakotitaloissa, joissa tavaraa on enemmän kuin kerrostaloasunnossa: varastot, vaatehuoneet, autotallit ja pihakalusteet. Kirjaa ne laskuriin, niin miehitys ja auto mitoitetaan oikein eikä muutto veny.',
          'Pientaloalueilla auto pääsee yleensä aivan oven eteen, mikä nopeuttaa kantamista. Jos pihatie on kapea, jyrkkä tai talvella liukas, mainitse se lisätiedoissa, niin varaudumme siihen.',
        ],
      },
      {
        heading: 'Länsimetron varren uudet kerrostalot',
        icon: '/icons/palvelut/yritysmuutto.png',
        paragraphs: [
          'Matinkylän, Niittykummun, Finnoon ja Espoonlahden uusissa kerrostaloissa hissit ovat yleensä tilavia ja lastauspaikat lähellä, joten muutto sujuu ripeästi. Uudiskohteissa samaan taloon muuttaa kuitenkin moni samana viikkona, joten varaa aika ajoissa, jos muutat heti valmistumisen jälkeen.',
        ],
      },
      {
        heading: 'Opiskelija- ja pienet muutot',
        icon: '/icons/palvelut/muuttolaatikot.png',
        paragraphs: [
          'Otaniemen ja Leppävaaran opiskelija-asuntoihin muutetaan eniten loppukesällä ja alkusyksystä. Pieneen muuttoon riittää usein kuljettaja ja auto, kun pääset itse auttamaan kantamisessa, jolloin hinta pysyy pienenä.',
        ],
      },
      {
        heading: 'Muutto Espoosta Helsinkiin tai Kirkkonummelle',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Länsiväylä ja Kehä I ruuhkautuvat arkiaamuisin ja -iltapäivisin. Kun muutat Espoosta Helsinkiin tai toisinpäin, ruuhka-ajan ulkopuolelle osuva ajo lyhentää muuton kestoa. Laskuri laskee ajomatkan osoitteiden välillä, joten näet hinnan ennen kuin valitset päivän.',
          'Muutamme myös Kirkkonummelle ja Vihtiin. Ne ovat hieman kauempana tukikohdasta, mutta pääkaupunkiseudulta sinne muutettaessa erillistä lisämaksua ei yleensä tule.',
        ],
      },
    ],
    districts: ['Tapiola', 'Leppävaara', 'Matinkylä', 'Olari', 'Otaniemi', 'Niittykumpu', 'Finnoo', 'Espoon keskus', 'Espoonlahti', 'Soukka', 'Kauklahti', 'Kalajärvi', 'Kauniainen'],
    nearby: { text: 'Muutamme samalla hinnoittelulla myös:', places: ['Helsinki', 'Vantaa', 'Kauniainen', 'Kirkkonummi'] },
    boxPath: '/muuttolaatikot/espoo',
    faq: [
      {
        q: 'Paljonko muutto maksaa Espoossa?',
        a: 'Hinta riippuu siitä, paljonko tavaraa on, missä kerroksessa asut ja onko talossa hissi. Rivi- ja omakotitalossa tavaraa on yleensä enemmän kuin kerrostalossa, joten käy laskurissa läpi myös varasto ja autotalli. Näet hinnan heti tämän sivun laskurista.',
      },
      {
        q: 'Muutatteko varaston, autotallin ja pihakalusteet?',
        a: 'Kyllä. Lisää ne laskuriin muiden tavaroiden tapaan, niin ne sisältyvät hintaan. Raskaat esineet, kuten kuntolaitteet ja amerikkalaiset jääkaapit, kannattaa mainita erikseen, jotta paikalle tulee riittävä miehitys.',
      },
      {
        q: 'Muutatteko Espoosta Helsinkiin tai Vantaalle?',
        a: 'Kyllä. Pääkaupunkiseudun sisäiset muutot hinnoitellaan samalla tavalla kuin Espoon sisäiset: ajomatka lasketaan osoitteiden välillä, eikä erillistä lisämaksua tule.',
      },
      {
        q: 'Teettekö yritysmuuttoja Espoossa?',
        a: 'Kyllä. Muutamme toimistoja ja liiketiloja esimerkiksi Keilaniemessä, Tapiolassa ja Leppävaarassa, tarvittaessa iltaisin tai viikonloppuna. Pyydä maksuton kartoitus Yrityksille-sivulta.',
      },
      {
        q: 'Voinko vuokrata muuttolaatikot Espooseen?',
        a: 'Kyllä. Toimitamme vuokralaatikot kotiovelle koko Espooseen ja Kauniaisiin ja haemme ne tyhjinä muuton jälkeen.',
      },
    ],
  },
  {
    slug: 'vantaa',
    path: '/muuttopalvelu-vantaa',
    name: 'Vantaa',
    inessive: 'Vantaalla',
    illative: 'Vantaalle',
    elative: 'Vantaalta',
    seoTitle: 'Muuttopalvelu Vantaa – kiinteä hinta heti',
    seoDescription:
      'Muuttopalvelu Vantaalla: kotimuutot Tikkurilasta Kivistöön ja yritysmuutot Aviapoliksessa kiinteällä hinnalla. Laske hinta heti laskurilla.',
    keywords: ['muuttopalvelu vantaa', 'muuttofirma vantaa', 'muutto vantaa', 'muuttoapu vantaa', 'kotimuutto vantaa'],
    h1: 'Muuttopalvelu Vantaalla',
    lead: 'Hoidamme muutot koko Vantaalla – Tikkurilasta Myyrmäkeen ja Korsosta Kivistöön. Näet hinnan laskurista heti, ja sama hinnoittelu pätee, kun muutat Helsinkiin tai Espooseen.',
    baseNote: 'Helsingin tukikohdasta koko pääkaupunkiseudulle',
    heroImage: '/images/webp/hero/hero-10.jpg',
    sections: [
      {
        heading: 'Kerrostaloista pientaloalueille',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Vantaalla on sekä tiiviitä kerrostaloalueita, kuten Tikkurila ja Myyrmäki, että laajoja pientaloalueita Korsossa, Hakunilassa ja Koivukylässä. Muuton kesto riippuu paljon talotyypistä: kerrostalossa ratkaisevat hissi ja kerros, pientalossa tavaramäärä ja varastot.',
          'Kerro laskurissa molempien osoitteiden kerros ja hissi, niin hinta vastaa todellista työtä. Pientalossa kannattaa lisätä myös varaston ja pihan tavarat.',
        ],
      },
      {
        heading: 'Kivistö, Aviapolis ja uudet alueet',
        icon: '/icons/palvelut/yritysmuutto.png',
        paragraphs: [
          'Kivistön ja Aviapoliksen uusiin taloihin muuttaa paljon väkeä samaan aikaan. Varaa muuttopäivä hyvissä ajoin, erityisesti kuun vaihteessa, jolloin muuttoja on eniten.',
          'Aviapoliksen ja lentoaseman ympäristön toimistoille teemme yritysmuuttoja myös iltaisin ja viikonloppuisin, jotta työ jatkuu uusissa tiloissa heti seuraavana päivänä.',
        ],
      },
      {
        heading: 'Muutto Helsingistä Vantaalle',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Monelle muutto Helsingistä Vantaalle tarkoittaa isompaa kotia, esimerkiksi siirtymistä kerrostalokaksiosta rivitaloon. Tavaraa on silloin usein enemmän kuin edellisessä muutossa, joten käy laskurissa läpi myös varasto ja parveke, niin saat hinnan, joka pitää.',
          'Kehä III ja Tuusulanväylä ruuhkautuvat arkisin aamulla ja iltapäivällä. Laskuri laskee ajomatkan osoitteiden välillä, ja muutto sujuu nopeammin, kun ajo osuu ruuhka-ajan ulkopuolelle.',
        ],
      },
    ],
    districts: ['Tikkurila', 'Myyrmäki', 'Martinlaakso', 'Kivistö', 'Aviapolis', 'Korso', 'Koivukylä', 'Hakunila', 'Länsimäki', 'Pakkala', 'Hiekkaharju'],
    nearby: { text: 'Muutamme samalla hinnoittelulla myös:', places: ['Helsinki', 'Espoo', 'Kerava', 'Tuusula'] },
    boxPath: '/muuttolaatikot/vantaa',
    faq: [
      {
        q: 'Paljonko muutto maksaa Vantaalla?',
        a: 'Muuton hinta muodostuu tavaramäärästä, kerroksista, hisseistä, ajomatkasta ja muuttopäivästä. Syötä tiedot tämän sivun muuttolaskuriin, niin saat kiinteän hinnan sekunneissa ilman sitoumusta.',
      },
      {
        q: 'Mikä päivä on edullisin muuttaa?',
        a: 'Tiistait ja keskiviikot ovat edullisimpia, varsinkin kuun puolivälissä, koska silloin muuttoja on vähiten. Perjantait ja viikonloput ovat suosituimpia. Laskuri näyttää päiväkohtaisen hinnan, kun valitset päivämäärän.',
      },
      {
        q: 'Muutatteko Vantaalta Helsinkiin tai Espooseen?',
        a: 'Kyllä. Pääkaupunkiseudun sisäiset muutot hinnoitellaan samalla tavalla: ajomatka lasketaan osoitteiden välillä, eikä erillistä lisämaksua tule.',
      },
      {
        q: 'Teettekö yritysmuuttoja Aviapoliksessa?',
        a: 'Kyllä. Muutamme toimistoja ja varastoja Aviapoliksessa ja muualla Vantaalla, tarvittaessa työajan ulkopuolella. Pyydä maksuton kartoitus Yrityksille-sivulta.',
      },
      {
        q: 'Muutatteko Vantaalta Keravalle tai Tuusulaan?',
        a: 'Kyllä. Kerava ja Tuusula ovat lähellä Helsingin tukikohtaa, joten muutot Vantaalta niihin hinnoitellaan ilman erillistä ajolisää. Laskuri laskee hinnan osoitteiden välisen matkan mukaan.',
      },
      {
        q: 'Voinko vuokrata muuttolaatikot Vantaalle?',
        a: 'Kyllä. Toimitamme vuokralaatikot kotiovelle koko Vantaalle ja haemme ne tyhjinä muuton jälkeen.',
      },
    ],
  },
  {
    slug: 'tampere',
    path: '/muuttopalvelu-tampere',
    name: 'Tampere',
    inessive: 'Tampereella',
    illative: 'Tampereelle',
    elative: 'Tampereelta',
    seoTitle: 'Muuttopalvelu Tampere – oma tiimi Hervannassa',
    seoDescription:
      'Muuttopalvelu Tampereella: oma tiimi ja tukikohta Hervannassa. Kotimuutot ja yritysmuutot myös Pirkkalaan, Kangasalle ja Nokialle. Laske hinta heti.',
    keywords: ['muuttopalvelu tampere', 'muuttofirma tampere', 'muutto tampere', 'muuttoapu tampere', 'muuttopalvelu pirkanmaa', 'yritysmuutto tampere'],
    h1: 'Muuttopalvelu Tampereella',
    lead: 'Tampereen muutot hoitaa oma tamperelainen tiimimme, jonka tukikohta on Hervannassa. Siksi Tampereen ja lähikuntien muutot hinnoitellaan paikallisina, ja näet hinnan heti laskurista.',
    baseNote: 'Oma tiimi ja tukikohta Hervannassa',
    heroImage: '/images/webp/hero/hero-9.jpg',
    sections: [
      {
        heading: 'Oma tiimi ja tukikohta Hervannassa',
        icon: '/icons/tyoapu/suosituimmat.png',
        paragraphs: [
          'Lähdemme keikoille Hervannasta, joten ajomatka keskustaan, Kalevaan tai Lielahteen on lyhyt. Laskuri laskee Tampereen muutot Tampereen tukikohdasta, joten hinnassa ei ole tyhjää ajoa Helsingistä.',
          'Sama koskee lähikuntia: Pirkkalan, Kangasalan, Lempäälän, Nokian, Ylöjärven ja Valkeakosken muutot hinnoitellaan ilman tukikohtalisää.',
        ],
      },
      {
        heading: 'Pispalan rinteet ja keskustan kerrostalot',
        icon: '/icons/tyoapu/kantoapu.png',
        paragraphs: [
          'Pispalan harjulla moni talo on rinteessä, ja ovelle johtaa portaita tai kapea kuja. Kerro laskurin lisätiedoissa, jos auto ei pääse oven eteen, sillä kantomatka vaikuttaa muuton kestoon.',
          'Keskustan, Tammelan ja Amurin vanhoissa kerrostaloissa hissit ovat usein pieniä tai niitä ei ole. Merkitse kerros ja hissi laskuriin, niin ne sisältyvät hintaan valmiiksi.',
        ],
      },
      {
        heading: 'Opiskelijamuutot Hervannassa ja Kalevassa',
        icon: '/icons/palvelut/muuttolaatikot.png',
        paragraphs: [
          'Hervannan ja Kalevan opiskelija-asunnoissa muutetaan eniten loppukesällä ja vuodenvaihteessa. Jos sinulla on oma auto tai kaverin pakettiauto, pelkkä kantoapu riittää, ja hinta pysyy opiskelijabudjetissa.',
        ],
      },
      {
        heading: 'Yritysmuutot Tampereella ja Pirkanmaalla',
        icon: '/icons/tyoapu/yrityksille.png',
        paragraphs: [
          'Muutamme toimistoja, liiketiloja ja varastoja Tampereella ja koko Pirkanmaalla, tarvittaessa iltaisin tai viikonloppuna, jotta työ ei keskeydy. Kartoitamme muuton etukäteen ja annamme kiinteän hinnan, joten budjetti pitää.',
        ],
      },
      {
        heading: 'Muutto Tampereelta Helsinkiin ja Turkuun',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Ajamme Tampereen ja Helsingin väliä säännöllisesti molempiin suuntiin, ja muutamme myös Turkuun ja muualle Suomeen. Pitkässä muutossa hinta on sama joka viikonpäivä.',
        ],
      },
    ],
    districts: ['Keskusta', 'Hervanta', 'Kaleva', 'Pispala', 'Tammela', 'Amuri', 'Hatanpää', 'Härmälä', 'Vuores', 'Lielahti', 'Tesoma', 'Linnainmaa'],
    nearby: { text: 'Lähikunnat ilman tukikohtalisää:', places: ['Pirkkala', 'Kangasala', 'Lempäälä', 'Nokia', 'Ylöjärvi', 'Valkeakoski'] },
    boxPath: '/muuttolaatikot/tampere',
    faq: [
      {
        q: 'Paljonko muutto maksaa Tampereella?',
        a: 'Tampereen muutot lasketaan Hervannan tukikohdasta, joten hinnassa ei ole tyhjää ajoa Helsingistä. Muuten hinta riippuu tavaramäärästä, kerroksista, hisseistä ja muuttopäivästä. Laske oma hintasi tämän sivun laskurilla.',
      },
      {
        q: 'Onko teillä oma tiimi Tampereella?',
        a: 'Kyllä. Tampereen muutot hoitaa oma tamperelainen tiimimme, jonka tukikohta on Hervannassa.',
      },
      {
        q: 'Tuleeko lähikuntiin lisämaksua?',
        a: 'Ei. Pirkkalan, Kangasalan, Lempäälän, Nokian, Ylöjärven ja Valkeakosken muutot hinnoitellaan paikallisina. Kauempana Pirkanmaalla, esimerkiksi Orivedellä, laskuri lisää hintaan ajolisän, ja näet sen hinnassa erikseen.',
      },
      {
        q: 'Muutatteko Tampereelta Helsinkiin?',
        a: 'Kyllä. Muutamme Tampereelta Helsinkiin ja muualle pääkaupunkiseudulle säännöllisesti. Laskuri huomioi ajomatkan, ja pitkässä muutossa hinta on sama joka viikonpäivä.',
      },
      {
        q: 'Teettekö yritysmuuttoja Tampereella?',
        a: 'Kyllä. Muutamme toimistoja ja liiketiloja esimerkiksi keskustassa, Hervannassa ja Hatanpäällä sekä lähikunnissa, tarvittaessa työajan ulkopuolella. Pyydä maksuton kartoitus Yrityksille-sivulta.',
      },
      {
        q: 'Voinko vuokrata muuttolaatikot Tampereella?',
        a: 'Kyllä. Toimitamme vuokralaatikot kotiovelle Tampereella ja lähikunnissa ja haemme ne tyhjinä muuton jälkeen.',
      },
    ],
  },
  {
    slug: 'turku',
    path: '/muuttopalvelu-turku',
    name: 'Turku',
    inessive: 'Turussa',
    illative: 'Turkuun',
    elative: 'Turusta',
    seoTitle: 'Muuttopalvelu Turku – muutot Turkuun ja Turusta',
    seoDescription:
      'Muuttopalvelu Turkuun ja Turusta: kaukomuutot Helsingistä ja Tampereelta kiinteällä hinnalla, laske hinta heti. Turun sisäiset muutot tarjouksella.',
    keywords: ['muuttopalvelu turku', 'muuttofirma turku', 'muutto turku', 'muutto helsingistä turkuun', 'muutto tampereelta turkuun'],
    h1: 'Muuttopalvelu Turussa',
    lead: 'Muutamme koteja Turkuun ja Turusta, erityisesti Helsingin ja Tampereen suunnalta. Kaukomuuton hinnan näet heti laskurista, ja Turun sisäiset muutot hinnoittelemme tarjouksella.',
    baseNote: 'Kaukomuutot Helsingistä ja Tampereelta',
    heroImage: '/images/webp/hero/hero-11.jpg',
    localByQuote: true,
    sections: [
      {
        heading: 'Muutto Helsingistä tai Tampereelta Turkuun',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Turku on noin 165 kilometrin päässä sekä Helsingistä että Tampereelta. Kaukomuutossa sama tiimi ja auto hoitavat koko muuton: lastaus, kuljetus ja purku samana päivänä, eivätkä tavarat vaihda autoa matkalla.',
          'Pitkässä muutossa hinta on sama joka viikonpäivä. Laskuri huomioi ajomatkan, kerrokset ja tavaramäärän, joten näet koko hinnan ennen varausta.',
        ],
      },
      {
        heading: 'Näin kaukomuutto Turkuun etenee',
        icon: '/icons/tyoapu/kerro-tarpeesi.png',
        paragraphs: [
          'Laske ensin hinta laskurilla ja valitse muuttopäivä. Ennen muuttoa varmistamme kanssasi osoitteet, kulkureitit, pysäköinnin ja mahdolliset raskaat esineet.',
          'Muuttopäivänä lastaamme kuorman lähtöosoitteessa, ajamme suoraan Turkuun ja kannamme tavarat uuteen kotiin samana päivänä. Huonekalut suojataan ennen kantamista, ja kuljetus on vakuutettu.',
        ],
      },
      {
        heading: 'Turun sisäiset muutot tarjouksella',
        icon: '/icons/tyoapu/tarjous.png',
        paragraphs: [
          'Tukikohtamme ovat Helsingissä ja Tampereella, joten Turun sisäiseen muuttoon tulee ajomatka tukikohdasta. Siksi laskemme ne tarjouksella: täytä muuton tiedot laskuriin, niin lähetämme tarkan hinnan sähköpostiisi.',
        ],
      },
      {
        heading: 'Puutaloalueet ja opiskelija-asunnot',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Turun vanhoilla puutaloalueilla, kuten Port Arthurissa ja Martissa, pihat ovat usein ahtaita ja portaat jyrkkiä. Kerro kantomatkasta lisätiedoissa, niin varaamme muuttoon oikean miehityksen.',
          'Opiskelijamuutot keskittyvät yliopistojen lähelle ja Ylioppilaskylään. Kun muutat Turkuun opiskelemaan toiselta paikkakunnalta, pieneen muuttoon riittää usein kuljettaja ja auto.',
        ],
      },
    ],
    districts: ['Keskusta', 'Port Arthur', 'Martti', 'Nummi', 'Ylioppilaskylä', 'Kupittaa', 'Skanssi', 'Runosmäki', 'Varissuo', 'Hirvensalo'],
    nearby: { text: 'Muutamme myös Turun naapurikuntiin:', places: ['Kaarina', 'Raisio', 'Naantali', 'Lieto'] },
    faq: [
      {
        q: 'Paljonko muutto Helsingistä Turkuun maksaa?',
        a: 'Hinta riippuu tavaramäärästä, kerroksista ja hisseistä. Helsingistä Turkuun on noin 165 km, ja laskuri huomioi ajomatkan automaattisesti. Pitkässä muutossa hinta on sama joka viikonpäivä, joten laske hinta tämän sivun laskurilla ja valitse sopiva päivä.',
      },
      {
        q: 'Paljonko muutto Tampereelta Turkuun maksaa?',
        a: 'Tampereelta Turkuun on noin 160 km. Syötä lähtö- ja kohdeosoite sekä tavarat laskuriin, niin näet kiinteän hinnan heti. Isomman kodin muutossa kannattaa käydä varastot ja parveke tarkasti läpi.',
      },
      {
        q: 'Miksi Turun sisäinen muutto hinnoitellaan tarjouksella?',
        a: 'Tukikohtamme ovat Helsingissä ja Tampereella, joten Turun sisäiseen muuttoon tulee ajomatka tukikohdasta. Lasketaan hinta tapauskohtaisesti, jotta saat siitä tarkan ja reilun tarjouksen.',
      },
      {
        q: 'Kuinka nopeasti saan tarjouksen?',
        a: 'Vastaamme tarjouspyyntöihin yleensä vuorokauden sisällä. Täytä muuton tiedot muuttolaskuriin tai soita meille.',
      },
      {
        q: 'Muutatteko Kaarinaan, Raisioon tai Naantaliin?',
        a: 'Kyllä. Kaukomuutot Turun naapurikuntiin hinnoitellaan samoin kuin Turkuun: laskuri laskee hinnan osoitteiden välisen matkan mukaan, ja hinta on sama joka viikonpäivä.',
      },
      {
        q: 'Muutatteko Turusta muualle Suomeen?',
        a: 'Kyllä. Muutamme Turusta esimerkiksi Helsinkiin, Tampereelle ja muualle Suomeen. Kaukomuuton hinnan näet heti laskurista.',
      },
    ],
  },
  {
    slug: 'pirkanmaa',
    path: '/muuttopalvelu-pirkanmaa',
    name: 'Pirkanmaa',
    inessive: 'Pirkanmaalla',
    illative: 'Pirkanmaalle',
    elative: 'Pirkanmaalta',
    region: true,
    seoTitle: 'Muuttopalvelu Pirkanmaa – Nokia ja Kangasala',
    seoDescription:
      'Muuttopalvelu koko Pirkanmaalla: Nokia, Ylöjärvi, Kangasala, Pirkkala, Lempäälä ja Valkeakoski. Oma tiimi Hervannassa, paikalliset hinnat laskurista.',
    keywords: ['muuttopalvelu pirkanmaa', 'muutto pirkanmaa', 'muuttofirma pirkanmaa', 'muuttopalvelu nokia', 'muutto nokia', 'muuttopalvelu kangasala', 'muuttopalvelu ylöjärvi', 'yritysmuutto pirkanmaa'],
    h1: 'Muuttopalvelu Pirkanmaalla',
    lead: 'Tampereen tiimimme palvelee koko Pirkanmaata – Nokialta Kangasalle ja Ylöjärveltä Valkeakoskelle. Tukikohta on Hervannassa, joten lähikuntien muutot hinnoitellaan paikallisina.',
    baseNote: 'Tampereen tiimi koko Pirkanmaalle',
    heroImage: '/images/webp/hero/hero-10.jpg',
    sections: [
      {
        heading: 'Nokia, Pirkkala ja Ylöjärvi',
        icon: '/icons/palvelut/kotimuutto.png',
        paragraphs: [
          'Nokia, Pirkkala ja Ylöjärvi ovat Hervannasta lyhyen ajomatkan päässä, joten niiden muutot hinnoitellaan samalla tavalla kuin Tampereen sisäiset.',
          'Moni muuttaa Tampereelta näihin kuntiin isomman kodin perässä. Käy laskurissa läpi myös rivi- tai omakotitalon varasto ja autotalli, niin hinta vastaa todellista tavaramäärää.',
        ],
      },
      {
        heading: 'Kangasala, Lempäälä ja Valkeakoski',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Kangasala ja Lempäälä ovat aivan Hervannan kupeessa, ja Valkeakoskellekin ajaa noin puolessa tunnissa. Näiden kuntien muutoissa ei ole tukikohtalisää.',
        ],
      },
      {
        heading: 'Omakotitalot ja maaseutu',
        icon: '/icons/palvelut/pakkauspalvelu.png',
        paragraphs: [
          'Pirkanmaalla asutaan paljon omakotitaloissa ja maaseudulla, joissa pihat ovat isoja ja tavaraa kertyy enemmän kuin kerrostalossa. Lisää laskuriin varastot, autotallit ja ulkovälineet, niin miehitys ja auto mitoitetaan oikein.',
          'Pihatiet voivat olla kapeita tai talvella liukkaita. Mainitse ne lisätiedoissa, niin varaudumme niihin jo ennen muuttopäivää.',
        ],
      },
      {
        heading: 'Kauempana Pirkanmaalla',
        icon: '/icons/tyoapu/hinta.png',
        paragraphs: [
          'Orivedelle, Sastamalaan ja Ikaalisiin on Hervannasta pidempi matka. Laskuri lisää hintaan tyhjän ajon tukikohdasta ja näyttää sen omana rivinään, joten tiedät koko hinnan ennen varausta.',
        ],
      },
      {
        heading: 'Yritysmuutot Pirkanmaalla',
        icon: '/icons/palvelut/yritysmuutto.png',
        paragraphs: [
          'Teemme toimisto-, liiketila- ja varastomuuttoja Pirkanmaan yritysalueilla, tarvittaessa iltaisin ja viikonloppuisin. Kartoitamme muuton ennen tarjousta, joten työpäivät eivät keskeydy.',
        ],
      },
      {
        heading: 'Muutto Pirkanmaalta pääkaupunkiseudulle',
        icon: '/icons/palvelut/kuljetukset.png',
        paragraphs: [
          'Muutamme myös Pirkanmaalta Helsinkiin, Espooseen ja Vantaalle sekä muualle Suomeen. Pitkässä muutossa hinta on sama joka viikonpäivä, ja laskuri huomioi ajomatkan automaattisesti.',
        ],
      },
    ],
    districts: ['Nokia', 'Ylöjärvi', 'Pirkkala', 'Kangasala', 'Lempäälä', 'Valkeakoski', 'Akaa', 'Vesilahti', 'Orivesi', 'Hämeenkyrö', 'Sastamala', 'Ikaalinen'],
    nearby: { text: 'Muutamme myös Pirkanmaalta muualle, esimerkiksi:', places: ['Tampere', 'Helsinki', 'Turku'] },
    boxPath: '/muuttolaatikot/tampere',
    faq: [
      {
        q: 'Paljonko muutto maksaa Pirkanmaalla?',
        a: 'Tampereen lähikunnissa hinta lasketaan Hervannan tukikohdasta ilman tyhjän ajon lisää. Hinta riippuu tavaramäärästä, kerroksista, hisseistä ja päivästä – laske se tämän sivun laskurilla.',
      },
      {
        q: 'Muutatteko Nokialle ja Ylöjärvelle?',
        a: 'Kyllä. Nokia ja Ylöjärvi kuuluvat Tampereen tiimin lähialueeseen, ja niiden muutot hinnoitellaan paikallisina.',
      },
      {
        q: 'Tuleeko Orivedelle tai Sastamalaan lisämaksua?',
        a: 'Kauempana Pirkanmaalla laskuri lisää hintaan tyhjän ajon tukikohdasta. Lisä näkyy laskurissa omana rivinään ennen varausta.',
      },
      {
        q: 'Kuka muutot Pirkanmaalla tekee?',
        a: 'Tampereen oma tiimimme, joka lähtee keikoille Hervannasta. Siksi Pirkanmaan muutot eivät ole kaukomuuttoja Helsingistä.',
      },
      {
        q: 'Voinko vuokrata muuttolaatikot Pirkanmaalle?',
        a: 'Kyllä. Toimitamme vuokralaatikot Tampereelle ja lähikuntiin, kuten Nokialle, Ylöjärvelle, Pirkkalaan, Kangasalle, Lempäälään ja Valkeakoskelle.',
      },
      {
        q: 'Teettekö yritysmuuttoja Nokialla ja Lempäälässä?',
        a: 'Kyllä. Muutamme toimistoja ja varastoja koko Pirkanmaalla. Pyydä maksuton kartoitus Yrityksille-sivulta.',
      },
    ],
  },
];

export function getCityPage(slug: CitySlug): CityData {
  const city = CITY_PAGES.find((c) => c.slug === slug);
  if (!city) throw new Error(`Tuntematon kaupunkisivu: ${slug}`);
  return city;
}
