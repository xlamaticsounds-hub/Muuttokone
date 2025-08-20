import type { Metadata } from "next";
import Cta from "@/components/Cta";
import SmallFeatures from "@/components/SmallFeatures";

export const metadata: Metadata = {
  title: "Yritysmuutto – Muuttokone.fi",
  description: "Yritysmuutot ja toimistosiirrot – aikataulut pitävät ja omaisuus pysyy turvassa.",
};

export default function Page() {
  return (
    <section className="py-17.5 lg:py-22.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <h1 className="text-3xl font-semibold text-black dark:text-white">Yritysmuutto</h1>
        <p className="mt-4 max-w-3xl text-black/70 dark:text-white/80">
          Suunnittelemme ja toteutamme yritys- ja toimistomuutot tehokkaasti liiketoimintaa häiritsemättä.
        </p>
        <div className="mt-10">
          <SmallFeatures />
        </div>
        <div className="mt-15">
          <Cta />
        </div>
      </div>
    </section>
  );
}
