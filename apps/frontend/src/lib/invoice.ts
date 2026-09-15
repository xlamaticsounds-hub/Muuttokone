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
