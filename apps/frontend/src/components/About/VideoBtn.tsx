"use client";

import Link from "next/link";
import Image from "next/image";
import FsLightbox from "fslightbox-react";
import { useState } from "react";

export default function VideoBtn() {
  const [toggler, setToggler] = useState(false);

  return (
    <>
      <Link
        href="#"
        onClick={() => setToggler(!toggler)}
        className="mt-10 inline-flex items-center gap-6.5"
      >
        <span className="relative z-1 flex h-12.5 w-12.5 items-center justify-center rounded-full bg-primary">
          <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          <Image
            src={"/images/icon/icon-play.svg"}
            alt="Play"
            width={24}
            height={24}
          />
        </span>
        <span className="text-black dark:text-white">SEE HOW WE WORK</span>
      </Link>

      <FsLightbox
        toggler={toggler}
        sources={[
          "https://www.youtube.com/watch?v=HXHphpDJ9T0&pp=ygULaW50cm8gdmlkZW8%3D",
        ]}
      />
    </>
  );
}
