import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      {/* Keep only the main voimamies image; remove shapes and extra photos */}
      <div className="animate_left relative hidden items-start justify-center md:flex md:w-1/2">
        <div className="relative">
          {/* Main image - render without background/shadow so it blends with page */}
          <Image
            src="/images/webp/muuttokone/webp/voimamies.webp"
            alt="Voimamies"
            className="h-auto w-[260px] md:w-[300px] lg:w-[340px]"
            width={340}
            height={485}
            quality={99}
            priority={false}
          />
        </div>
      </div>
    </>
  );
}
