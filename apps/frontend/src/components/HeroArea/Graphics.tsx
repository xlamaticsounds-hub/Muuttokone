'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Kuvien luontevat kuvasuhteet vaihtelevat (3:4 ja 9:16 sekaisin), joten kierrossa
// käytetään kiinteää laatikkoa (aspect-[3/4]) + object-cover, jotta koko ei hyppää
// kuvien välillä. hero.webp säilytetään kansiossa mutta ei ole enää mukana kierrossa.
const heroImages = [
  '/images/webp/hero/hero-1.jpg',
  '/images/webp/hero/hero-2.jpg',
  '/images/webp/hero/hero-3.jpg',
  '/images/webp/hero/hero-4.jpg',
  '/images/webp/hero/hero-5.jpg',
];

const SLIDE_DURATION_MS = 5000;

const Graphics = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % heroImages.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="relative mx-auto aspect-[3/4] w-[78%] max-w-[420px] min-w-[260px] md:mx-0 md:w-full">
        {/* Vaihtuvat kuvat ristihäivytyksellä: kaikki pinottuna samaan laatikkoon päällekkäin,
            vain aktiivisen opacity on 100 — CSS-transition hoitaa pehmeän häivytyksen.
            Pyöristetty kulma + kevyt varjo tekee kuvasta "kortin" eikä läiskän — ei mask/vinjettiä. */}
        <div className="relative z-10 h-full w-full overflow-hidden rounded-2xl shadow-xl">
          {heroImages.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt="Muuttokone tositoimissa"
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? 'high' : undefined}
              aria-hidden={i !== index}
              sizes="(max-width: 768px) 78vw, (max-width: 1024px) 420px, 480px"
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Graphics;
