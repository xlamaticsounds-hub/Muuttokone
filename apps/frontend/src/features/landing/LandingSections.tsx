// Laskeutumissivujen yhteiset osiot (kaupunkisivut /muuttopalvelu-<kaupunki> ja palvelusivut kuten /muuttoapu).
// Sama ilme kaikkialla: sininen hero vaihtuvilla työkuvilla ja maskotilla, luottamuspalkki, laskuri,
// palvelutasot, kuvakkeelliset tekstikortit, vaiheet ja yhteydenottobanneri.
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronRight, ClipboardList, MapPin, Phone } from 'lucide-react';
import ProcessSteps, { type ProcessStep } from '@/components/ProcessSteps';
import RotatingImages from '@/components/HeroArea/RotatingImages';
import SlideOnReveal from '@/components/SlideOnReveal';
import Calculator from '@/features/calculator/Calculator';
import { siteConfig } from '@/config/site';
import { CITY_PAGES } from '@/features/city-pages/cityData';
import RatingBadge from '@/components/RatingBadge';
import { getGoogleRating } from '@/server/review-requests';

export const container = 'mx-auto max-w-1390 px-4 md:px-8 xl:px-21';
export const card =
  'rounded-2xl border border-black/5 bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:ring-white/5';
export const iconBox = 'flex shrink-0 items-center justify-center rounded-2xl bg-primary/10';

// Kuvitukset: sama kuvakesarja ja maskotit kuin muualla sivustolla (public/icons, public/images/webp/muuttokone).
export const MASCOT = {
  wave: '/images/webp/muuttokone/webp/wave-v2.webp',
  keys: '/images/infografiikka/keys_upscaled.webp',
  slogan: '/images/hero/hero3-v2.png', // hampaat täytetty valkoisiksi (alkuperäisessä läpinäkyvät)
  box: '/images/webp/muuttokone/webp/boxguy.webp',
};

export type InfoSection = { heading: string; icon: string; paragraphs: string[] };
export type ServiceCard = { icon: string; title: string; text: string; href: string };

const features = [
  { icon: '/icons/tyoapu/hinta.png', title: 'Hinta heti', text: 'Kiinteä hinta laskurista ilman sitoumusta.' },
  { icon: '/icons/turva.webp', title: 'Vakuutetut kuljetukset', text: 'Vakuutus sisältyy aina hintaan.' },
  { icon: '/icons/yhteystiedot/aukiolo.png', title: 'Joka päivä 8–22', text: 'Palvelemme myös viikonloppuisin.' },
  { icon: '/icons/tyoapu/valmis.png', title: 'Maksu lopuksi', text: 'Maksat vasta, kun muutto on tehty.' },
];

// Palvelutasot samoilla nimillä ja sisällöillä kuin laskurissa (Calculator.tsx: getIncludedServices).
const packages = [
  {
    icon: '/icons/palvelut/kotimuutto.png',
    title: 'Täyspalvelu',
    badge: 'Suositeltu',
    text: 'Kannamme ja kuljetamme kaiken – sinun ei tarvitse nostaa mitään.',
    includes: ['Muuttajat ja muuttoauto', 'Herkkien tavaroiden suojaus', 'Muuttovakuutus'],
  },
  {
    icon: '/icons/palvelut/kuljetukset.png',
    title: 'Kuljettaja ja auto',
    text: 'Edullinen vaihtoehto, kun pääset itse auttamaan kantamisessa.',
    includes: ['Kuljettaja ja kuorma-auto', 'Autat itse kantamisessa', 'Muuttovakuutus'],
  },
  {
    icon: '/icons/tyoapu/kantoapu.png',
    title: 'Kantoapu',
    text: 'Lisäkädet, kun sinulla on oma tai vuokrattu auto.',
    includes: ['Kaksi kantajaa', 'Ei autoa', 'Muuttovakuutus'],
  },
];

