export type ReferenceCase = {
  title: string;
  body: string;
  badge: string;
};

// Jaettu lähde /referenssit-sivulle ja /yrityksille-sivun B2B-caseille (suodatettu badge==='B2B'),
// jotta sisältö ei eriydy kahteen paikkaan kopioituna.
export const cases: ReferenceCase[] = [
  {
    title: 'Helsinki → Turku: 4h yritysmuutto',
    body: 'Kaksi pakettiautoa, neljä kantajaa. Kalusteet suojattu huovilla ja kutistekalvolla, palveluun sisältyi työpisteiden merkintä ja kaapelointi.',
    badge: 'B2B',
  },
  {
    title: 'Perheasunnon muutto Espoossa',
    body: 'Pakkasimme keittiön ja lastenhuoneen, suojaukset hisseille ja käytäville. Valmis ennen klo 17 ja luovutus siivottuna.',
    badge: 'Kotimuutto',
  },
  {
    title: 'Arkistosiirto 1200 laatikkoa',
    body: 'Reititys ja kantoluvat etukäteen, nosto-ovien aikataulutus. Toteutus kahdessa yössä ilman liiketoiminnan katkoa.',
    badge: 'B2B',
  },
  {
    title: 'Kuolinpesätyhjennnys Helsingissä',
    body: 'Kokonainen asunto tyhjennetty hienotunteisesti. Tavarat lajiteltu – kierrätys, lahjoitus ja kaatopaikka-ajo hoidettu saman päivän aikana.',
    badge: 'Kuolinpesä',
  },
];
