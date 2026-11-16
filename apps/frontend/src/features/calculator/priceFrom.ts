// "Alkaen"-hinnat UKK-vastauksiin ja llms.txt:hen. Luvut luetaan laskurin vakioista, joten teksti ja
// laskuri näyttävät aina saman hinnan (kuten etusivun PricingPreview). Hakukoneet ja tekoälyhaut eivät
// aja laskurin JavaScriptiä, joten pelkästä laskurista ne eivät näe yhtään hintaa (omistajan päätös
// 16.11.2026: alkaen-hinnat saa näyttää UKK-vastauksissa).
//
// Kaikki hinnat sis. ALV. Vähimmäishinta on hinta ennen päiväalennusta, joten tiistaina ja
// keskiviikkona tai kuun puolivälissä laskurin hinta voi olla vielä alempi. priceFrom.test.ts
// tarkistaa, että pieni muutto maksaa laskurissa tasan nämä hinnat.
//
// 4h+ puuttuu tarkoituksella: sen vähimmäistyöaika (MIN_HANDLING_MINUTES) nostaa pienimmänkin muuton
// selvästi FULL_SERVICE_MIN_PRICE['4h+']:n yli, joten "alkaen 899 €" olisi harhaanjohtava.
import { CLEANING_PRICE, FULL_SERVICE_MIN_PRICE, PRICING_CONSTANTS, TRANSPORT_MINIMUM } from './pricing';

export const PRICE_FROM = {
  fullService: {
    '1h': FULL_SERVICE_MIN_PRICE['1h']!,
    '2h': FULL_SERVICE_MIN_PRICE['2h']!,
    '3h': FULL_SERVICE_MIN_PRICE['3h']!,
  },
  driverWithVehicle: PRICING_CONSTANTS.driverWithVehicleMinimum,
  carryingHelp: PRICING_CONSTANTS.carryingHelpMinimum,
  transport: TRANSPORT_MINIMUM.oneDriver,
  transportTwoDrivers: TRANSPORT_MINIMUM.twoDrivers,
  cleaning: CLEANING_PRICE,
} as const;

const eur = (amount: number) => `${amount} €`;
const { fullService: full } = PRICE_FROM;

/** Lauseet UKK-vastauksiin. Hinnat yhdessä paikassa, jotta sanamuoto pysyy samana kaikilla sivuilla. */
export const PRICE_FROM_TEXT = {
  /** "yksiö alkaen 189 €, kaksio alkaen 299 € ja kolmio alkaen 599 €" */
  fullService: `yksiö alkaen ${eur(full['1h'])}, kaksio alkaen ${eur(full['2h'])} ja kolmio alkaen ${eur(full['3h'])}`,
  /** "kuljettaja ja auto alkaen 184 € ja pelkkä kantoapu alkaen 180 €" */
  lighterPackages: `kuljettaja ja auto alkaen ${eur(PRICE_FROM.driverWithVehicle)} ja pelkkä kantoapu alkaen ${eur(PRICE_FROM.carryingHelp)}`,
  transport: `yhdellä kuljettajalla alkaen ${eur(PRICE_FROM.transport)} ja kahdella kuljettajalla alkaen ${eur(PRICE_FROM.transportTwoDrivers)}`,
  cleaning: `yksiö ${eur(PRICE_FROM.cleaning['1h'])}, kaksio ${eur(PRICE_FROM.cleaning['2h'])}, kolmio ${eur(PRICE_FROM.cleaning['3h'])} ja neljä huonetta tai enemmän ${eur(PRICE_FROM.cleaning['4h+'])}`,
  cheaperDays: 'Tiistaisin, keskiviikkoisin ja kuun puolivälissä hinta voi olla vielä edullisempi.',
} as const;

/** Kaikki sivuilla näkyvät alkaen-hinnat: testi sallii UKK-vastauksissa vain nämä euromäärät. */
export const ALL_PRICE_FROM_AMOUNTS: readonly number[] = [
  ...Object.values(PRICE_FROM.fullService),
  PRICE_FROM.driverWithVehicle,
  PRICE_FROM.carryingHelp,
  PRICE_FROM.transport,
  PRICE_FROM.transportTwoDrivers,
  ...Object.values(PRICE_FROM.cleaning),
];
