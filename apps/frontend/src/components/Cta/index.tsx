import Image from 'next/image';
import Link from 'next/link';

export default function Cta() {
  return (
    <>
      <section className="bg-primary relative overflow-hidden py-25">
        <Image
          className="absolute right-0 bottom-0"
          src="/images/shape/shape-16.svg"
          alt="Bg Shape"
          width={1660}
          height={337}
        />

        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="flex flex-wrap gap-8 md:flex-nowrap md:items-center md:justify-between">
            <div className="animate_left lg:w-1/2">
              <h2 className="text-title-lg lg:text-title-xl xl:text-title-xl mb-4 font-semibold text-white">
                Valmis muuttoon? Aloita tänään!
              </h2>
              <p className="text-regular text-white">
                Saat meiltä maksuttoman kartoituksen ja tarjouksen 24 tunnin sisällä. Liity satojen
                tyytyväisten asiakkaiden joukkoon ja koe stressitön muutto.
              </p>
            </div>
            <div className="animate_right shrink-0">
              <Link
                href="/muuttolaskuri"
                className="hover:shadow-1 inline-flex rounded-full bg-white px-7.5 py-3 font-medium text-black duration-300 ease-out"
              >
                Pyydä tarjous
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
