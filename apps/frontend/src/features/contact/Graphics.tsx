import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      <Image
        src="/images/shape/shape-06.svg"
        alt="Shape"
        className="absolute top-[5%] left-[10%]"
        width={43}
        height={86}
      />
      <Image
        src="/images/shape/shape-03.svg"
        alt="Shape"
        className="absolute top-[25%] right-[20%]"
        width={85}
        height={46}
      />
      <Image
        src="/images/shape/shape-07.svg"
        alt="Shape"
        className="absolute right-[5%] bottom-[10%] w-25"
        width={100}
        height={50}
      />
      <Image
        src="/images/shape/shape-12.svg"
        alt="Shape"
        className="absolute bottom-0 left-0"
        width={927}
        height={1039}
      />
      <Image
        src="/images/shape/shape-13.svg"
        alt="Shape"
        className="absolute top-0 right-0"
        width={1027}
        height={492}
      />
    </>
  );
}
