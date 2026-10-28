'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Kuvien luontevat kuvasuhteet vaihtelevat (3:4 ja 9:16 sekaisin), joten kierrossa
// käytetään kiinteää laatikkoa (aspect-[3/4]) + object-cover, jotta koko ei hyppää
// kuvien välillä. hero.webp säilytetään kansiossa mutta ei ole enää mukana kierrossa.
const heroImages = [
  '/images/webp/hero/hero-2.jpg',
  '/images/webp/hero/hero-3.jpg',
  '/images/webp/hero/hero-4.jpg',
  '/images/webp/hero/hero-5.jpg',
  '/images/webp/hero/hero-6.jpg',
  '/images/webp/hero/hero-7.jpg',
  '/images/webp/hero/hero-8.jpg',
  '/images/webp/hero/hero-9.jpg',
  '/images/webp/hero/hero-10.jpg',
  '/images/webp/hero/hero-11.jpg',
];

const SLIDE_DURATION_MS = 5000;

type Slide = { current: number; previous: number | null };

const Graphics = () => {
  const [slide, setSlide] = useState<Slide>({ current: 0, previous: null });
  // Muut kuvat liitetään sivulle vasta kun ensimmäinen on latautunut (tai epäonnistunut).
  // Muuten kaikki yhdeksän kuvaa latautuvat samaan aikaan ja vievät kaistaa ensimmäiseltä,
  // joka on sivun tärkein kuva — hitaalla yhteydellä kortti pysyy tyhjänä pidempään.
  const [loadRest, setLoadRest] = useState(false);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const failed = useRef<boolean[]>(heroImages.map(() => false));
  // Kuvien näyttöjärjestys indekseinä heroImages-listaan.
  const order = useRef<number[]>(heroImages.map((_, i) => i));

  useEffect(() => {
    // Järjestys arvotaan joka sivulatauksella. Ensimmäinen kuva pysyy samana, koska palvelin
    // renderöi sen valmiiksi ja se ladataan ensimmäisenä; arvonta tehdään vasta selaimessa,
    // ettei palvelimen ja selaimen HTML eroa.
    const rest = heroImages.map((_, i) => i).slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    order.current = [0, ...rest];
  }, []);

  useEffect(() => {
    // Ensimmäinen kuva voi olla jo latautunut ennen hydrointia, jolloin onLoad ei laukea uudelleen.
    const first = imageRefs.current[0];
    if (first?.complete) setLoadRest(true);
  }, []);

  useEffect(() => {
    // Vuoroon tulee vain kuva, joka on jo ladattu. Hitaalla yhteydellä tai jos kuva ei lataudu,
    // se ohitetaan, ettei kortin tilalle jää tyhjää valkoista ruutua.
    const isReady = (i: number) => {
      const img = imageRefs.current[i];
      return !failed.current[i] && !!img && img.complete && img.naturalWidth > 0;
    };
    const id = setInterval(() => {
      setSlide((s) => {
        const seq = order.current;
        const position = seq.indexOf(s.current);
        for (let step = 1; step < seq.length; step++) {
          const candidate = seq[(position + step) % seq.length];
          if (isReady(candidate)) return { current: candidate, previous: s.current };
        }
        return s;
      });
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="relative mx-auto aspect-[3/4] w-[78%] max-w-[420px] min-w-[260px] md:mx-0 md:w-full">
        {/* Ristihäivytys: uusi kuva häivytetään esiin edellisen päälle, ja edellinen pysyy
            täysin näkyvissä alla koko häivytyksen ajan. Jos molemmat häivytettäisiin yhtä aikaa,
            tausta paistaisi välissä läpi ja kortti välähtäisi vaaleana.
            Pyöristetty kulma + kevyt varjo tekee kuvasta "kortin" eikä läiskän — ei mask/vinjettiä. */}
        <div className="relative z-10 h-full w-full overflow-hidden rounded-2xl shadow-xl">
          {heroImages.map((src, i) =>
            i > 0 && !loadRest ? null : (
              <Image
                key={src}
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                src={src}
                alt="Muuttokone tositoimissa"
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? 'high' : undefined}
                aria-hidden={i !== slide.current}
                onLoad={i === 0 ? () => setLoadRest(true) : undefined}
                onError={() => {
                  failed.current[i] = true;
                  if (i === 0) setLoadRest(true);
                }}
                sizes="(max-width: 768px) 78vw, (max-width: 1024px) 420px, 480px"
                className={`object-cover ${
                  i === slide.current
                    ? 'z-20 opacity-100 transition-opacity duration-1000 ease-in-out'
                    : i === slide.previous
                      ? 'z-10 opacity-100'
                      : 'z-0 opacity-0'
                }`}
              />
            ),
          )}
        </div>
      </div>
    </>
  );
};

export default Graphics;
