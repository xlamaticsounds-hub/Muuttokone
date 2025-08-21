import Image from 'next/image';

export default function Graphics() {
  return (
    <>
      <span className="bg-whiter dark:bg-blacksection absolute top-0 left-0 -z-1 block h-3/5 w-full"></span>
      <Image
        src={'/images/shape/shape-08.svg'}
        alt="Shape Bg"
        className="absolute top-0 right-0"
        width={1621}
        height={556}
      />
      <Image
        src={'/images/shape/shape-09.svg'}
        alt="Shape"
        className="animate-rotating absolute top-1/2 left-[10%] -z-1"
        width={47}
        height={54}
      />
      <Image
        src={'/images/shape/shape-10.svg'}
        alt="Shape"
        className="absolute top-[5%] left-[20%] -z-1"
        width={54}
        height={54}
      />
      <Image
        src={'/images/shape/shape-11.svg'}
        alt="Shape"
        className="animate-rotating absolute top-[15%] right-[15%] -z-1"
        width={80}
        height={69}
      />
    </>
  );
}
