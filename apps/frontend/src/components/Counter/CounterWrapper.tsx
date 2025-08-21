import CountUp from '@/components/Counter/CountUp';

export default function CounterWrapper() {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-8 md:flex-nowrap md:items-center md:justify-between">
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="xl:text-title-xxl mb-0.5 text-3xl font-bold text-black lg:text-4xl dark:text-white">
            <CountUp targetNumber={785} />
          </h2>
          <p className="lg:text-title-xsm2 text-base font-medium">Global Brands</p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="xl:text-title-xxl mb-0.5 text-3xl font-bold text-black lg:text-4xl dark:text-white">
            <CountUp targetNumber={533} />
          </h2>
          <p className="lg:text-title-xsm2 text-base font-medium">Happy Clients</p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="xl:text-title-xxl mb-0.5 text-3xl font-bold text-black lg:text-4xl dark:text-white">
            <CountUp targetNumber={865} />
          </h2>
          <p className="lg:text-title-xsm2 text-base font-medium">Winning Award</p>
        </div>
        <div className="animate_top w-2/5 text-center md:w-auto">
          <h2 className="xl:text-title-xxl mb-0.5 text-3xl font-bold text-black lg:text-4xl dark:text-white">
            <CountUp targetNumber={346} />
          </h2>
          <p className="lg:text-title-xsm2 text-base font-medium">Happy Clients</p>
        </div>
      </div>
    </>
  );
}
