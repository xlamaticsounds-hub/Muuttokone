import Image from "next/image";

export default function Graphics() {
  return (
    <>
      {/* Keep only the main voimamies image; remove shapes and extra photos */}
      <div className="animate_left relative hidden md:flex md:w-1/2 items-start justify-center">
        <div className="relative">
          {/* Main image */}
          <Image
            src="/images/muuttokone/png/voimamies.png"
            alt="Voimamies"
            className="rounded-xl shadow-3 w-[260px] md:w-[300px] lg:w-[340px] h-auto"
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
