import React from "react";
import Image from "next/image";

const Graphics = () => {
  return (
    <>
      <div className="relative mx-auto max-w-[520px] md:max-w-none md:mx-0">
        {/* Soft gradient fade into background on larger screens */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block bg-gradient-to-l from-white via-white/60 to-transparent dark:from-black dark:via-black/40 dark:to-transparent" />

        {/* Portrait hero image with smart sizing */}
        <div className="relative z-10 flex items-end justify-center md:justify-end">
          <Image
            src="/images/hero/hero.png"
            alt="Hero"
            width={448}
            height={720}
            priority
            className="h-auto w-[78%] min-w-[260px] max-w-[420px] md:w-auto md:max-w-none"
          />
        </div>
      </div>
    </>
  );
};

export default Graphics;
