// Vuokrattavat tuotteet ja vuokrauksen hinnoittelu. Käyttäjät: Muuttolaatikot-sivu (/muuttolaatikot) ja sen
// tilauslomake, muuttolaskurin laatikkovuokra (calculator/boxRental.ts), käyttöehtojen hinnasto
// ja liidin yhteenveto. Kaikki hinnat sisältävät ALV 25,5 % kuten muukin hinnoittelu.
//
// UUDEN VUOKRATTAVAN LISÄÄMINEN (esim. tekstiilipesuri): lisää uusi olio RENTAL_ITEMS-taulukkoon.
// Muuttolaatikot-sivu, lomake, hinnanlasku, käyttöehtojen hinnasto ja liidin yhteenveto poimivat sen
// automaattisesti — muuta koodia ei tarvita. Esimerkki:
//
//   {
//     id: 'tekstiilipesuri',            // pysyvä tunniste (tallentuu liidille), älä vaihda myöhemmin
//     title: 'Tekstiilipesuri',
//     emoji: '🧽',
//     description: 'Sohvien, mattojen ja verhoilujen syväpesuun.',
//     details: ['Pesuaine mukana', 'Käyttöohje mukana'],
//     pricePerDay: 29,                  // € / kpl / vrk, sis. ALV
//     qty: { min: 1, max: 2, step: 1, default: 1 },
//     days: { min: 1, max: 7, default: 1, options: [1, 2, 3] },
//     lostFee: 400,                     // € / kpl jos kadonnut tai rikki (valinnainen)
//     selectedByDefault: false,
//     available: true,                  // false = piilotettu sivulta ja lomakkeelta
//     inStock: true,                    // false = 'tilapäisesti loppu' (sivulla ja hakukoneille)
//   },

export interface RentalItem {
  id: string;
  title: string;
  emoji: string;
  description: string;
  details: string[]; // luettelo tuotekortilla
  pricePerDay: number; // € / kpl / vuorokausi, sis. ALV
  qty: { min: number; max: number; step: number; default: number };
  days: { min: number; max: number; default: number; options: number[] };
  lostFee?: number; // € / kpl jos kadonnut tai rikki
  /** Pikavalinnat määrälle, esim. asunnon koon mukaan. */
  qtyHints?: { label: string; qty: number; apartmentSize?: string }[];
  selectedByDefault: boolean; // esivalittu sivun tilauslomakkeella
  available: boolean;
  // Saatavuus hakukoneille (schema.org availability) ja tuotekortin merkintä. false = tilapäisesti
  // loppu: sivu näyttää merkinnän ja Google näkee tuotteen loppuneeksi, pyyntöjä voi silti jättää.
  inStock: boolean;
}

// Toimitus ja nouto kotiovelle (pääkaupunkiseutu). Koskee koko tilausta, ei yksittäistä tuotetta.
export const RENTAL_DELIVERY = {
  feeBothWays: 39, // € — toimitus + nouto yhteensä
  freeFromRental: 100, // € — ilmainen, kun tilauksen vuokra on vähintään tämän verran
  freeWithMove: true, // ilmainen aina, kun vuokrataan muuton yhteydessä
} as const;

// Toimitusalue: pääkaupunkiseutu (Helsinki 00xxx, Vantaa 01xxx, Espoo ja Kauniainen 02xxx).
// Muualle toimituksesta sovitaan erikseen — lomake varoittaa mutta ei estä lähettämistä.
const DELIVERY_AREA_POSTAL_PREFIXES = ['00', '01', '02'];

export function isDeliveryAreaPostalCode(postalCode: string): boolean {
  const code = postalCode.trim();
  return /^\d{5}$/.test(code) && DELIVERY_AREA_POSTAL_PREFIXES.some((prefix) => code.startsWith(prefix));
}

export const BOX_ITEM_ID = 'muuttolaatikot';

export const RENTAL_ITEMS: RentalItem[] = [
  {
    id: BOX_ITEM_ID,
    title: 'Muuttolaatikot',
    emoji: '📦',
    description: 'Kestävät, pinottavat muuttolaatikot pakkaamiseen. Toimitamme kotiovelle ja noudamme tyhjinä muuton jälkeen.',
    details: ['Samanlaiset laatikot pinoutuvat siististi ja nopeuttavat lastausta', 'Ei pahvijätettä – palautat laatikot meille'],
    pricePerDay: 0.19,
    qty: { min: 20, max: 150, step: 5, default: 50 },
    days: { min: 7, max: 60, default: 14, options: [7, 14, 21, 28] },
    lostFee: 12,
    qtyHints: [
      { label: 'Yksiö', qty: 30, apartmentSize: '1h' },
      { label: 'Kaksio', qty: 50, apartmentSize: '2h' },
      { label: 'Kolmio', qty: 70, apartmentSize: '3h' },
      { label: 'Neliö tai isompi', qty: 90, apartmentSize: '4h+' },
    ],
    selectedByDefault: true,
    available: true,
    inStock: true,
  },
];

