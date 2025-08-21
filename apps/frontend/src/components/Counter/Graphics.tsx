import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      <Image
        src="/images/shape/shape-11.svg"
        alt="Shape"
        className="animate-rotating absolute bottom-[3%] left-[3%] w-14.5"
        width={58}
        height={58}
      />
      <Image
        src="/images/shape/shape-07.svg"
        alt="Shape"
        className="absolute top-[6%] right-[2%] w-21 rotate-90"
        width={84}
        height={42}
      />
      <Image
        src="/images/shape/shape-14.svg"
        alt="Shape"
        className="absolute top-[1%] left-[35%]"
        width={54}
        height={54}
      />
      <Image
        src="/images/shape/shape-15.svg"
        alt="Shape"
        className="absolute right-0 bottom-0"
        width={1660}
        height={280}
      />
    </>
  );
}
