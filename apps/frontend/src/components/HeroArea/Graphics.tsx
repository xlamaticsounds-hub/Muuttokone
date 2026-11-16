'use client';

import RotatingImages from './RotatingImages';

// Etusivun herokuva: vaihtuvat työkuvat (lista: heroImages.ts, sama kuin kaupunkisivuilla).
// Kiinteä laatikko (aspect-[3/4]) + object-cover, jotta koko ei hyppää kuvien välillä.
// Pyöristetty kulma + kevyt varjo tekee kuvasta "kortin" eikä läiskän — ei mask/vinjettiä.
const Graphics = () => (
  <div className="relative mx-auto aspect-[3/4] w-[78%] max-w-[420px] min-w-[260px] md:mx-0 md:w-full">
    <div className="relative z-10 h-full w-full">
      <RotatingImages className="rounded-2xl shadow-xl" sizes="(max-width: 768px) 78vw, (max-width: 1024px) 420px, 480px" />
    </div>
  </div>
);

export default Graphics;
