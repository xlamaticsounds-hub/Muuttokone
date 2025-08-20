import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yritys – Muuttokone.fi",
  description: "Tietoa Muuttokone.fi yrityksestä, toimintatavoista ja arvoista.",
};

export default function Page() {
  return (
    <section className="py-17.5 lg:py-22.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <h1 className="text-3xl font-semibold text-black dark:text-white">Yritys</h1>
        <p className="mt-4 max-w-3xl text-black/70 dark:text-white/80">
          Olemme suomalainen muuttopalvelu, joka hoitaa kotien ja yritysten muutot turvallisesti ja tehokkaasti.
        </p>
      </div>
    </section>
  );
}
