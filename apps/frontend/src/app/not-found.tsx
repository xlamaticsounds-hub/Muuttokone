import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Sivua ei löydy | Muuttokone.fi',
  description: 'Etsimääsi sivua ei löytynyt. Palaa takaisin etusivulle tai ota yhteyttä.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <section className="bg-whiter dark:bg-blacksection fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8 xl:py-20">
      <Image
        src="/images/shape/shape-06.svg"
        alt="Shape"
        className="absolute top-[30%] left-[2%] -z-1"
        width={43}
        height={86}
      />
      <Image
        src="/images/shape/shape-03.svg"
        alt="Shape"
        className="lg:blog absolute right-[15%] bottom-[40%] -z-1 hidden"
        width={85}
        height={46}
      />
      
      <div className="relative z-10 mx-auto max-w-[530px] text-center">
        <Image
          src="/images/404.png"
          alt="404"
          width={400}
          height={300}
          className="mx-auto mb-10"
        />
        
        <h1 className="mb-5 text-4xl font-bold text-black dark:text-white">
          Sivua ei löydy
        </h1>
        
        <p className="mb-10 text-body">
          Etsimääsi sivua ei löytynyt. Se on ehkä siirretty tai poistettu.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/"
            className="bg-primary hover:shadow-1 inline-flex items-center rounded-full px-8 py-3 text-white duration-300 ease-in-out"
          >
            Takaisin etusivulle
          </Link>
          
          <Link
            href="/yhteystiedot"
            className="border-primary text-primary hover:bg-primary inline-flex items-center rounded-full border px-8 py-3 duration-300 ease-in-out hover:text-white"
          >
            Ota yhteyttä
          </Link>
        </div>
      </div>
    </section>
  );
}
