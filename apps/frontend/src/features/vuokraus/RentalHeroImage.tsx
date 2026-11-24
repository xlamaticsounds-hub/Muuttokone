import Image from 'next/image';

// Muuttolaatikot-sivujen (myös kaupunkisivujen) hero-kuva: työntekijä ja pino vuokralaatikoita.
// Pystykuva, joten leveys rajataan ettei hero veny liian korkeaksi. Tuotekuva näkyy edelleen tuotekortissa.
export default function RentalHeroImage() {
  return (
    <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:mr-0">
      <Image
        src="/images/tiimi/muuttolaatikot.jpg"
        alt="Muuttokoneen työntekijä kantaa vuokrattavaa muuttolaatikkoa, vieressä pino laatikoita"
        width={1000}
        height={1400}
        priority
        quality={90}
        sizes="(min-width: 640px) 384px, 320px"
        className="h-auto w-full rounded-2xl shadow-2xl ring-1 ring-white/20"
      />
    </div>
  );
}
