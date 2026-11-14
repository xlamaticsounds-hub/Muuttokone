import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import ProcessSteps from '@/components/ProcessSteps';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import BusinessQuoteForm from '@/features/business/BusinessQuoteForm';
import businessProcessSteps from '@/features/business/businessProcessSteps';
import businessFaqData from '@/features/business/businessFaqData';
import { cases } from '@/features/references/referenceData';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.business,
  openGraph: {
    title: SEOConfigs.business.title,
    description: SEOConfigs.business.description,
    type: 'website',
  },
});

const trustPoints = [
  {
    icon: '/icons/tyoapu/ajankohta.png',
    title: 'Ei keskeytä työpäivää',
    desc: 'Muutto voidaan toteuttaa iltaisin tai viikonloppuisin, tarvittaessa vaiheittain osastoittain.',
  },
  {
    icon: '/icons/palvelut/kuljetukset.png',
    title: 'Vakuutettu kuljetus',
    desc: 'Kaikki kuljetukset on vakuutettu lakisääteisen tiekuljetusvastuun mukaisesti.',
  },
  {
    icon: '/icons/yhteystiedot/y-tunnus.png',
    title: 'Yksi yhteyshenkilö',
    desc: 'Sovitte kaikesta yhden yhteyshenkilön kanssa alusta loppuun asti.',
  },
];

const businessServices = [
  {
    icon: '/icons/tyoapu/it-apu.png',
    title: 'IT-laitteet',
    desc: 'Työasemat, näytöt ja verkkolaitteet puretaan, kuljetetaan ja asennetaan merkitysti takaisin paikoilleen.',
  },
  {
    icon: '/icons/tyoapu/kantoapu.png',
    title: 'Kalusteet',
    desc: 'Työpisteet, kaapistot, neuvotteluhuoneiden kalusteet ja vastaanottotilat siirretään suojattuina.',
  },
  {
    icon: '/icons/palvelut/pakkauspalvelu.png',
    title: 'Arkistot ja asiakirjat',
    desc: 'Arkistolaatikot ja asiakirjat kuljetetaan suljetuissa laatikoissa, luottamuksellisesti.',
  },
  {
    icon: '/icons/palvelut/muuttolaatikot.png',
    title: 'Varastointi',
    desc: 'Tarvittaessa järjestämme väliaikaisen varastoinnin tavaroille muuton yhteydessä.',
  },
  {
    icon: '/icons/palvelut/kuolinpesa.png',
    title: 'Kierrätys',
    desc: 'Käytöstä poistuvat kalusteet ja laitteet kierrätetään tai toimitetaan hyötykäyttöön.',
  },
];

// Esimerkkejä muista kuin muuttotöistä — näyttää että kalustoa ja käsipareja voi tilata
// mihin tahansa yrityksen tavaransiirtotarpeeseen, myös toistuvasti.
const customServices = [
  {
    icon: '/icons/yrityksille/terassi.png',
    title: 'Terassikalusteiden kausisiirrot',
    desc: 'Keväällä kalusteet, varjot ja lämmittimet varastosta terassille ja paikoilleen aseteltuna, syksyllä takaisin talvisäilytykseen.',
    who: 'Ravintolat, kahvilat ja hotellit',
  },
  {
    icon: '/icons/palvelut/kuljetukset.png',
    title: 'Tavaroiden poisvienti',
    desc: 'Vanhat kalusteet, laitteet ja varastoon kertynyt tavara kannetaan ulos ja viedään kierrätykseen tai jäteasemalle.',
    who: 'Toimistot, liikkeet ja varastot',
  },
  {
    icon: '/icons/tyoapu/ajankohta.png',
    title: 'Tapahtumat ja messut',
    desc: 'Messuosastot, pöydät, tuolit ja tekniikka paikalle ennen tapahtumaa ja takaisin sen jälkeen — myös iltaisin ja viikonloppuisin.',
    who: 'Tapahtumajärjestäjät ja näytteilleasettajat',
  },
  {
    icon: '/icons/yrityksille/kauppa.png',
    title: 'Myymälän kausivaihdot',
    desc: 'Joulu- ja kampanjasomisteet, esittelytelineet ja kausituotteet varastosta myymälään ja takaisin sesongin mukaan.',
    who: 'Kaupat ja liikeketjut',
  },
  {
    icon: '/icons/palvelut/yritysmuutto.png',
    title: 'Sisäiset kalustesiirrot',
    desc: 'Työpisteiden uudelleenjärjestely, kerrosten väliset siirrot ja neuvotteluhuoneiden muutokset ilman koko toimiston muuttoa.',
    who: 'Toimistot ja julkiset tilat',
  },
  {
    icon: '/icons/palvelut/pakkauspalvelu.png',
    title: 'Noudot ja toimitukset',
    desc: 'Hankitut kalusteet noudetaan liikkeestä, huutokaupasta tai toiselta toimipisteeltä ja kannetaan perille paikoilleen.',
    who: 'Yritykset, jotka kalustavat tai laajentavat',
  },
  {
    icon: '/icons/tyoapu/yrityksille.png',
    title: 'Kiinteistöjen tyhjennykset',
    desc: 'Kellari- ja ullakkovarastojen, liiketilojen ja asuntojen tyhjennykset ennen remonttia tai uutta vuokralaista.',
    who: 'Isännöitsijät ja kiinteistöyhtiöt',
  },
  {
    icon: '/icons/yhteystiedot/aukiolo.png',
    title: 'Säännölliset kuljetukset',
    desc: 'Sovittu toistuva ajo, esimerkiksi viikoittain varastosta toimipisteisiin — sama tuttu tiimi joka kerta.',
    who: 'Useamman toimipisteen yritykset',
  },
];

