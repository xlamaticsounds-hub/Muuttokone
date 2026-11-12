import { BOX_ITEM_ID, getRentalItem } from '@/features/vuokraus/rental';

// Muuttolaatikoiden inventaario: kuinka monta laatikkoa on varastossa, vuokralla ja varattuna.
// Puhdas logiikka (ei tietokantaa), jotta inventaariosivu, liidin kortti, Discord-varoitus ja testit
// laskevat saman tuloksen. Päivät käsitellään Suomen päivinä muodossa YYYY-MM-DD (kuten
// Lead.requestedDate, joka tallennetaan UTC-keskiyönä).
//
// Varaus = liidin tila: kalenterissa olevat (SCHEDULED, WON ja toteutuneet) varaavat laatikot,
// uudet ja tarjotut näytetään alustavina eivätkä vähennä saatavuutta. Fyysinen tila (toimitettu,
// noudettu) tulee BoxRental-riviltä.

export type BoxRentalStatusKey = 'RESERVED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
export type RentalCommitment = 'confirmed' | 'tentative' | 'inactive';

export const BOX_STOCK_KEY = 'boxInventory';
export const RETURNING_SOON_DAYS = 7;
export const MAX_RENTAL_QTY = 1000;

const BOX_ITEM = getRentalItem(BOX_ITEM_ID);
const DEFAULT_DAYS = BOX_ITEM?.days.default ?? 14;
// Laskurin laatikkovuokrassa toimitus on noin viikko ennen muuttoa (oletusvuokra 14 pv = viikko ennen + viikko jälkeen)
const MAX_DAYS_BEFORE_MOVE = 7;

const CONFIRMED_STATUSES = ['SCHEDULED', 'WON', 'COMPLETED', 'INVOICED', 'PAID'];
const TENTATIVE_STATUSES = ['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT'];

export function rentalCommitment(leadStatus: string): RentalCommitment {
  if (CONFIRMED_STATUSES.includes(leadStatus)) return 'confirmed';
  if (TENTATIVE_STATUSES.includes(leadStatus)) return 'tentative';
  return 'inactive';
}

// --- Päivät -------------------------------------------------------------------------------

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetweenKeys(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86_400_000);
}

/** UTC-keskiyönä tallennettu päivä (Lead.requestedDate, BoxRental.*Date) → YYYY-MM-DD. */
export function dateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

// --- Liidin lomaketiedot → vuokraus ----------------------------------------------------------

export type BoxRentalRequest = {
  quantity: number;
  deliveryKey: string;
  pickupKey: string;
  source: 'vuokraus' | 'muutto';
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const positiveInt = (value: unknown): number | null => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_RENTAL_QTY) : null;
};

/**
 * Lukee liidin lomaketiedoista laatikkovuokrauksen (määrä, toimitus- ja noutopäivä).
 * - Muuttolaatikot-sivun tilaus: { kind: 'api-lead', payload: { service_type: 'vuokraus', moving_date, rental } }
 *   — päivä on toimituspäivä ja nouto lomakkeen arvio (pickupEstimate).
 * - Laskurin lisäpalvelu: { needsBoxRental, boxRentalCount, boxRentalDays } — toimitus arvioidaan viikko
 *   ennen muuttoa (enintään puolet vuokra-ajasta), nouto toimitus + vuokrapäivät.
 * Palauttaa null, jos liidillä ei ole laatikkovuokraa tai päivää ei voi päätellä.
 */
