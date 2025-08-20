import QuoteForm from "@/components/Forms/QuoteForm";

export const metadata = {
  title: "Tarjouspyyntö | Muuttokone.fi",
  description: "Pyydä tarjous muutosta – täytä tiedot ja palaamme pian.",
};

export default function Page() {
  return (
    <main className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-4xl px-4 md:px-8 xl:px-21">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-white lg:text-4xl">
          Pyydä tarjous
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Täytä alla olevat tiedot. Vähintään puhelinnumero ja muuttopäivä vaaditaan.
        </p>
        <QuoteForm />
      </div>
    </main>
  );
}
