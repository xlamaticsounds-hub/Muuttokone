import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      {/* Keep only the main voimamies image; remove shapes and extra photos */}
      <div className="animate_left relative hidden items-start justify-center md:flex md:w-1/2">
        <div className="relative">
          {/* Main image */}
          <Image
            src="/images/muuttokone/png/voimamies.png"
            alt="Voimamies"
            className="shadow-3 h-auto w-[260px] rounded-xl md:w-[300px] lg:w-[340px]"
            width={340}
            height={485}
            quality={100}
            priority={false}
          />
        </div>
      </div>
    </>
  );
}