export function extractBoxRentalRequest(formData: Record<string, unknown>, requestedDate: Date | null): BoxRentalRequest | null {
  const payload = formData.kind === 'api-lead' ? asRecord(formData.payload) : null;

  if (payload && payload.service_type === 'vuokraus') {
    const rental = asRecord(payload.rental);
    const items = Array.isArray(rental?.items) ? rental.items : [];
    const boxLine = items.map(asRecord).find((item) => item?.id === BOX_ITEM_ID);
    const quantity = positiveInt(boxLine?.qty ?? payload.box_count);
    if (!quantity) return null;
    const days = positiveInt(boxLine?.days) ?? DEFAULT_DAYS;
    const movingDate = typeof payload.moving_date === 'string' ? payload.moving_date.slice(0, 10) : null;
    const deliveryKey = isDateKey(movingDate) ? movingDate : requestedDate ? dateToKey(requestedDate) : null;
    if (!deliveryKey) return null;
    const estimate = typeof rental?.pickupEstimate === 'string' ? rental.pickupEstimate.slice(0, 10) : null;
    const pickupKey = isDateKey(estimate) && estimate > deliveryKey ? estimate : addDaysToKey(deliveryKey, days);
    return { quantity, deliveryKey, pickupKey, source: 'vuokraus' };
  }

  const serviceType = formData.serviceType;
  if (formData.needsBoxRental === true && (serviceType === undefined || serviceType === 'moving')) {
    const quantity = positiveInt(formData.boxRentalCount);
    if (!quantity || !requestedDate) return null;
    const days = positiveInt(formData.boxRentalDays) ?? DEFAULT_DAYS;
    const moveKey = dateToKey(requestedDate);
    const deliveryKey = addDaysToKey(moveKey, -Math.min(MAX_DAYS_BEFORE_MOVE, Math.floor(days / 2)));
    return { quantity, deliveryKey, pickupKey: addDaysToKey(deliveryKey, days), source: 'muutto' };
  }

  return null;
}

// --- Saatavuus -----------------------------------------------------------------------------

export type InventoryRental = {
  id: string;
  leadId: string;
  customer: string;
  quantity: number;
  deliveryKey: string;
  pickupKey: string;
  datesEstimated: boolean;
  status: BoxRentalStatusKey;
  commitment: RentalCommitment;
  returnedQty: number | null;
  lostQty: number;
  notes: string | null;
};

type OccupancyRental = Pick<InventoryRental, 'id' | 'quantity' | 'deliveryKey' | 'pickupKey' | 'status' | 'commitment'>;

/**
 * Onko vuokraus pois varastosta annettuna päivänä. Toimitetut ovat poissa kunnes ne merkitään
 * noudetuiksi (myöhässä oleva nouto varaa laatikot tähän päivään asti), varatut toimitus–noutovälin.
 * Toimitettu lasketaan aina (laatikot ovat fyysisesti asiakkaalla), varattu vain jos liidi on vahvistettu
 * tai includeTentative on päällä.
 */
export function occupiesDay(r: OccupancyRental, dayKey: string, todayKey: string, includeTentative = false): boolean {
  if (r.status === 'DELIVERED') {
    const end = r.pickupKey < todayKey ? todayKey : r.pickupKey;
    return dayKey <= end && (dayKey >= r.deliveryKey || dayKey >= todayKey);
  }
  if (r.status !== 'RESERVED') return false;
  if (r.commitment === 'inactive' || (r.commitment === 'tentative' && !includeTentative)) return false;
  return dayKey >= r.deliveryKey && dayKey <= r.pickupKey;
}

export function occupancyOn(rentals: OccupancyRental[], dayKey: string, todayKey: string, includeTentative = false): number {
  return rentals.reduce((sum, r) => (occupiesDay(r, dayKey, todayKey, includeTentative) ? sum + r.quantity : sum), 0);
}

export type DayAvailability = { key: string; booked: number; tentative: number; free: number };

/** Päiväkohtainen saatavuus: vahvistetut varaavat, alustavat näytetään erikseen. */
export function availabilityByDay(total: number, rentals: OccupancyRental[], fromKey: string, days: number, todayKey: string): DayAvailability[] {
  return Array.from({ length: days }, (_, i) => {
    const key = addDaysToKey(fromKey, i);
    const booked = occupancyOn(rentals, key, todayKey);
    const tentative = occupancyOn(rentals, key, todayKey, true) - booked;
    return { key, booked, tentative, free: total - booked };
  });
}

