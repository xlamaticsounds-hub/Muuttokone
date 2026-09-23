export type CityData = {
  slug: string;
  name: string;
  inessive: string; // esim. "Espoossa" (missä)
  illative: string; // esim. "Espooseen" (mihin)
  districts: string[];
  title: string;
  description: string;
  intro: string;
};

const cityData: CityData[] = [
  {
    slug: 'espoo',
    name: 'Espoo',
    inessive: 'Espoossa',
    illative: 'Espooseen',
    districts: ['Tapiola', 'Leppävaara', 'Matinkylä', 'Olari', 'Espoon keskus', 'Suomenoja', 'Espoonlahti'],
    title: 'Muuttopalvelu Espoossa',
    description:
      'Ammattitaitoinen muuttopalvelu Espoossa — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    intro:
      'Muutamme koteja ja yrityksiä ympäri Espoota — Tapiolasta Espoonlahteen, Leppävaarasta Matinkylään. Tunnemme alueen kerrostalot ja hissiaikataulut, joten muutto sujuu ilman yllätyksiä.',
  },
  {
    slug: 'vantaa',
    name: 'Vantaa',
    inessive: 'Vantaalla',
    illative: 'Vantaalle',
    districts: ['Tikkurila', 'Myyrmäki', 'Hakunila', 'Korso', 'Kivistö', 'Aviapolis'],
    title: 'Muuttopalvelu Vantaalla',
    description:
      'Luotettava muuttopalvelu Vantaalla — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    intro:
      'Hoidamme muutot kattavasti Vantaan alueella — Tikkurilasta Myyrmäkeen, Aviapoliksesta Korsoon. Lentokentän läheisyys ja hyvät liikenneyhteydet tekevät Vantaasta sujuvan muuttokohteen.',
  },
  {
    slug: 'tampere',
    name: 'Tampere',
    inessive: 'Tampereella',
    illative: 'Tampereelle',
    districts: ['Keskusta', 'Hervanta', 'Kaleva', 'Tesoma', 'Pispala', 'Lielahti'],
    title: 'Muuttopalvelu Tampereella',
    description:
      'Ammattitaitoinen muuttopalvelu Tampereella — kotimuutot, yritysmuutot ja pakkauspalvelu. Kiinteä hinta ilman piilokuluja, pyydä maksuton tarjous.',
    intro:
      'Muutamme koteja ja toimistoja ympäri Tamperetta — Keskustasta Hervantaan, Kalevasta Pispalaan. Teemme myös Helsinki–Tampere-väliä ja muita kaukomuuttoja säännöllisesti.',
  },
];

export default cityData;

export function getCityBySlug(slug: string): CityData | undefined {
  return cityData.find((c) => c.slug === slug);
}