const steps: ProcessStep[] = [
  {
    title: 'Laske hinta laskurilla',
    desc: 'Syötä osoitteet ja tavarat – näet kiinteän hinnan heti ilman sitoumusta.',
    icon: 'Calculator',
    highlight: true,
    href: '#laskuri',
  },
  { title: 'Varaa sopiva päivä', desc: 'Valitse päivä ja vahvista varaus. Saat vahvistuksen sähköpostiisi.', icon: 'CalendarCheck' },
  { title: 'Muuttopäivä', desc: 'Tulemme sovittuna aikana, suojaamme, kannamme ja kuljetamme tavarat uuteen kotiin.', icon: 'Truck' },
  { title: 'Maksu vasta lopuksi', desc: 'Maksat vasta, kun muutto on tehty sovitusti – ilman yllätyksiä laskulla.', icon: 'PartyPopper' },
];

/** Sininen hero: murupolku, H1, CTA:t ja vaihtuvat työkuvat, joiden takaa maskotti kurkistaa. */
export async function LandingHero({
  crumbs,
  eyebrow,
  title,
  lead,
  firstImage,
  eyebrowIcon = 'map',
  ctaLabel = 'Laske muuton hinta',
}: {
  crumbs: { name: string; href?: string }[];
  eyebrow: string;
  /** Pillerin kuvake: sijainti (kaupunki- ja palvelusivut) tai lista (muistilistat). */
  eyebrowIcon?: 'map' | 'list';
  /** Pääpainikkeen teksti (vie sivun laskuriin #laskuri). */
  ctaLabel?: string;
  title: string;
  lead: string;
  /** Ensimmäisenä näytettävä työkuva (heroImages.ts); sen jälkeen kuvat vaihtuvat kuten etusivulla. */
  firstImage?: string;
}) {
  const rating = await getGoogleRating();
  return (
    <section className="bg-primary relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10" />
      <div aria-hidden="true" className="bg-secondary/25 pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full blur-2xl" />
      <div className={`relative z-10 ${container}`}>
        <nav aria-label="Murupolku" className="mb-8 flex flex-wrap items-center gap-1 text-sm text-white/70">
          {crumbs.map((crumb, index) => (
            <span key={crumb.name} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white">{crumb.name}</Link>
              ) : (
                <span aria-current="page" className="text-white">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              {eyebrowIcon === 'list' ? <ClipboardList className="h-4 w-4" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />} {eyebrow}
            </p>
            <h1 className="mb-5 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mb-8 max-w-2xl text-lg text-white/90">{lead}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#laskuri" className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-semibold text-black duration-300 ease-out">
                {ctaLabel}
              </a>
              <a
                href={`tel:${siteConfig.contact.phone.tel}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-7.5 py-3 font-medium text-white duration-300 ease-out hover:bg-white/10"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> {siteConfig.contact.phone.display}
              </a>
            </div>
            <div className="mt-6">
              <RatingBadge value={rating} />
            </div>
          </div>

          {/* Ei ilmestymisanimaatiota: H1 ja pääkuva näkyvät heti (LCP) */}
          <div className="relative mx-auto w-full max-w-sm pt-28 lg:max-w-md lg:pt-32">
            {/* Maskotti kurkistaa kortin takaa: alaosa jää kortin taakse (z-0 < kortin z-10) */}
            <Image
              src={MASCOT.wave}
              alt=""
              width={640}
              height={668}
              priority
              className="animate-mascot-peek pointer-events-none absolute top-0 right-2 z-0 w-44 object-contain drop-shadow-xl motion-reduce:animate-none lg:right-6 lg:w-48"
            />
            <div className="relative z-10 rotate-2 rounded-3xl bg-white p-3 shadow-2xl transition-transform duration-500 hover:rotate-0">
              <div className="relative aspect-[4/5] w-full">
                <RotatingImages first={firstImage} className="rounded-2xl" sizes="(min-width: 1024px) 448px, 90vw" />
              </div>
            </div>
            <div className="absolute -bottom-8 -left-4 z-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-10 dark:bg-slate-900">
              <Image src="/icons/tyoapu/hinta.png" alt="" width={96} height={96} className="h-11 w-11 object-contain" />
              <div>
                <p className="font-semibold text-black/90 dark:text-white">Hinta heti laskurista</p>
                <p className="text-xs text-black/60 dark:text-white/60">ilman sitoumusta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Luottamuspalkki heron päällä (ei animaatiota: näkyy heti). */
export function TrustBar() {
  return (
    <section className="relative z-20 -mt-12">
      <div className={container}>
        <div className="grid gap-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-4 lg:p-8 dark:bg-slate-900 dark:ring-white/10">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className={`${iconBox} h-16 w-16`}>
                <Image src={feature.icon} alt="" width={112} height={112} className="h-11 w-11 object-contain" />
              </div>
              <div>
                <p className="font-semibold text-black/90 dark:text-white">{feature.title}</p>
                <p className="text-sm text-black/60 dark:text-white/60">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Upotettu muuttolaskuri (#laskuri, heron ja bannerien painikkeet vievät tänne). */
export function CalculatorSection({
  title,
  text,
  initialService,
  initialCleaning,
}: {
  title: string;
  text: string;
  /** Laskurin aloituspalvelu (oletus Muutto) ja muuttosiivous valmiiksi valittuna. */
  initialService?: 'moving' | 'transport' | 'recycling';
  initialCleaning?: boolean;
}) {
  return (
    <section id="laskuri" className="scroll-mt-20 py-14 lg:py-20">
      <div className={container}>
        <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center">
          <Image src={MASCOT.box} alt="" width={240} height={240} className="mb-3 h-24 w-24 object-contain" />
          <h2 className="text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">{title}</h2>
          <p className="mt-3 text-black/70 dark:text-white/70">{text}</p>
        </div>
        <Suspense>
          <Calculator initialService={initialService} initialCleaning={initialCleaning} />
        </Suspense>
      </div>
    </section>
  );
}

/** Palvelutasot kortteina (täyspalvelu, kuljettaja ja auto, kantoapu). */
export function PackagesSection({ title = 'Valitse, kuinka paljon teet itse' }: { title?: string }) {
  return (
    <section className="bg-gray-1 dark:bg-blacksection py-14 lg:py-20">
      <div className={container}>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Palvelutasot</p>
          <h2 className="text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">{title}</h2>
          <p className="mt-3 text-black/70 dark:text-white/70">Paketin voi vaihtaa laskurissa, ja hinta päivittyy heti. ALV sisältyy aina hintaan.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg, index) => (
            <SlideOnReveal key={pkg.title} delay={0.08 * index}>
              <div className={`${card} relative h-full p-7 transition hover:-translate-y-1 hover:shadow-lg ${pkg.badge ? 'ring-primary/40 ring-2' : ''}`}>
                {pkg.badge && (
                  <span className="bg-primary absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold text-white shadow">{pkg.badge}</span>
                )}
                <div className={`${iconBox} mb-5 h-20 w-20`}>
                  <Image src={pkg.icon} alt="" width={140} height={140} className="h-14 w-14 object-contain" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-black/90 dark:text-white">{pkg.title}</h3>
                <p className="mb-4 text-sm text-black/70 dark:text-white/70">{pkg.text}</p>
                <ul className="space-y-2">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium text-black/80 dark:text-white/80">
                      <Check className="text-primary h-4 w-4 shrink-0" aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SlideOnReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Kuvakkeelliset tekstikortit (sivun oma sisältö). */
export function InfoCards({ eyebrow, title, sections }: { eyebrow: string; title: string; sections: InfoSection[] }) {
  return (
    <section className="py-14 lg:py-20">
      <div className={container}>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">{eyebrow}</p>
          <h2 className="text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">{title}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section, index) => (
            <SlideOnReveal key={section.heading} delay={0.06 * (index % 2)}>
              <article className={`${card} group h-full p-7 transition hover:shadow-lg md:p-8`}>
                <div className="mb-4 flex items-center gap-4">
                  <div className={`${iconBox} h-16 w-16 transition-transform duration-300 group-hover:scale-105`}>
                    <Image src={section.icon} alt="" width={112} height={112} className="h-11 w-11 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-black/90 sm:text-2xl dark:text-white">{section.heading}</h3>
                </div>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mb-3 text-black/70 last:mb-0 dark:text-white/70">
                    {paragraph}
                  </p>
                ))}
              </article>
            </SlideOnReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "Näin muutto etenee" -vaiheet (sama komponentti kuin yrityksille- ja muuttolaatikkosivuilla). */
export function MovingSteps() {
  return (
    <div className="bg-gray-1 dark:bg-blacksection">
      <ProcessSteps
        eyebrow="Muutto selkokielellä"
        title="Näin muutto etenee"
        subtitle="Tiedät hinnan ja seuraavan askeleen aina etukäteen – ei piilokuluja eikä yllätyksiä."
        steps={steps}
      />
    </div>
  );
}

/** Palvelukortit linkkeineen. */
export function ServiceCards({ title, services }: { title: string; services: ServiceCard[] }) {
  return (
    <section className="pb-14 lg:pb-20">
      <div className={container}>
        <h2 className="mb-8 text-3xl font-bold text-black/90 sm:text-4xl dark:text-white">{title}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <SlideOnReveal key={service.href} delay={0.05 * index}>
              <Link href={service.href} className={`${card} group block h-full p-6 transition hover:-translate-y-1 hover:shadow-lg`}>
                <div className={`${iconBox} mb-4 h-16 w-16 transition-transform duration-300 group-hover:scale-105`}>
                  <Image src={service.icon} alt="" width={112} height={112} className="h-11 w-11 object-contain" />
                </div>
                <h3 className="group-hover:text-primary mb-2 flex items-center gap-1 font-semibold text-black/90 dark:text-white">
                  {service.title} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </h3>
                <p className="text-sm text-black/70 dark:text-white/70">{service.text}</p>
              </Link>
            </SlideOnReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Sininen yhteydenottobanneri "Me hoidamme homman" -maskotilla. */
export function ContactBanner({ title }: { title: string }) {
  return (
    <section className="pb-14 lg:pb-20">
      <div className={container}>
        <div className="bg-primary relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl px-7 py-10 text-center md:flex-row md:px-12 md:text-left">
          <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
          <Image src={MASCOT.slogan} alt="Me hoidamme homman!" width={477} height={523} className="relative h-36 w-auto object-contain drop-shadow-xl" />
          <div className="relative flex-1">
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
            <p className="text-white/90">Soita tai laske hinta – autamme valitsemaan sopivan paketin ja päivän.</p>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <a href={`tel:${siteConfig.contact.phone.tel}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black">
              <Phone className="h-4 w-4" aria-hidden="true" /> Soita
            </a>
            <a href="#laskuri" className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 font-medium text-white hover:bg-white/10">
              Laske hinta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Linkit kaupunkisivuille (pois lukien nykyinen). */
export function CityLinks({ title = 'Muut palvelualueet', exclude }: { title?: string; exclude?: string }) {
  const cities = CITY_PAGES.filter((c) => c.slug !== exclude);
  return (
    <section className="py-12 lg:py-16">
      <div className={`${container} text-center`}>
        <h2 className="mb-5 text-xl font-bold text-black/90 dark:text-white">{title}</h2>
        <ul className="flex flex-wrap justify-center gap-3">
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={city.path}
                className="hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-black/80 shadow-sm transition dark:border-gray-700 dark:bg-slate-900 dark:text-white"
              >
                <MapPin className="text-primary h-4 w-4" aria-hidden="true" /> {city.h1}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
