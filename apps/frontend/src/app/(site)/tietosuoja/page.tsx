import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tietosuojaseloste | Muuttokone.fi',
  description: 'Muuttokone.fi tietosuojaseloste. Lue miten käsittelemme henkilötietojasi.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPolicy() {
  return (
    <main className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-4xl px-4 md:px-8 xl:px-21">
        <div className="bg-white p-8 shadow-lg dark:bg-black lg:p-12">
          <h1 className="mb-8 text-3xl font-bold text-black dark:text-white">Tietosuojaseloste</h1>
          <p className="mb-8 text-sm text-gray-500">Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">1. Rekisterinpitäjä</h2>
            <p>
              Muuttokone.fi<br />
              Helsinki, Suomi<br />
              Sähköposti: info@muuttokone.fi
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">2. Henkilötietojen käsittelyn tarkoitus ja oikeusperuste</h2>
            <p>
              Keräämme ja käsittelemme henkilötietoja seuraaviin tarkoituksiin:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Palveluiden tuottaminen ja toimittaminen (esim. muutot, kuljetukset).</li>
              <li>Asiakassuhteen hoitaminen ja viestintä.</li>
              <li>Laskutus ja maksujen valvonta.</li>
              <li>Markkinointi (suostumuksella).</li>
              <li>Palvelun kehittäminen ja tilastointi.</li>
            </ul>
            <p>
              Käsittely perustuu sopimuksen täytäntöönpanoon, lakisääteisiin velvoitteisiin tai oikeutettuun etuun.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">3. Käsiteltävät tiedot</h2>
            <p>Rekisterissä voidaan käsitellä seuraavia tietoja:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Perustiedot (nimi, puhelinnumero, sähköposti).</li>
              <li>Muuttotiedot (lähtö- ja kohdeosoite, asunnon koko, muuttopäivä).</li>
              <li>Tiedot tilatuista palveluista ja niiden sisällöstä.</li>
              <li>Laskutustiedot.</li>
              <li>Viestintähistoria (esim. sähköpostit, tarjouspyynnöt).</li>
            </ul>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">4. Tietojen säilytysaika</h2>
            <p>
              Säilytämme henkilötietoja vain niin kauan kuin on tarpeellista määriteltyjen tarkoitusten toteuttamiseksi tai lainsäädännön (esim. kirjanpitolaki) vaatimusten mukaisesti.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Tarjouspyynnöt ilman tilausta: Poistetaan 12 kk kuluessa.</li>
              <li>Asiakassuhteen tiedot: Säilytetään asiakassuhteen keston ajan.</li>
              <li>Kirjanpitoaineisto: Säilytetään 6 vuotta tilikauden päättymisestä.</li>
            </ul>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">5. Tietojen luovutukset ja siirrot</h2>
            <p>
              Emme myy tai vuokraa henkilötietoja kolmansille osapuolille. Tietoja voidaan luovuttaa:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Yhteistyökumppaneille palvelun tuottamiseksi (esim. alihankkijat).</li>
              <li>Viranomaisille lainsäädännön edellyttämissä tapauksissa.</li>
            </ul>
            <p>
              Tietoja ei pääsääntöisesti siirretä EU:n tai ETA:n ulkopuolelle. Jos siirto on tarpeen, huolehdimme riittävästä tietosuojasta.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">6. Rekisteröidyn oikeudet</h2>
            <p>Sinulla on seuraavat oikeudet:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Oikeus tarkastaa itseäsi koskevat tiedot.</li>
              <li>Oikeus vaatia virheellisen tiedon oikaisua.</li>
              <li>Oikeus vaatia tietojen poistamista ("oikeus tulla unohdetuksi"), ellei laki velvoita säilyttämään tietoja.</li>
              <li>Oikeus kieltää suoramarkkinointi.</li>
            </ul>
            <p>
              Pyyntöjen tulee olla kirjallisia ja ne tulee toimittaa rekisterinpitäjän sähköpostiosoitteeseen.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">7. Tietoturva</h2>
            <p>
              Rekisterin käsittelyssä noudatetaan huolellisuutta ja tietojärjestelmillä käsiteltävät tiedot suojataan asianmukaisesti. Pääsy tietoihin on vain niillä työntekijöillä, joiden työtehtävät sitä edellyttävät.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">8. Evästeet (Cookies)</h2>
            <p>
              Käytämme sivustolla evästeitä käyttökokemuksen parantamiseksi ja kävijätilastointiin. Voit hallita evästeasetuksia selaimesi asetuksista tai sivustomme evästebannerista.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
