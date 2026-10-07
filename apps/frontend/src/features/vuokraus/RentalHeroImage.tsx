import Image from 'next/image';
import { BOX_ITEM_ID, getRentalItem } from './rental';

// Tuotekuva Muuttolaatikot-sivujen hero-osioon (valkotaustainen kuva valkoisessa kortissa sinisellä taustalla).
export default function RentalHeroImage() {
  const box = getRentalItem(BOX_ITEM_ID);
  if (!box?.image) return null;
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl lg:max-w-none">
      <Image
        src={box.image}
        alt={box.imageAlt ?? box.title}
        width={1200}
        height={800}
        priority
        sizes="(min-width: 1024px) 560px, 90vw"
        className="h-auto w-full rounded-2xl"
      />
    </div>
  );
}
