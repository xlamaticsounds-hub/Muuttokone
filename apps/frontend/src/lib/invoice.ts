export type InvoiceLineItem = {
  description: string;
  amount: number; // sis. alv (bruttohinta)
  vatRate: number; // 0.255 tai 0
};

export function computeInvoiceTotals(items: InvoiceLineItem[]) {
  return items.reduce(
    (acc, item) => {
      const net = item.amount / (1 + item.vatRate);
      const vat = item.amount - net;
      return { net: acc.net + net, vat: acc.vat + vat, gross: acc.gross + item.amount };
    },
    { net: 0, vat: 0, gross: 0 },
  );
}

export type AddressParts = {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
};

// Sama osoitemuoto kaikkialla laskulla: "Katu 1, 00100 Helsinki".
export function formatAddress(parts: AddressParts): string | null {
  const postalAndCity = [parts.postalCode, parts.city].filter(Boolean).join(' ');
  const lines = [parts.street, postalAndCity].filter(Boolean);
  return lines.length > 0 ? lines.join(', ') : null;
}

export function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Invoice.items on Prisma Json-kenttä, joten sen muoto pitää tarkistaa ajossa
// (ei ole tyyppiturvallinen tietokannassa) — sama varovaisuus kuin Lead.formData:ssa.
export function parseInvoiceItems(json: unknown): InvoiceLineItem[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      description: typeof item.description === 'string' ? item.description : '',
      amount: typeof item.amount === 'number' ? item.amount : 0,
      vatRate: typeof item.vatRate === 'number' ? item.vatRate : 0,
    }));
}

// Viivästyskorkorivi erääntyneelle laskulle. Yhteinen palvelimelle (createLateFeeInvoice) ja
// esikatselulle (LateFeeModal), jotta esikatselussa näkyvä rivi on täsmälleen sama kuin se,
// joka laskulle tallennetaan. Korko on yksinkertainen (ei korkoa korolle) päiväkohtainen korko
// alkuperäisen laskun loppusummalle: pääoma × (vuosikorko/100) × päivät/365 — korkolain
// (633/1982) 4 §:n mukainen laskentatapa.
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LATE_FEE_PREFIX = 'Viivästyskorko ';
const REMINDER_FEE_DESCRIPTION = 'Muistutusmaksu';

// Montako täyttä päivää eräpäivästä on kulunut. Eräpäivänä itsenään lasku ei ole vielä
// myöhässä (0), vaan vasta seuraavana päivänä (1).
export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - dueDate.getTime()) / MS_PER_DAY);
}

// Laskut joita asiakas vielä on velkaa (ei luonnos, ei maksettu, ei korvattu muistutuksella).
const OPEN_STATUSES = ['SENT', 'UNPAID', 'OVERDUE'];

// Myöhässä = avoin lasku jonka eräpäivästä on kulunut vähintään yksi päivä.
export function isInvoiceOverdue(status: string, dueDate: Date | null, now: Date = new Date()): boolean {
  return OPEN_STATUSES.includes(status) && !!dueDate && daysOverdue(dueDate, now) >= 1;
}

export function isLateFeeItem(item: InvoiceLineItem): boolean {
  return item.vatRate === 0 && item.description.startsWith(LATE_FEE_PREFIX);
}

export function isReminderFeeItem(item: InvoiceLineItem): boolean {
  return item.vatRate === 0 && item.description === REMINDER_FEE_DESCRIPTION;
}

// Kiinteä muistutusmaksu (esim. 5 €, perintälain 10 c §:n kuluttajakatto) — ei
// arvonlisäverollinen, samasta syystä kuin viivästyskorko (AVL 78 §).
export function buildReminderFeeItem(amount: number): InvoiceLineItem {
  return { description: REMINDER_FEE_DESCRIPTION, amount, vatRate: 0 };
}

export function buildLateFeeItem(params: {
  items: InvoiceLineItem[];
  dueDate: Date;
  ratePercent: number;
  invoiceNumber: number;
  now?: Date;
}): { item: InvoiceLineItem; days: number; amount: number } {
  const { items, dueDate, ratePercent, invoiceNumber, now = new Date() } = params;
  const days = daysOverdue(dueDate, now);
  // Aiemman muistutuksen viivästyskorko- ja muistutusmaksurivit eivät kasvata pääomaa —
  // ei korkoa korolle eikä korkoa maksulle.
  const principal = items
    .filter((item) => !isLateFeeItem(item) && !isReminderFeeItem(item))
    .reduce((sum, item) => sum + item.amount, 0);
  const amount = Math.round(principal * (ratePercent / 100) * (days / 365) * 100) / 100;
  const dueDateFi = dueDate.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    item: {
      description: `${LATE_FEE_PREFIX}${ratePercent.toLocaleString('fi-FI')} % p.a., ${days} pv (alkuperäinen eräpäivä ${dueDateFi}, lasku #${invoiceNumber})`,
      amount,
      vatRate: 0, // Viivästyskorko ei ole arvonlisäverollista (AVL 78 §).
    },
    days,
    amount,
  };
}
