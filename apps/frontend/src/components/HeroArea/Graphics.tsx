import React from 'react';
import Image from 'next/image';

const Graphics = () => {
  return (
    <>
      <div className="relative mx-auto max-w-[520px] md:mx-0 md:max-w-none">
        {/* Soft gradient fade into background on larger screens */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-l from-white via-white/60 to-transparent md:block dark:from-black dark:via-black/40 dark:to-transparent" />

        {/* Portrait hero image with smart sizing */}
        <div className="relative z-10 flex items-end justify-center md:justify-end">
          <Image
            src="/images/webp/hero/hero.webp"
            alt="Hero"
            width={720}
            height={1280}
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 78vw, (max-width: 1024px) 420px, 520px"
            className="h-auto w-[78%] max-w-[420px] min-w-[260px] md:w-auto md:max-w-none"
          />
        </div>
      </div>
    </>
  );
};

export default Graphics;
