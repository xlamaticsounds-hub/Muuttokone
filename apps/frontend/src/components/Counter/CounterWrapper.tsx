import CountUp from "@/components/Counter/CountUp";

export default function CounterWrapper() {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-8 md:flex-nowrap md:items-center md:justify-between">
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="mb-0.5 text-3xl font-bold text-black dark:text-white lg:text-4xl xl:text-title-xxl">
            <CountUp targetNumber={785} />
          </h2>
          <p className="text-base font-medium lg:text-title-xsm2">
            Global Brands
          </p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="mb-0.5 text-3xl font-bold text-black dark:text-white lg:text-4xl xl:text-title-xxl">
            <CountUp targetNumber={533} />
          </h2>
          <p className="text-base font-medium lg:text-title-xsm2">
            Happy Clients
          </p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="mb-0.5 text-3xl font-bold text-black dark:text-white lg:text-4xl xl:text-title-xxl">
            <CountUp targetNumber={865} />
          </h2>
          <p className="text-base font-medium lg:text-title-xsm2">
            Winning Award
          </p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="mb-0.5 text-3xl font-bold text-black dark:text-white lg:text-4xl xl:text-title-xxl">
            <CountUp targetNumber={346} />
          </h2>
          <p className="text-base font-medium lg:text-title-xsm2">
            Happy Clients
          </p>
        </div>
      </div>
    </>
  );
}
