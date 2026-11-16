'use client';

import Image from 'next/image';
import Link from 'next/link';
import SlideOnReveal from '@/components/SlideOnReveal';
import { CITY_LINKS } from '@/features/city-pages/cityLinks';
import RatingBadge from '@/components/RatingBadge';
import type { GoogleRating } from '@/lib/google-rating';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useT } from '@/i18n/useT';
import { heroDictionary } from '@/i18n/homeDictionary';

export default function HeroContent({ content, rating }: { content?: any; rating?: GoogleRating }) {
  const siteConfig = useSiteConfig();
  const { locale } = useLocale();
  const t = useT(heroDictionary);
  // Typing effect state
  const baseTexts = content?.typingTexts || [
    'kotimuutossa',
    'yritysmuutossa',
    'pakkauspalveluissa',
    'varastoinnissa',
    'muuttosiivouksessa',
    'erikoiskuljetuksissa',
  ];
  const texts = useMemo(
    () => (locale === 'en' ? baseTexts.map((w: string) => t(w)) : baseTexts),
    [content, locale],
  );
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'deleting'>('typing');

  const TYPE_SPEED = 60; // ms per character
  const DELETE_SPEED = 40; // ms per character
  const TARGET_CYCLE_MS = 5000; // total cycle per phrase
  // Type -> pause -> delete -> next
  useEffect(() => {
    const full = texts[textIndex] ?? '';

    if (phase === 'typing') {
      if (displayText.length < full.length) {
        const t = setTimeout(() => {
          setDisplayText(full.slice(0, displayText.length + 1));
        }, TYPE_SPEED);
        return () => clearTimeout(t);
      }
      // Finished typing: pause long enough so total cycle ≈ TARGET_CYCLE_MS
      const typingTime = full.length * TYPE_SPEED;
      const deletingTime = full.length * DELETE_SPEED;
      const pause = Math.max(0, TARGET_CYCLE_MS - typingTime - deletingTime);
      const t = setTimeout(() => setPhase('deleting'), pause);
      return () => clearTimeout(t);
    }

    if (phase === 'deleting') {
      if (displayText.length > 0) {
        const t = setTimeout(() => {
          setDisplayText(full.slice(0, displayText.length - 1));
        }, DELETE_SPEED);
        return () => clearTimeout(t);
      }
      // Move to next phrase
      const t = setTimeout(() => {
        setTextIndex((i) => {
          if (texts.length <= 1) return i;
          let next = i;
          // pick a different random index to avoid immediate repeats
          while (next === i) {
            next = Math.floor(Math.random() * texts.length);
          }
          return next;
        });
        setPhase('typing');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [displayText, phase, textIndex, texts]);

  return (
    <>
      <SlideOnReveal delay={0.3}>
        <div className="flex lg:items-center">
          <div className="animate_left max-w-[720px] md:max-w-none lg:pr-8 xl:pr-12">
            <h1 className="text-title-xl sm:text-title-xxl lg:text-title-xxl mb-4 leading-tight font-bold sm:font-semibold text-black/90 drop-shadow-sm dark:text-white">
              {/* Hakusana H1:n alkuun (Google painottaa H1:tä); iso iskulause pysyy ennallaan */}
              <span className="text-primary mb-3 block text-sm font-semibold tracking-wide uppercase sm:text-base">
                {t('Muuttopalvelu pääkaupunkiseudulla ja Tampereella')}
              </span>
              {content?.title || t('Luotettava apusi')}
              <span className="text-primary mt-2 block">
                {displayText}
                <span className="caret" aria-hidden="true" />
              </span>
            </h1>
            <p className="text-regular text-black/70 sm:text-lg dark:text-white/80">
              {content?.description || t('Nopea, turvallinen ja läpinäkyvä muutto pääkaupunkiseudulla ja Tampereella. Ammattitaitoiset ja tehokkaat muuttopalvelut yksityis- ja yritysasiakkaille. Ei piilokuluja, vain rehellinen hinnoittelu.')}
            </p>

            <div className="mt-8 flex flex-col-reverse gap-5 sm:flex-row">
              {/* Laskuri on heti herosta seuraava osio, joten painike vierittää sinne eikä avaa uutta sivua. */}
              <a
                href="#muuttolaskuri"
                className="bg-primary text-regular hover:shadow-1 inline-flex w-fit rounded-full px-7.5 py-3 leading-7 font-medium text-white transition-all duration-300 hover:bg-primary/90 hover:shadow-lg ease-in-out"
              >
                {t('Laske hinta')}
              </a>
              {/*Below the button insert VASTAUS TULEE AUTOMAATTISESTI*/}

              <span className="flex flex-col">
                <a
                  href={`tel:${siteConfig.contact.phone.tel}`}
                  className="hover:text-primary inline-block text-lg font-medium text-black/90 transition-colors duration-300 dark:text-white"
                >
                  {locale === 'en' ? ` Call us ${siteConfig.contact.phone.display} ` : ` Soita meille ${siteConfig.contact.phone.display} `}
                </a>
                <span className="inline-block text-black/60 dark:text-white/70">
                  {t('Maksuton kartoitus ja neuvonta')}
                </span>
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-black/70 dark:text-white/70">
              {['Kiinteä hinta heti', 'Vakuutettu ja rekisteröity', 'Nopea vastaus'].map((point) => (
                <span key={point} className="flex items-center gap-2">
                  <Image src="/icons/tyoapu/valmis.png" alt="" width={48} height={48} className="h-6 w-6 object-contain" />
                  {t(point)}
                </span>
              ))}
            </div>

            {rating && (
              <div className="mt-5">
                <RatingBadge value={rating} tone="dark" />
              </div>
            )}

            {/* Linkit kaupunkisivuille: etusivu on sivuston vahvin sivu, ja linkit kertovat Googlelle,
                että kaupunkihauissa (esim. "muuttopalvelu tampere") oikea sivu on kaupunkisivu. */}
            <p className="mt-4 flex flex-wrap items-center text-sm text-black/60 dark:text-white/60">
              <span className="mr-2 font-medium">{t('Palvelualueet:')}</span>
              {CITY_LINKS.map((city, index) => (
                <span key={city.path}>
                  <Link href={city.path} className="text-primary font-semibold hover:underline">
                    {city.name}
                  </Link>
                  {index < CITY_LINKS.length - 1 && (
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>
        </div>
      </SlideOnReveal>
      <style jsx>{`
        .caret {
          display: inline-block;
          width: 2px;
          height: 1em;
          margin-left: 2px;
          background-color: currentColor;
          animation: blink 1s steps(2, start) infinite;
          vertical-align: -2px;
        }
        @keyframes blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
