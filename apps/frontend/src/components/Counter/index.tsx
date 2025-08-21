import Graphics from '@/components/Counter/Graphics';
import CounterWrapper from '@/components/Counter/CounterWrapper';

export default function Counter() {
  return (
    <>
      <section className="bg-whiten dark:bg-blacksection relative overflow-hidden py-20 lg:py-22.5">
        <Graphics />

        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-36.5">
          <CounterWrapper />
        </div>
      </section>
    </>
  );
}
