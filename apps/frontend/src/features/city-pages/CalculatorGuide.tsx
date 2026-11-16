import Link from 'next/link';
import Faq from '@/components/Faq';
import type { FaqItem } from '@/components/Faq/faqData';
import StructuredData from '@/components/SEO/StructuredData';
import { CITY_PAGES } from './cityData';

const container = 'mx-auto max-w-1390 px-4 md:px-8 xl:px-21';
const card = 'rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5';

const factors = [
  { title: 'Tavaramäärä', text: 'Laskuri arvioi kantamisen ja lastauksen keston huonekalujen ja laatikoiden mukaan. Mitä tarkemmin lisäät tavarat, sitä tarkempi hinta.' },
  { title: 'Kerrokset ja hissi', text: 'Portaissa kantaminen vie enemmän aikaa kuin hissillä, joten molempien osoitteiden kerros ja hissi vaikuttavat hintaan.' },
  { title: 'Ajomatka', text: 'Osoitteiden välinen matka lasketaan automaattisesti. Pitkässä muutossa hinta on sama joka viikonpäivä.' },
  { title: 'Muuttopäivä', text: 'Tiistait ja keskiviikot ovat edullisimpia, varsinkin kuun puolivälissä. Laskuri näyttää päiväkohtaisen hinnan, kun valitset päivämäärän.' },
  { title: 'Palvelutaso', text: 'Täyspalvelu, kuljettaja ja auto tai pelkkä kantoapu. Valitse, kuinka paljon teet itse.' },
  { title: 'Lisäpalvelut', text: 'Muuttosiivous, muuttolaatikot ja kodinkoneiden irrotus kiinteillä hinnoilla, ilman yllätyksiä laskulla.' },
];

const faq: FaqItem[] = [
  {
    q: 'Kuinka tarkka muuttolaskurin hinta on?',
    a: 'Laskuri laskee hinnan samoilla perusteilla kuin me: tavaramäärä, kerrokset, hissit, ajomatka ja muuttopäivä. Kun tiedot pitävät paikkansa, hinta pysyy samana, vaikka muutto kestäisi arvioitua pidempään.',
  },
  {
    q: 'Sitooko laskurin hinta minua?',
    a: 'Ei. Hinnan laskeminen on maksutonta eikä sido sinua mihinkään. Muutto varataan vasta, kun vahvistat varauksen.',
  },
  {
    q: 'Mitä muuton hintaan sisältyy?',
    a: 'Täyspalvelussa hintaan sisältyvät muuttajat, muuttoauto, kantaminen, herkkien tavaroiden suojaus, kuljetus ja muuttovakuutus. Hinnat sisältävät ALV:n.',
  },
  {
    q: 'Miten saan muutosta mahdollisimman edullisen?',
    a: 'Valitse tiistai tai keskiviikko kuun puolivälistä, pakkaa tavarat valmiiksi laatikoihin ja valitse paketti, jossa teet itse sen, mihin pystyt. Esimerkiksi kuljettaja ja auto on edullisempi kuin täyspalvelu, kun pääset itse kantamaan.',
  },
  {
    q: 'Voinko laskea muuton hinnan toiselle paikkakunnalle?',
    a: 'Kyllä. Laskuri huomioi ajomatkan automaattisesti, ja pitkässä muutossa hinta on sama joka viikonpäivä. Hyvin pitkissä muutoissa lähetämme tarkan tarjouksen sähköpostiisi.',
  },
  {
    q: 'Mikä on tukikohtalisä?',
    a: 'Tukikohtamme ovat Helsingissä ja Tampereella. Jos muutto on kaukana molemmista, auto ajaa tyhjänä tukikohdasta keikalle ja takaisin. Laskuri lisää silloin hintaan ajolisän ja näyttää sen erikseen. Pääkaupunkiseudun ja Tampereen seudun muutoissa lisää ei tule.',
  },
];

// Muuttolaskurin ohjeosio (vain suomenkielinen /muuttolaskuri): selittää hinnan muodostumisen ja
// linkittää kaupunkisivuille. Hintoja ei kirjoiteta tekstiin, vaan ne näkyvät laskurista.
export default function CalculatorGuide() {
  return (
    <>
      <StructuredData type="FAQPage" data={{ faqs: faq }} />

      <section className="pb-12 lg:pb-16">
        <div className={container}>
          <h2 className="mb-3 text-2xl font-bold text-black/90 sm:text-3xl dark:text-white">Näin muuttolaskuri laskee muuton hinnan</h2>
          <p className="mb-8 max-w-3xl text-black/70 dark:text-white/70">
            Muuton hinta muodostuu työajasta ja ajomatkasta. Laskuri arvioi työajan tavaroidesi ja kulkureittien perusteella, joten et maksa
            arvauksesta etkä yllätyksistä.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map((factor) => (
              <div key={factor.title} className={`${card} p-6`}>
                <h3 className="mb-2 font-semibold text-black/90 dark:text-white">{factor.title}</h3>
                <p className="text-sm text-black/70 dark:text-white/70">{factor.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className={container}>
          <h2 className="mb-4 text-2xl font-bold text-black/90 sm:text-3xl dark:text-white">Muuttopalvelu kaupungeittain</h2>
          <ul className="flex flex-wrap gap-3">
            {CITY_PAGES.map((city) => (
              <li key={city.slug}>
                <Link
                  href={city.path}
                  className="inline-flex rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-black/80 hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white"
                >
                  {city.h1}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq title="Usein kysyttyä muuttolaskurista" subtitle="Vastauksia muuton hinnasta ja laskurin käytöstä." items={faq} />
    </>
  );
}
