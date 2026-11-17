// Yrityksen perustiedot yhdessä paikassa (omistajalta 16.11.2026). Käytössä: Yhteystiedot-sivun
// "Muuttokone.fi lyhyesti" -osio (components/CompanyFacts.tsx), /llms.txt ja schema.org-data
// (components/SEO/StructuredData.tsx). Tekoälyhaut lainaavat tällaisia irrallisia faktoja, ja niiden pitää
// olla samat kaikkialla: päivitä tänne, kun muuttojen määrä, tiimi tai kalusto muuttuu.
import { siteConfig } from './site';
import { PRICE_FROM_TEXT } from '@/features/calculator/priceFrom';

export const COMPANY_FACTS = {
  /** Kaupparekisteriin 16.5.2026 (ennakkoperintärekisteriin 13.5.2026). */
  foundingDate: '2026-05-16',
  foundedText: 'toukokuussa 2026',
  /** Ensimmäiset muutot (omistaja 17.11.2026). */
  operationsStartedText: 'elokuussa 2026',
  /** Päivitä määrä ja kuukausi samalla kertaa. */
  movesText: 'yli 100 muuttoa (marraskuu 2026)',
  crewText: 'Helsingissä yli 10 ja Tampereella 6 muuttajaa',
  fleetText:
    'Pullakori-kuorma-auto peränostimella (noin 22 m³) ja Mercedes-Benz Sprinter -pakettiauto (noin 10–11 m³). Isoihin muuttoihin tarvittaessa lisäksi kuorma-auto kuljettajineen ja peräkärry.',
  insuranceText: 'Ifin toiminnanvastuuvakuutus, joka kattaa myös asiakkaan tavarat muuton aikana.',
  /** ISO 639-1 schemaan, teksti sivulle. */
  languages: ['fi', 'en'],
  languagesText: 'suomi ja englanti',
  /** Käteistä ei oteta vastaan, ellei siitä sovita erikseen. */
  paymentAccepted: ['Credit Card', 'Invoice', 'Bank Transfer'],
  paymentText: 'kortti, lasku (sähköposti tai verkkolasku) ja tilisiirto',
  serviceAreaText: 'pääkaupunkiseutu, Tampere ja Pirkanmaa sekä muutot koko Suomeen',
  /** Omistajan omin sanoin. "Sama hinta joka päivä" muotoiltu niin, ettei se riitele ti–ke-alennusten kanssa. */
  differentiators: [
    'Hinta näkyy heti muuttolaskurista, eikä tarjousta tarvitse odottaa.',
    'Ei viikonloppulisiä: hinta ei nouse suosittuina päivinä, ja lisäpalvelut ovat kiinteähintaisia.',
    'Nopea vastaus. Palvelemme Helsingissä, Tampereella ja koko Suomessa.',
  ],
} as const;

/** Rivit "Muuttokone.fi lyhyesti" -osioon ja llms.txt:hen. */
export function companyFactRows(): { label: string; value: string }[] {
  const { contact, businessId } = siteConfig;
  return [
    { label: 'Yritys', value: `Muuttokone Oy (Muuttokone.fi), Y-tunnus ${businessId}` },
    { label: 'Perustettu', value: `${COMPANY_FACTS.foundedText}, toiminta alkoi ${COMPANY_FACTS.operationsStartedText}` },
    { label: 'Muuttoja tehty', value: COMPANY_FACTS.movesText },
    { label: 'Tukikohdat', value: `Helsinki ja Tampere (Hervanta), ${COMPANY_FACTS.crewText}` },
    { label: 'Palvelualue', value: COMPANY_FACTS.serviceAreaText },
    { label: 'Kalusto', value: COMPANY_FACTS.fleetText },
    { label: 'Vakuutus', value: COMPANY_FACTS.insuranceText },
    { label: 'Hinnat (sis. ALV)', value: `Täyspalvelumuutto: ${PRICE_FROM_TEXT.fullService}. Kiinteä hinta heti muuttolaskurista.` },
    { label: 'Maksutavat', value: COMPANY_FACTS.paymentText },
    { label: 'Palvelukielet', value: COMPANY_FACTS.languagesText },
    { label: 'Aukiolo', value: contact.openingHours.replace(/\.$/, '') },
    { label: 'Yhteystiedot', value: `${contact.phone.display}, ${contact.email}` },
  ];
}
