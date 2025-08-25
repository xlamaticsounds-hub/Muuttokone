export default function AboutContent() {
  return (
    <>
      <div className="animate_right md:w-1/2">
        <h4 className="text-primary mb-5 text-xl font-medium">Miksi Muuttokone?</h4>
        <h2 className="xl:text-title-xl mb-7.5 text-3xl font-semibold text-black lg:text-4xl dark:text-white">
          Helppo ja luotettava muutto – alusta loppuun
        </h2>
        <p className="lg:w-[95%]">
          Me hoidamme muuton niin, että sinä voit keskittyä olennaiseen. Kokeneet muuttajamme,
          selkeä hinnoittelu ilman piilokuluja sekä kattava vakuutusturva varmistavat sujuvan
          kokemuksen koti- ja yritysasiakkaille.
        </p>

        <div className="mt-7.5">
          <div className="mb-4 flex items-center gap-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-primary stroke-2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <span className="font-medium text-black dark:text-white">
              Selkeä ja reilu hinnoittelu – ei piilokuluja
            </span>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-primary stroke-2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="font-medium text-black dark:text-white">
              Saapumme ajallaan ja pidämme lupaukset
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-primary stroke-2"
              >
                <path d="M9 12V6a3 3 0 0 1 6 0v6" />
                <path d="M4 12a8 8 0 1 1 16 0H4z" />
              </svg>
            </div>
            <span className="font-medium text-black dark:text-white">
              Kokeneet ja tehokkaat tekijät
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