const businessCases = cases.filter((c) => c.badge === 'B2B');

export default function YrityksillePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary relative overflow-hidden py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            {/* Tiimikuva: puhelimella tekstin yläpuolella, isoilla näytöillä oikealla */}
            <div className="w-full lg:order-last lg:w-[46%] lg:shrink-0">
              <Image
                src="/images/tiimi/tiimi-ryhma.jpg"
                alt="Muuttokoneen tiimi: Domenic, Paavo ja Hugo"
                width={1800}
                height={1200}
                priority
                quality={90}
                sizes="(min-width: 1390px) 600px, (min-width: 1024px) 46vw, 100vw"
                className="h-auto w-full rounded-2xl shadow-2xl ring-1 ring-white/20"
              />
            </div>
            <div className="max-w-2xl lg:flex-1">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Yrityksille</p>
              <h1 className="mb-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Yritysmuutto, joka ei keskeytä työtänne
              </h1>
              <p className="mb-8 text-lg text-white/90">
                IT-laitteet, kalusteet ja arkistot siirtyvät aikataulun mukaan — tarvittaessa iltaisin ja
                viikonloppuisin. Yksi yhteyshenkilö hoitaa kaiken alusta loppuun.
              </p>
              <Link
                href="#tarjous"
                className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-medium text-black duration-300 ease-out"
              >
                Pyydä maksuton kartoitus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quote form */}
      <section id="tarjous" className="scroll-mt-20 bg-gray-1 py-16 lg:py-24 dark:bg-bg-color-dark">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-10 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Tarjouspyyntö</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">
              Pyydä maksuton kartoitus
            </h2>
            <p className="mt-2 text-black/70 dark:text-white/70">
              Täytä lomake, niin olemme yhteydessä sopiaksemme kartoituksesta ja tarjouksesta.
            </p>
          </div>
          <BusinessQuoteForm />
        </div>
      </section>

      {/* Trust row */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="relative rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-8 dark:border-white/10 dark:bg-white/5 dark:ring-white/5">
            <div className="grid gap-7.5 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Image src={point.icon} alt="" width={96} height={96} className="h-12 w-12 object-contain" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-black/90 dark:text-white">{point.title}</h3>
                    <p className="text-sm text-black/70 dark:text-white/70">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-12 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Muuttopalvelut yrityksille</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">
              Kaikki yritysmuuton osa-alueet yhdeltä toimijalta
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businessServices.map((service) => (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/90 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/30 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Image src={service.icon} alt="" width={112} height={112} className="h-14 w-14 object-contain" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-black/90 dark:text-white">{service.title}</h3>
                <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom services */}
      <section className="bg-gray-1 py-16 lg:py-24 dark:bg-bg-color-dark">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-12 max-w-2xl">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Räätälöidyt palvelut</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">
              Räätälöidyt palvelut yrityksesi käyttöön
            </h2>
            <p className="mt-3 text-black/70 dark:text-white/70">
              Emme hoida vain muuttoja. Kun tavaraa pitää siirtää, kantaa tai viedä pois, suunnittelemme toteutuksen
              teidän tarpeidenne ja aikataulunne mukaan — kertaluonteisesti tai toistuvasti. Tässä muutama esimerkki:
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {customServices.map((service) => (
              <div
                key={service.title}
                className="flex flex-col rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Image src={service.icon} alt="" width={96} height={96} className="h-12 w-12 object-contain" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-black/90 dark:text-white">{service.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-black/70 dark:text-white/70">{service.desc}</p>
                <p className="mt-auto text-xs font-semibold text-primary">{service.who}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-black/70 dark:text-white/70">
            Eikö tarpeenne löydy listalta?{' '}
            <Link href="#tarjous" className="font-semibold text-primary hover:underline">
              Kertokaa siitä lomakkeella
            </Link>
            , niin räätälöimme ratkaisun ja tarjouksen juuri teille. Katso myös{' '}
            <Link href="/tyoapu" className="font-semibold text-primary hover:underline">
              työapu ja asennukset
            </Link>
            {' '}— esimerkiksi IT-laitteiden asennukset, kaivuutyöt ja kantoapu.
          </p>
        </div>
      </section>

      {/* Process */}
      <ProcessSteps
        eyebrow="Yritysmuutto selkokielellä"
        title="Näin etenemme"
        subtitle="Selkeä prosessi kartoituksesta käyttöönottoon — tiedätte aina seuraavan askeleen."
        steps={businessProcessSteps}
      />

      {/* References */}
      {businessCases.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
            <div className="mb-10 max-w-2xl">
              <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Referenssit</p>
              <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">
                Näin olemme auttaneet yrityksiä
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {businessCases.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5"
                >
                  <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {item.badge}
                  </div>
                  <h3 className="text-xl font-semibold text-black/90 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-black/70 dark:text-white/70">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm text-black/60 dark:text-white/60">
              Lisää esimerkkejä toteutetuista projekteista löydät{' '}
              <Link href="/referenssit" className="font-semibold text-primary hover:underline">
                referenssit-sivulta
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      <Faq
        title="Usein kysytyt kysymykset yritysmuutoista"
        subtitle="Vastauksia yleisimpiin kysymyksiin toimisto- ja yritysmuutoista."
        items={businessFaqData}
      />

      <Cta
        title="Suunnitteletteko yritysmuuttoa?"
        description="Saatte meiltä maksuttoman kartoituksen ja tarjouksen — sovitaan aikataulu, joka ei keskeytä liiketoimintaanne."
        href="#tarjous"
        label="Pyydä tarjous"
      />
    </>
  );
}
