import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Käyttöehdot | Muuttokone.fi',
  description: 'Muuttokone.fi palvelun käyttöehdot. Lue ehdot ennen palvelun tilaamista.',
};

export default function TermsOfService() {
  return (
    <main className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-4xl px-4 md:px-8 xl:px-21">
        <div className="bg-white p-8 shadow-lg dark:bg-black lg:p-12">
          <h1 className="mb-8 text-3xl font-bold text-black dark:text-white">Käyttöehdot</h1>
          <p className="mb-8 text-sm text-gray-500">Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">1. Yleistä</h2>
            <p>
              Nämä ehdot koskevat Muuttokone.fi (jäljempänä "Palveluntarjoaja") ja asiakkaan välistä sopimusta muuttopalveluista. Tilaamalla palvelun asiakas hyväksyy nämä ehdot.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">2. Palvelun sisältö</h2>
            <p>
              Palvelu sisältää sovitun mukaisesti muuton, kuljetuksen, kantamisen ja muut erikseen sovitut lisäpalvelut (kuten pakkaus tai kuolinpesätyhjennnys). Tarkka sisältö määritellään tilausvahvistuksessa tai tarjouksessa.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">3. Hinnoittelu ja maksuehdot</h2>
            <p>
              Hinnat perustuvat voimassa olevaan hinnastoon tai erilliseen tarjoukseen. Hinnat sisältävät arvonlisäveron (25.5%), ellei toisin mainita.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Maksuehto on 14 päivää netto, ellei toisin sovita.</li>
              <li>Viivästyskorko määräytyy korkolain mukaisesti.</li>
              <li>Oikeus hinnanmuutoksiin pidätetään.</li>
            </ul>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">4. Asiakkaan velvollisuudet</h2>
            <p>Asiakas vastaa seuraavista:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Antaa oikeat tiedot kohteesta, tavaramäärästä ja olosuhteista (esim. hissin puuttuminen).</li>
              <li>Huolehtia tavaroiden asianmukaisesta pakkauksesta, ellei pakkauspalvelua ole tilattu.</li>
              <li>Varmistaa esteetön kulku lähtö- ja kohdeosoitteessa.</li>
              <li>Ilmoittaa arvokkaista tai erityistä varovaisuutta vaativista esineistä etukäteen.</li>
            </ul>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">5. Peruutusehdot</h2>
            <p>
              Tilauksen peruutus on tehtävä kirjallisesti tai puhelimitse viimeistään 48 tuntia ennen sovittua muuttoajankohtaa.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Alle 48 tuntia ennen peruutetuista tilauksista veloitamme 50% sovitusta hinnasta.</li>
              <li>Peruuttamattomista tilauksista ("no-show") veloitamme täyden hinnan.</li>
            </ul>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">6. Vakuutukset ja vastuu</h2>
            <p>
              Palveluntarjoajalla on lakisääteinen tiekuljetusvakuutus ja toiminnan vastuuvakuutus. Vakuutus korvaa Palveluntarjoajan huolimattomuudesta aiheutuneet vahingot vakuutusehtojen mukaisesti.
            </p>
            <p>
              Palveluntarjoaja ei vastaa vahingoista, jotka johtuvat asiakkaan puutteellisesta pakkauksesta tai ylivoimaisesta esteestä (force majeure).
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">7. Reklamaatiot</h2>
            <p>
              Mahdolliset huomautukset palvelusta tai havaituista vahingoista on tehtävä kirjallisesti 7 vuorokauden kuluessa palvelun suorittamisesta.
            </p>

            <h2 className="text-xl font-semibold text-black dark:text-white mt-6 mb-4">8. Sovellettava laki</h2>
            <p>
              Sopimukseen sovelletaan Suomen lakia. Mahdolliset erimielisyydet pyritään ratkaisemaan ensisijaisesti neuvottelemalla.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
