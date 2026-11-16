'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from './heroImages';

const SLIDE_DURATION_MS = 5000;

type Slide = { current: number; previous: number | null };

/**
 * Vaihtuvat työkuvat ristihäivytyksellä (etusivun hero ja kaupunkisivut). Täyttää vanhempansa
 * (vanhemmalle annetaan koko, esim. aspect-[3/4]). `first` = ensimmäisenä näytettävä kuva, jonka
 * palvelin renderöi valmiiksi; muiden järjestys arvotaan selaimessa joka latauksella.
 */
export default function RotatingImages({
  images = HERO_IMAGES,
  first,
  alt = 'Muuttokone tositoimissa',
  sizes,
  className = '',
}: {
  images?: readonly string[];
  first?: string;
  alt?: string;
  sizes: string;
  className?: string;
}) {
  // Ensimmäinen kuva indeksiin 0, jotta palvelimen ja selaimen HTML on sama ja se ladataan ensin.
  const list = useMemo(() => (first && images.includes(first) ? [first, ...images.filter((src) => src !== first)] : [...images]), [images, first]);

  const [slide, setSlide] = useState<Slide>({ current: 0, previous: null });
  // Kuvat liitetään sivulle yksi kerrallaan: ensimmäinen heti, seuraava vasta kun edellinen on
  // latautunut ja näkyvissä (eli noin SLIDE_DURATION_MS ennen kuin sitä tarvitaan). Näin mobiilissa
  // ei ladata heti kymmentä kuvaa, joista kävijä näkee ehkä kaksi, eikä ensimmäinen (sivun tärkein
  // kuva) jaa kaistaa muiden kanssa. mounted = montako kuvaa näyttöjärjestyksen alusta on sivulla.
  const [mounted, setMounted] = useState(1);
  const mountNext = (count: number) => setMounted((m) => Math.min(list.length, Math.max(m, count)));
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const failed = useRef<boolean[]>(list.map(() => false));
  // Kuvien näyttöjärjestys indekseinä listaan.
  const order = useRef<number[]>(list.map((_, i) => i));

  useEffect(() => {
    // Järjestys arvotaan vasta selaimessa, ettei palvelimen ja selaimen HTML eroa.
    const rest = list.map((_, i) => i).slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    order.current = [0, ...rest];
  }, [list]);

  useEffect(() => {
    // Ensimmäinen kuva voi olla jo latautunut ennen hydrointia, jolloin onLoad ei laukea uudelleen.
    const firstImage = imageRefs.current[0];
    if (firstImage?.complete) mountNext(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (isReady(candidate)) {
            // Seuraava kuva latautumaan valmiiksi, kun tämä on esillä
            mountNext(seq.indexOf(candidate) + 2);
            return { current: candidate, previous: s.current };
          }
        }
        return s;
      });
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    // Ristihäivytys: uusi kuva häivytetään esiin edellisen päälle, ja edellinen pysyy täysin
    // näkyvissä alla koko häivytyksen ajan, ettei tausta paista välissä läpi.
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {list.map((src, i) =>
        order.current.indexOf(i) >= mounted ? null : (
          <Image
            key={src}
            ref={(el) => {
              imageRefs.current[i] = el;
            }}
            src={src}
            alt={alt}
            fill
            priority={i === 0}
            fetchPriority={i === 0 ? 'high' : undefined}
            aria-hidden={i !== slide.current}
            onLoad={i === 0 ? () => mountNext(2) : undefined}
            onError={() => {
              failed.current[i] = true;
              // Epäonnistunut kuva ohitetaan: liitetään seuraava, ettei kierto pysähdy
              mountNext(order.current.indexOf(i) + 2);
            }}
            sizes={sizes}
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
  );
}