export function getRentalItem(id: string): RentalItem | undefined {
  return RENTAL_ITEMS.find((item) => item.id === id);
}

export function getAvailableRentalItems(): RentalItem[] {
  return RENTAL_ITEMS.filter((item) => item.available);
}

export interface RentalLineInput {
  itemId: string;
  qty: number;
  days: number;
}

export interface RentalLine {
  itemId: string;
  title: string;
  emoji: string;
  qty: number;
  days: number;
  pricePerDay: number;
  cost: number; // qty x days x pricePerDay
}

export interface RentalOrder {
  lines: RentalLine[];
  rentalCost: number;
  deliveryCost: number; // toimitus + nouto yhteensä
  deliveryFree: boolean;
  deliveryFreeReason: 'move' | 'amount' | null;
  /** Montako euroa lisää vuokraa tekisi toimituksesta ilmaisen; 0 jos jo ilmainen. */
  amountToFreeDelivery: number;
  total: number;
}

// Lasketaan sentteinä, jotta liukulukuvirheet eivät heilauta 100 €:n rajaa tai summia.
const toCents = (euros: number) => Math.round(euros * 100);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Laskee vuokratilauksen hinnan. Määrä ja vuokra-aika rajataan tuotteen sallittuun väliin
 * (esim. laatikoita vähintään 20 ja enintään 150); määrä 0 tai tuntematon/piilotettu tuote
 * jätetään pois. Palauttaa null jos tilauksessa ei ole yhtään rivejä.
 */
export function calculateRentalOrder(lines: RentalLineInput[], options: { withMove: boolean }): RentalOrder | null {
  const out: RentalLine[] = [];
  let rentalCents = 0;

  for (const input of lines) {
    const item = getRentalItem(input.itemId);
    if (!item || !item.available) continue;

    const rawQty = Math.round(Number(input.qty));
    if (!Number.isFinite(rawQty) || rawQty < 1) continue;
    const qty = clamp(rawQty, item.qty.min, item.qty.max);

    const rawDays = Math.round(Number(input.days));
    const days = clamp(Number.isFinite(rawDays) ? rawDays : item.days.default, item.days.min, item.days.max);

    const costCents = qty * days * toCents(item.pricePerDay);
    rentalCents += costCents;
    out.push({
      itemId: item.id,
      title: item.title,
      emoji: item.emoji,
      qty,
      days,
      pricePerDay: item.pricePerDay,
      cost: costCents / 100,
    });
  }

  if (out.length === 0) return null;

  const freeByMove = options.withMove && RENTAL_DELIVERY.freeWithMove;
  const freeByAmount = rentalCents >= toCents(RENTAL_DELIVERY.freeFromRental);
  const deliveryFree = freeByMove || freeByAmount;
  const deliveryCents = deliveryFree ? 0 : toCents(RENTAL_DELIVERY.feeBothWays);

  return {
    lines: out,
    rentalCost: rentalCents / 100,
    deliveryCost: deliveryCents / 100,
    deliveryFree,
    deliveryFreeReason: freeByMove ? 'move' : freeByAmount ? 'amount' : null,
    amountToFreeDelivery: deliveryFree ? 0 : (toCents(RENTAL_DELIVERY.freeFromRental) - rentalCents) / 100,
    total: (rentalCents + deliveryCents) / 100,
  };
}

export function formatEuro(value: number): string {
  return `${value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function formatPricePerDay(value: number): string {
  return `${value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function describeDelivery(order: Pick<RentalOrder, 'deliveryFree' | 'deliveryFreeReason' | 'deliveryCost'>): string {
  if (!order.deliveryFree) return formatEuro(order.deliveryCost);
  return order.deliveryFreeReason === 'move' ? 'ilmainen (muuton yhteydessä)' : `ilmainen (vuokra vähintään ${RENTAL_DELIVERY.freeFromRental} €)`;
}

/** Tilauksen rivit tekstinä liidin muistiinpanoihin, Discordiin ja hallintaan. */
export function describeRentalOrder(order: RentalOrder): string[] {
  return [
    ...order.lines.map(
      (line) =>
        `${line.emoji} ${line.title}: ${line.qty} kpl × ${line.days} vrk × ${formatPricePerDay(line.pricePerDay)} = ${formatEuro(line.cost)}`,
    ),
    `Toimitus ja nouto: ${describeDelivery(order)}`,
    `Yhteensä: ${formatEuro(order.total)}`,
  ];
}
