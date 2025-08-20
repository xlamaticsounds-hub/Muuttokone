import Graphics from "@/components/Counter/Graphics";
import CounterWrapper from "@/components/Counter/CounterWrapper";

export default function Counter() {
  return (
    <>
      <section className="relative overflow-hidden bg-whiten py-20 dark:bg-blacksection lg:py-22.5">
        <Graphics />

        <div className="relative z-10 mx-auto max-w-1390 px-4 md:px-8 xl:px-36.5">
          <CounterWrapper />
        </div>
      </section>
    </>
  );
}
