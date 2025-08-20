import Image from "next/image";

export default function Graphics() {
  return (
    <>
      <Image
        src="/images/shape/shape-11.svg"
        alt="Shape"
        className="absolute bottom-[3%] left-[3%] w-14.5 animate-rotating"
        width={58}
        height={58}
      />
      <Image
        src="/images/shape/shape-07.svg"
        alt="Shape"
        className="absolute right-[2%] top-[6%] w-21 rotate-90"
        width={84}
        height={42}
      />
      <Image
        src="/images/shape/shape-14.svg"
        alt="Shape"
        className="absolute left-[35%] top-[1%]"
        width={54}
        height={54}
      />
      <Image
        src="/images/shape/shape-15.svg"
        alt="Shape"
        className="absolute bottom-0 right-0"
        width={1660}
        height={280}
      />
    </>
  );
}