/** Suurin vahvistettu käyttöaste välillä (alkaen aikaisintaan tänään). */
export function peakOccupancy(rentals: OccupancyRental[], fromKey: string, toKey: string, todayKey: string, excludeId?: string): number {
  const others = excludeId ? rentals.filter((r) => r.id !== excludeId) : rentals;
  let peak = 0;
  const start = fromKey < todayKey ? todayKey : fromKey;
  for (let key = start; key <= toKey; key = addDaysToKey(key, 1)) {
    peak = Math.max(peak, occupancyOn(others, key, todayKey));
  }
  return peak;
}

export type OverbookingCheck = { freeAtPeak: number; shortBy: number };

/** Riittävätkö laatikot vuokrauksen koko ajalle muiden vahvistettujen vuokrausten lisäksi. */
export function checkOverbooking(
  total: number,
  rentals: OccupancyRental[],
  candidate: { id?: string; quantity: number; deliveryKey: string; pickupKey: string },
  todayKey: string,
): OverbookingCheck {
  const freeAtPeak = total - peakOccupancy(rentals, candidate.deliveryKey, candidate.pickupKey, todayKey, candidate.id);
  return { freeAtPeak, shortBy: Math.max(0, candidate.quantity - freeAtPeak) };
}

export function overbookingMessage(check: OverbookingCheck, quantity: number): string | null {
  if (check.shortBy <= 0) return null;
  return `Laatikot eivät riitä: tilattu ${quantity} kpl, vapaana enintään ${Math.max(0, check.freeAtPeak)} kpl vuokra-ajalla (puuttuu ${check.shortBy}).`;
}

// --- Yhteenveto inventaariosivulle -----------------------------------------------------------

export type InventorySummary = {
  total: number;
  inStock: number;
  out: number;
  returningSoon: number;
  reserved: number;
  tentative: number;
  minFreeNext30: number;
  current: InventoryRental[];
  upcoming: InventoryRental[];
  tentativeList: InventoryRental[];
  returned: InventoryRental[];
  overduePickups: InventoryRental[];
  unmarkedDeliveries: InventoryRental[];
};

const byDelivery = (a: InventoryRental, b: InventoryRental) => a.deliveryKey.localeCompare(b.deliveryKey);
const byPickup = (a: InventoryRental, b: InventoryRental) => a.pickupKey.localeCompare(b.pickupKey);
const sum = (list: InventoryRental[]) => list.reduce((s, r) => s + r.quantity, 0);

export function summarizeInventory(total: number, rentals: InventoryRental[], todayKey: string): InventorySummary {
  const current = rentals.filter((r) => r.status === 'DELIVERED').sort(byPickup);
  const reservedAll = rentals.filter((r) => r.status === 'RESERVED');
  const upcoming = reservedAll.filter((r) => r.commitment === 'confirmed').sort(byDelivery);
  const tentativeList = reservedAll.filter((r) => r.commitment === 'tentative').sort(byDelivery);
  const soonKey = addDaysToKey(todayKey, RETURNING_SOON_DAYS);
  const out = sum(current);
  const next30 = availabilityByDay(total, rentals, todayKey, 30, todayKey);

  return {
    total,
    inStock: total - out,
    out,
    returningSoon: sum(current.filter((r) => r.pickupKey <= soonKey)),
    reserved: sum(upcoming),
    tentative: sum(tentativeList),
    minFreeNext30: Math.min(...next30.map((d) => d.free)),
    current,
    upcoming,
    tentativeList,
    returned: rentals
      .filter((r) => r.status === 'RETURNED')
      .sort((a, b) => b.pickupKey.localeCompare(a.pickupKey))
      .slice(0, 20),
    overduePickups: current.filter((r) => r.pickupKey < todayKey),
    unmarkedDeliveries: upcoming.filter((r) => r.deliveryKey < todayKey),
  };
}

/** Puuttuvat laatikot noudettaessa (palautettu < vuokrattu). */
export function lostOnReturn(quantity: number, returnedQty: number): number {
  return Math.max(0, quantity - Math.max(0, returnedQty));
}

/** YYYY-MM-DD → "ke 12.11." (päivä on jo Suomen päivä, joten muotoillaan UTC:nä). */
export function formatDateKey(key: string, withWeekday = true): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('fi-FI', {
    ...(withWeekday ? { weekday: 'short' as const } : {}),
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}
