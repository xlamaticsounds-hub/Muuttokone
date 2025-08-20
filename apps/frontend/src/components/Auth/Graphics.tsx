import Image from "next/image";

export default function Graphics() {
  return (
    <>
      <Image
        src="/images/shape/shape-06.svg"
        alt="Shape"
        className="absolute left-[2%] top-[30%]"
        width={43}
        height={86}
      />
      <Image
        src="/images/shape/shape-03.svg"
        alt="Shape"
        className="absolute bottom-[40%] right-[15%]"
        width={85}
        height={46}
      />
      <Image
        src="/images/shape/shape-17.svg"
        alt="Shape"
        className="absolute bottom-[5%] right-[2%]"
        width={104}
        height={52}
      />
      <Image
        src="/images/shape/shape-18.svg"
        alt="Shape"
        className="absolute bottom-0 right-0"
        width={447}
        height={711}
      />
    </>
  );
}
