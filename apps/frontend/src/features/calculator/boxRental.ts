// Muuttolaatikoiden vuokra muuttolaskurin lisäpalveluna. Kaikki hinnat sisältävät ALV 25,5 %.
//
// Hinnat, määrärajat ja toimitussäännöt ovat yhdessä paikassa: features/vuokraus/rental.ts
// (RENTAL_ITEMS + RENTAL_DELIVERY). Tämä tiedosto tarjoaa laskurille laatikkokohtaisen
// rajapinnan, jotta laskuri, Muuttolaatikot-sivu, Discord-ilmoitus ja hallinta näyttävät aina saman hinnan.
//
// Toimitus ja nouto ovat ilmaiset kun laatikot vuokrataan muuton yhteydessä (laskuri), ja ilman
// muuttoa kun vuokra on vähintään 100 € (Muuttolaatikot-sivu). Hinnat on kalibroitu pk-seudun
// markkinaan: vuokra 0,15-0,20 €/laatikko/vrk (Kengurut 0,18, Muuttohaukat 0,19, Pnt2Pnt 0,20).

import {
  BOX_ITEM_ID,
  RENTAL_DELIVERY,
  calculateRentalOrder,
  formatEuro,
  describeDelivery,
  getRentalItem,
  type RentalItem,
} from '../vuokraus/rental';

export { formatEuro };

const BOX_ITEM = getRentalItem(BOX_ITEM_ID) as RentalItem;

export const BOX_RENTAL = {
  ratePerBoxPerDay: BOX_ITEM.pricePerDay, // € / laatikko / vuorokausi
  minBoxes: BOX_ITEM.qty.min,
  maxBoxes: BOX_ITEM.qty.max,
  boxStep: BOX_ITEM.qty.step, // +/- -painikkeen askel
  minDays: BOX_ITEM.days.min,
  maxDays: BOX_ITEM.days.max,
  defaultDays: BOX_ITEM.days.default, // noin viikko ennen muuttoa + viikko muuton jälkeen
  dayOptions: BOX_ITEM.days.options as readonly number[],
  deliveryFeeBothWays: RENTAL_DELIVERY.feeBothWays, // € — toimitus + nouto yhteensä (pk-seutu)
  freeDeliveryMinRental: RENTAL_DELIVERY.freeFromRental, // € — ilmainen ilman muuttoa tämän vuokran jälkeen
  lostBoxFee: BOX_ITEM.lostFee ?? 0, // € / kadonnut tai rikkoutunut laatikko
};

export type BoxRentalApartmentSize = '1h' | '2h' | '3h' | '4h+' | 'office';

// Karkea nyrkkisääntö: noin yksi laatikko asuinneliötä kohti (kilpailijoilla 0,9-1,5 / m²).
// Arvot tulevat tuotteen pikavalinnoista (rental.ts), toimisto saa oletusmäärän.
const hintBySize = (size: string, fallback: number) => BOX_ITEM.qtyHints?.find((h) => h.apartmentSize === size)?.qty ?? fallback;
export const BOX_RENTAL_SUGGESTED_COUNT: Record<BoxRentalApartmentSize, number> = {
  '1h': hintBySize('1h', BOX_ITEM.qty.default),
  '2h': hintBySize('2h', BOX_ITEM.qty.default),
  '3h': hintBySize('3h', BOX_ITEM.qty.default),
  '4h+': hintBySize('4h+', BOX_ITEM.qty.default),
  office: BOX_ITEM.qty.default,
};

/**
 * Ehdotettu laatikkomäärä: jos asiakas on jo lisännyt tavaralistaan tarpeeksi laatikoita,
 * luotetaan hänen omaan arvioonsa, muuten käytetään asunnon koon mukaista suositusta.
 */
export function suggestBoxCount(apartmentSize: BoxRentalApartmentSize, boxesInInventory: number): number {
  const sizeBased = BOX_RENTAL_SUGGESTED_COUNT[apartmentSize] ?? BOX_RENTAL.minBoxes;
  const chosen = boxesInInventory >= BOX_RENTAL.minBoxes ? boxesInInventory : sizeBased;
  return Math.min(BOX_RENTAL.maxBoxes, Math.max(BOX_RENTAL.minBoxes, chosen));
}

export interface BoxRentalBreakdown {
  count: number;
  days: number;
  ratePerBoxPerDay: number;
  rentalCost: number; // laatikot x vuorokaudet x päivähinta
  deliveryCost: number; // toimitus + nouto yhteensä
  deliveryFree: boolean;
  deliveryFreeReason: 'move' | 'amount' | null;
  /** Montako laatikkoa lisää (samalla vuokra-ajalla) tekisi toimituksesta ilmaisen; 0 jos jo ilmainen. */
  boxesToFreeDelivery: number;
  total: number;
}

export function calculateBoxRental(input: { count: number; days: number; withMove: boolean }): BoxRentalBreakdown | null {
  const order = calculateRentalOrder([{ itemId: BOX_ITEM_ID, qty: input.count, days: input.days }], { withMove: input.withMove });
  const line = order?.lines[0];
  if (!order || !line) return null;

  const centsPerBox = Math.round(line.days * line.pricePerDay * 100);
  const boxesToFreeDelivery = order.deliveryFree ? 0 : Math.max(0, Math.ceil((order.amountToFreeDelivery * 100) / centsPerBox));

  return {
    count: line.qty,
    days: line.days,
    ratePerBoxPerDay: line.pricePerDay,
    rentalCost: order.rentalCost,
    deliveryCost: order.deliveryCost,
    deliveryFree: order.deliveryFree,
    deliveryFreeReason: order.deliveryFreeReason,
    boxesToFreeDelivery,
    total: order.total,
  };
}

/** Yhden rivin kuvaus Discordiin, muistiinpanoihin ja hallinnan lisäpalvelulistaan. */
export function describeBoxRental(b: BoxRentalBreakdown | null): string | null {
  if (!b) return null;
  const delivery = describeDelivery(b);
  const rate = b.ratePerBoxPerDay.toLocaleString('fi-FI', { minimumFractionDigits: 2 });
  return `Laatikkovuokra: ${b.count} kpl × ${b.days} vrk × ${rate} € = ${formatEuro(b.rentalCost)} · toimitus + nouto: ${delivery}`;
}
