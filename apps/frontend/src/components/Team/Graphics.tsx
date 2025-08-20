import Image from "next/image";

export default function Graphics() {
  return (
    <>
      <span className="absolute left-0 top-0 -z-1 block h-3/5 w-full bg-whiter dark:bg-blacksection"></span>
      <Image
        src={"/images/shape/shape-08.svg"}
        alt="Shape Bg"
        className="absolute right-0 top-0"
        width={1621}
        height={556}
      />
      <Image
        src={"/images/shape/shape-09.svg"}
        alt="Shape"
        className="absolute left-[10%] top-1/2 -z-1 animate-rotating"
        width={47}
        height={54}
      />
      <Image
        src={"/images/shape/shape-10.svg"}
        alt="Shape"
        className="absolute left-[20%] top-[5%] -z-1"
        width={54}
        height={54}
      />
      <Image
        src={"/images/shape/shape-11.svg"}
        alt="Shape"
        className="absolute right-[15%] top-[15%] -z-1 animate-rotating"
        width={80}
        height={69}
      />
    </>
  );
}
