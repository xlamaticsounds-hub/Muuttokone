import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      <Image
        src="/images/shape/shape-06.svg"
        alt="Shape"
        className="absolute top-[30%] left-[2%]"
        width={43}
        height={86}
      />
      <Image
        src="/images/shape/shape-03.svg"
        alt="Shape"
        className="absolute right-[15%] bottom-[40%]"
        width={85}
        height={46}
      />
      <Image
        src="/images/shape/shape-17.svg"
        alt="Shape"
        className="absolute right-[2%] bottom-[5%]"
        width={104}
        height={52}
      />
      <Image
        src="/images/shape/shape-18.svg"
        alt="Shape"
        className="absolute right-0 bottom-0"
        width={447}
        height={711}
      />
    </>
  );
}
