'use client';

import SlideOnReveal from '@/components/SlideOnReveal';
import Link from 'next/link';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import { useEffect, useMemo, useState } from 'react';

export default function HeroContent({ content }: { content?: any }) {
  const siteConfig = useSiteConfig();
  // Typing effect state
  const texts = useMemo(
    () => content?.typingTexts || [
      'kotimuutossa',
      'yritysmuutossa',
      'pakkauspalveluissa',
      'varastoinnissa',
      'muuttosiivouksessa',
      'erikoiskuljetuksissa',
    ],
    [content],
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
            <h1 className="text-title-xl sm:text-title-xxl lg:text-title-xxl mb-4 leading-tight font-semibold text-black/90 drop-shadow-sm dark:text-white">
              {content?.title || "Luotettava apusi"}
              <span className="text-primary mt-2 block">
                {displayText}
                <span className="caret" aria-hidden="true" />
              </span>
            </h1>
            <p className="text-regular text-black/70 sm:text-lg dark:text-white/80">
              {content?.description || "Nopea, turvallinen ja läpinäkyvä muutto Helsingissä ja Uudellamaalla. Ammattitaitoiset ja tehokkaat muuttopalvelut yksityis- ja yritysasiakkaille. Ei piilokuluja, vain rehellinen hinnoittelu."}
            </p>

            <div className="mt-8 flex flex-col-reverse gap-5 sm:flex-row">
              <Link
                href="/muuttolaskuri"
                className="bg-primary text-regular hover:shadow-1 inline-flex w-fit rounded-full px-7.5 py-3 leading-7 font-medium text-white transition-all duration-300 hover:bg-primary/90 hover:shadow-lg ease-in-out"
              >
                Laske hinta
              </Link>
              {/*Below the button insert VASTAUS TULEE AUTOMAATTISESTI*/}

              <span className="flex flex-col">
                <a
                  href={`tel:${siteConfig.contact.phone.tel}`}
                  className="hover:text-primary inline-block text-lg font-medium text-black/90 transition-colors duration-300 dark:text-white"
                >
                  {` Soita meille ${siteConfig.contact.phone.display} `}
                </a>
                <span className="inline-block text-black/60 dark:text-white/70">
                  Maksuton kartoitus ja neuvonta
                </span>
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-black/70 dark:text-white/70">
              <span className="flex items-center gap-2">
                <span className="text-green-500">✅</span> Vakuutettu ja rekisteröity
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-500">✅</span> Nopea vastaus
              </span>
            </div>
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
