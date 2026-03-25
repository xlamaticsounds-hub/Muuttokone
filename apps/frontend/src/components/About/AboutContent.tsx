import CallRequestForm from './CallRequestForm';

export default function AboutContent() {
  return (
    <>
      <div className="animate_right md:w-1/2">
        <h4 className="text-primary mb-5 text-xl font-medium">Miksi Muuttokone?</h4>
        <h2 className="xl:text-title-xl mb-7.5 text-3xl font-semibold text-black lg:text-4xl dark:text-white">
          Me hoidamme muuton – sinä voit keskittyä olennaiseen
        </h2>

        <p className="lg:w-[95%]">
          Kokeneet muuttajamme, selkeä hinnoittelu ilman piilokuluja sekä kattava vakuutusturva
          takaavat sujuvan ja turvallisen muuton niin yksityisille kuin yrityksille.
        </p>

        <p className="mt-4 lg:w-[95%]">
          Ennen muuttoa käymme asiakkaan kanssa läpi kohteen, aikataulun ja erityistarpeet.
          Suunnittelemme työn tehokkaaksi ja ennakoitavaksi, jotta muutto toteutuu täsmällisesti ja
          ilman yllätyksiä.
        </p>

        <div className="shadow-primary/10 mt-10 rounded-3xl border border-black/10 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/85">
          <div className="mb-6">
            <div className="text-primary text-sm font-semibold tracking-[0.28em] uppercase">
              Jätä soittopyyntö
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-black dark:text-white">
              Kerro yhteystietosi, palaamme pian
            </h3>
            <p className="mt-3 text-sm text-black/70 dark:text-white/70">
              Täytä lomake, niin soitamme sinulle takaisin ja käymme läpi muuttoosi liittyvät
              toiveet.
            </p>
          </div>

          <CallRequestForm />
        </div>
      </div>
    </>
  );
}
