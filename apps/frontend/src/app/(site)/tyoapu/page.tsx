import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { generateSEOMetadata, SEOConfigs } from '@/components/SEO/SEOHelpers';
import ProcessSteps from '@/components/ProcessSteps';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import TyoapuQuoteForm from '@/features/tyoapu/TyoapuQuoteForm';
import { startingPrices, tyoapuCategories, tyoapuFaqData, tyoapuProcessSteps } from '@/features/tyoapu/tyoapuData';
import { cases } from '@/features/references/referenceData';

export const metadata: Metadata = generateSEOMetadata({
  ...SEOConfigs.tyoapu,
  openGraph: {
    title: SEOConfigs.tyoapu.title,
    description: SEOConfigs.tyoapu.description,
    type: 'website',
  },
});

// Kuvitukset: public/icons/tyoapu/ (512×512 PNG). Kategorian kuva = sen id, muuten työkalupakki.
const categoryIcon = (id: string) =>
  ['kodin-asennukset', 'it-apu', 'piha-ja-ulkotyot', 'kantoapu', 'yrityksille'].includes(id)
    ? `/icons/tyoapu/${id}.png`
    : '/icons/palvelut/tyoapu.png';

const trustPoints = [
  {
    icon: '/icons/tyoapu/hinta.png',
    title: 'Kiinteä hinta tai tuntiveloitus',
    desc: 'Sovitaan etukäteen kumpi sopii työhön — ei yllätyksiä laskussa.',
  },
  {
    icon: '/icons/tyoapu/kotitalousvahennys.png',
    title: 'Kotitalousvähennys',
    desc: 'Kotona tehdystä työstä voit yleensä saada kotitalousvähennyksen. Erittelemme työn osuuden laskulle.',
  },
  {
    icon: '/icons/tyoapu/tyokalut.png',
    title: 'Omat työkalut mukana',
    desc: 'Tulemme valmiina töihin, ja viemme pakkaukset ja jätteet mennessämme.',
  },
];

const tyoapuCases = cases.filter((c) => c.badge === 'Työapu');

export default function TyoapuPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary relative overflow-hidden py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Työapu</p>
            <h1 className="mb-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Lisäkädet asennuksiin ja arjen töihin
            </h1>
            <p className="mb-8 text-lg text-white/90">
              TV seinälle, pesukone paikalleen, tietokone toimimaan tai kuoppa porealtaalle — hoidamme työt kotona,
              mökillä ja yrityksessä. Kiinteällä hinnalla tai tuntiveloituksella.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#tarjous"
                className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-medium text-black duration-300 ease-out"
              >
                Pyydä tarjous
              </Link>
              <Link
                href="#palvelut"
                className="inline-flex rounded-full border border-white/60 px-7.5 py-3 font-medium text-white duration-300 ease-out hover:bg-white/10"
              >
                Katso mitä teemme
              </Link>
            </div>
          </div>
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

      {/* Category quick links */}
      <section id="palvelut" className="scroll-mt-20 pt-8 lg:pt-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-8 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Palvelut</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Mihin tarvitset apua?</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {tyoapuCategories.map((category) => (
              <Link
                key={category.id}
                href={`#${category.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-medium text-black/80 transition-colors hover:border-primary hover:text-primary dark:border-white/10 dark:bg-slate-900 dark:text-white/80"
              >
                <Image src={categoryIcon(category.id)} alt="" width={56} height={56} className="h-7 w-7 object-contain" />
                {category.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Starting prices */}
      <section className="pt-10 lg:pt-14">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-md sm:p-8 dark:from-primary/20 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4 lg:max-w-md">
                <div className="ring-primary/10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 dark:bg-slate-800">
                  <Image src="/icons/tyoapu/suosituimmat.png" alt="" width={112} height={112} className="h-14 w-14 object-contain" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black/90 dark:text-white">Suosituimmat asennukset</h2>
                </div>
              </div>
              <ul className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                {startingPrices.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10"
                  >
                    <p className="text-primary text-xl font-bold">{item.price}</p>
                    <p className="mt-1 text-sm font-semibold text-black/80 dark:text-white/80">{item.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {tyoapuCategories.map((category, index) => {
        return (
          <section
            key={category.id}
            id={category.id}
            className={`scroll-mt-20 py-12 lg:py-16 ${index % 2 === 1 ? 'bg-gray-1 dark:bg-bg-color-dark' : ''}`}
          >
            <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Image src={categoryIcon(category.id)} alt="" width={112} height={112} className="h-14 w-14 object-contain" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black/90 dark:text-white sm:text-3xl">{category.title}</h2>
                  <p className="mt-1 text-black/70 dark:text-white/70">{category.intro}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {category.items.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5"
                  >
                    <h3 className="mb-2 text-lg font-bold text-black/90 dark:text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">{item.desc}</p>
                    {item.price && (
                      <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.price}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-8">
        <div className="mx-auto max-w-1390 px-4 text-center md:px-8 xl:px-21">
          <p className="text-black/70 dark:text-white/70">
            Eikö työtäsi löydy listalta?{' '}
            <Link href="#tarjous" className="font-semibold text-primary hover:underline">
              Kysy silti
            </Link>{' '}
            — teemme paljon muutakin.
          </p>
        </div>
      </section>

      {/* Process */}
      <ProcessSteps
        eyebrow="Näin tilaat"
        title="Helppoa alusta loppuun"
        subtitle="Kerro mitä tarvitset, niin hoidamme loput."
        steps={tyoapuProcessSteps}
      />

      {/* References */}
      {tyoapuCases.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
            <div className="mb-10 max-w-2xl">
              <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Referenssit</p>
              <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Tehtyjä töitä</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {tyoapuCases.map((item) => (
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
              Lisää toteutettuja töitä löydät{' '}
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
        title="Usein kysyttyä työavusta"
        subtitle="Hinnoittelu, kotitalousvähennys ja mitä työhön kuuluu."
        items={tyoapuFaqData}
      />

      {/* Quote form */}
      <section id="tarjous" className="scroll-mt-20 bg-gray-1 py-16 lg:py-24 dark:bg-bg-color-dark">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="mb-10 text-center">
            <p className="text-primary mb-2 text-sm font-semibold uppercase tracking-wide">Tarjouspyyntö</p>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white sm:text-4xl">Pyydä tarjous</h2>
            <p className="mt-2 text-black/70 dark:text-white/70">
              Kerro mitä pitää tehdä. Voimme sopia kiinteän hinnan tai tuntiveloituksen.
            </p>
          </div>
          <TyoapuQuoteForm />
        </div>
      </section>

      <Cta
        title="Tarvitsetko lisäkäsiä?"
        description="Kerro työstä, niin saat tarjouksen — kiinteällä hinnalla tai tuntiveloituksella."
        href="#tarjous"
        label="Pyydä tarjous"
      />
    </>
  );
}
