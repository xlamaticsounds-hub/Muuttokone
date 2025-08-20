"use client";

import SlideOnReveal from "@/components/SlideOnReveal";
import Link from "next/link";
import { useSiteConfig } from "@/app/context/SiteConfigContext";
import { useEffect, useMemo, useState } from "react";

export default function HeroContent() {
  const siteConfig = useSiteConfig();
  // Typing effect state
  const texts = useMemo(
    () => [
      "kotimuutossa",
      "yritysmuutossa", 
      "pakkauksessa ja purussa",
      "varastoinnissa",
      "muuttosiivouksessa",
      "pianon siirroissa",
      "toimistomuutossa"
    ],
    []
  );
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  const TYPE_SPEED = 60; // ms per character
  const DELETE_SPEED = 40; // ms per character
  const TARGET_CYCLE_MS = 5000; // total cycle per phrase
  // Type -> pause -> delete -> next
  useEffect(() => {
    const full = texts[textIndex] ?? "";

    if (phase === "typing") {
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
      const t = setTimeout(() => setPhase("deleting"), pause);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
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
        setPhase("typing");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [displayText, phase, textIndex, texts]);

  return (
    <>
      <SlideOnReveal delay={0.3}>
        <div className="flex lg:items-center">
          <div className="animate_left max-w-[720px] md:max-w-none lg:pr-8 xl:pr-12">
            <h1 className="mb-4 text-3xl font-semibold leading-tight text-black/90 drop-shadow-sm dark:text-white sm:text-4xl lg:text-5xl">
              Luotettava apusi
              <span className="block mt-2 text-primary">
                {displayText}
                <span className="caret" aria-hidden="true" />
              </span>
            </h1>
            <p className="text-base text-black/70 dark:text-white/80 sm:text-lg">
              Nopea, turvallinen ja läpinäkyvä muutto koko Suomessa. Vakuutettu ja kokenut muuttopalvelu yksityis- ja yritysasiakkaille. Ei piilokuluja, vain rehellinen hinnoittelu.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-5 sm:flex-row">
              <Link
                href="/tarjouspyynto"
                className="inline-flex w-fit rounded-full bg-primary px-6 py-3 text-base font-medium leading-7 text-white duration-300 ease-in-out hover:shadow-1"
              >
                Pyydä tarjous
              </Link>

              <span className="flex flex-col">
                <a
                  href={`tel:${siteConfig.contact.phone.tel}`}
                  className="inline-block text-lg font-medium text-black/90 hover:text-primary dark:text-white"
                >
                  {` Soita meille ${siteConfig.contact.phone.display} `}
                </a>
                <span className="inline-block text-black/60 dark:text-white/70">
                  Maksuton kartoitus ja neuvonta
                </span>
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
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
