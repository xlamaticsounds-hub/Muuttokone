// Yleinen tarjous- ja tilausvahvistuspohja muualta tulleille keikoille (puhelu, WhatsApp,
// Muuttomaailma ym.). Toisin kuin muuttolaskurin tarjouksessa, tässä ei ole tavaraluetteloa:
// vain palvelun kuvaus ja hintarivit. Puhtaat säännöt (oletukset, tarkistus, summat, numerointi),
// jotta ne voi testata. Käyttäjät: server/offer-actions.ts, server/pdf/offer-pdf.tsx,
// server/external-lead.ts ja hallinnan sivut liidit/uusi ja liidit/[id]/tarjous.

export type OfferType = 'tarjous' | 'vahvistus';

export const OFFER_TYPES: { id: OfferType; label: string; title: string }[] = [
  { id: 'tarjous', label: 'Tarjous', title: 'Tarjous' },
  { id: 'vahvistus', label: 'Vahvistus', title: 'Tilausvahvistus' },
];

/**
 * Muuttokone laskuttaa toistaiseksi ilman arvonlisäveroa (alle ALV-rajan). Kun ALV-velvollisuus
 * alkaa, vaihda oletukseksi 0.255. Rivikohtaisen ALV:n voi valita lomakkeella joka tapauksessa.
 */
export const DEFAULT_OFFER_VAT_RATE = 0;
export const OFFER_VAT_RATES = [0, 0.255] as const;
export const DEFAULT_VALID_DAYS = 14;
export const MAX_OFFER_LINES = 12;
export const MAX_OFFER_AMOUNT = 100_000;

export const OFFER_LIMITS = {
  name: 120,
  email: 160,
  phone: 40,
  address: 200,
  time: 80,
  description: 2000,
  lineLabel: 160,
  priceNote: 600,
  notes: 2000,
  terms: 2000,
} as const;

/** Julkaistuista käyttöehdoista (muuttokone.fi/kayttoehdot, kohdat 3 ja 5). Muokattavissa dokumenttikohtaisesti. */
export const DEFAULT_OFFER_TERMS =
  'Palveluun sovelletaan Muuttokone.fi:n käyttöehtoja (muuttokone.fi/kayttoehdot). Maksuehto 14 päivää netto, ellei toisin sovita. ' +
  'Peruutus on tehtävä viimeistään 48 tuntia ennen sovittua ajankohtaa; myöhemmin peruutetuista tilauksista veloitetaan 50 % sovitusta hinnasta.';

export const DEFAULT_OFFER_DESCRIPTION = 'Muuttopalvelu sovitun mukaisesti: tavaroiden kantaminen ja kuljetus.';

export type OfferLine = { label: string; amount: number; vatRate: number };

export type OfferData = {
  type: OfferType;
  issuedOn: string; // YYYY-MM-DD
  validUntil: string | null; // vain tarjouksella
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceDate: string | null; // YYYY-MM-DD
  serviceTime: string | null; // vapaa teksti, esim. "klo 9.00" tai "aamupäivä"
  fromAddress: string | null;
  toAddress: string | null;
  description: string;
  lines: OfferLine[];
  priceNote: string | null; // esim. tuntihinnan ehdot
  notes: string | null; // lisätiedot asiakkaalle
  terms: string;
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "2026-11-08" -> "8.11.2026" (ei aikavyöhykettä: päivä on kalenteripäivä). */
export function formatIsoDateFi(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}.${m}.${y}`;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

const roundCents = (n: number) => Math.round(n * 100) / 100;

const clip = (value: unknown, max: number): string | null => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, max) : null;
};

/** Summa lomakkeelta: hyväksyy luvun tai tekstin ("1 250,50"). NaN jos ei kelpaa. */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const s = value.replace(/[\s€]/g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}

export function offerTotals(lines: OfferLine[]): { net: number; vat: number; gross: number } {
  const totals = lines.reduce(
    (acc, line) => {
      const net = line.amount / (1 + line.vatRate);
      return { net: acc.net + net, vat: acc.vat + (line.amount - net), gross: acc.gross + line.amount };
    },
    { net: 0, vat: 0, gross: 0 },
  );
  return { net: roundCents(totals.net), vat: roundCents(totals.vat), gross: roundCents(totals.gross) };
}

export function offerTitle(type: OfferType): string {
  return type === 'vahvistus' ? 'Tilausvahvistus' : 'Tarjous';
}

/** Dokumentin numero, esim. "2026-K4F7QD": vuosi ja liidin tunnisteen loppu (cuid:n satunnainen osa). */
export function offerNumber(leadId: string, issuedOn: string): string {
  const tail = leadId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'X';
  return `${issuedOn.slice(0, 4)}-${tail}`;
}

export function offerFileName(type: OfferType, number: string): string {
  return `${type === 'vahvistus' ? 'tilausvahvistus' : 'tarjous'}-${number}.pdf`;
}

type NormalizeResult = { ok: true; value: OfferData } | { ok: false; message: string };

/** Tarkistaa ja siistii dokumentin tiedot (lomakkeelta tai tietokannasta). */
export function normalizeOffer(input: unknown, todayIso: string): NormalizeResult {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const type: OfferType = o.type === 'vahvistus' ? 'vahvistus' : 'tarjous';

  const customerName = clip(o.customerName, OFFER_LIMITS.name);
  if (!customerName) return { ok: false, message: 'Asiakkaan nimi puuttuu.' };
  const customerEmail = clip(o.customerEmail, OFFER_LIMITS.email);
  if (customerEmail && !isValidEmail(customerEmail)) return { ok: false, message: 'Sähköpostiosoite ei kelpaa.' };

  const issuedOn = isIsoDate(o.issuedOn) ? o.issuedOn : todayIso;
  let serviceDate: string | null = null;
  if (o.serviceDate != null && o.serviceDate !== '') {
    if (!isIsoDate(o.serviceDate)) return { ok: false, message: 'Keikan päivämäärä ei kelpaa.' };
    serviceDate = o.serviceDate;
  }
  let validUntil: string | null = null;
  if (type === 'tarjous') {
    validUntil = isIsoDate(o.validUntil) ? o.validUntil : addDaysIso(issuedOn, DEFAULT_VALID_DAYS);
    if (validUntil < issuedOn) return { ok: false, message: 'Tarjouksen voimassaolo ei voi päättyä ennen tarjouspäivää.' };
  }

  const rawLines = Array.isArray(o.lines) ? o.lines : [];
  const lines: OfferLine[] = [];
  for (const raw of rawLines) {
    const l = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const label = clip(l.label, OFFER_LIMITS.lineLabel);
    const amount = parseAmount(l.amount);
    const emptyAmount = l.amount == null || l.amount === '' || (typeof l.amount === 'number' && l.amount === 0);
    if (!label && emptyAmount) continue; // tyhjä rivi
    if (!label) return { ok: false, message: 'Anna jokaiselle hintariville selite.' };
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_OFFER_AMOUNT) {
      return { ok: false, message: `Hintarivin "${label}" summa puuttuu tai ei kelpaa.` };
    }
    const vatRate = (OFFER_VAT_RATES as readonly number[]).includes(l.vatRate as number) ? (l.vatRate as number) : DEFAULT_OFFER_VAT_RATE;
    lines.push({ label, amount: roundCents(amount), vatRate });
  }
  if (lines.length > MAX_OFFER_LINES) return { ok: false, message: `Hintarivejä voi olla enintään ${MAX_OFFER_LINES}.` };

  const description = clip(o.description, OFFER_LIMITS.description) ?? '';
  const priceNote = clip(o.priceNote, OFFER_LIMITS.priceNote);
  if (!description && lines.length === 0 && !priceNote) {
    return { ok: false, message: 'Kirjoita palvelun kuvaus ja hinta.' };
  }

  return {
    ok: true,
    value: {
      type,
      issuedOn,
      validUntil,
      customerName,
      customerEmail,
      customerPhone: clip(o.customerPhone, OFFER_LIMITS.phone),
      serviceDate,
      serviceTime: clip(o.serviceTime, OFFER_LIMITS.time),
      fromAddress: clip(o.fromAddress, OFFER_LIMITS.address),
      toAddress: clip(o.toAddress, OFFER_LIMITS.address),
      description,
      lines,
      priceNote,
      notes: clip(o.notes, OFFER_LIMITS.notes),
      // Tyhjäksi tyhjennetyt ehdot ovat käyttäjän valinta; puuttuvat (vanha tallenne) saavat oletuksen
      terms: typeof o.terms === 'string' ? o.terms.trim().slice(0, OFFER_LIMITS.terms) : DEFAULT_OFFER_TERMS,
    },
  };
}

/** Liidiin tallennettu dokumentti (formData.offer), tai null jos sitä ei ole tai se ei kelpaa. */
export function parseStoredOffer(value: unknown, todayIso: string): OfferData | null {
  if (!value || typeof value !== 'object') return null;
  const result = normalizeOffer(value, todayIso);
  return result.ok ? result.value : null;
}

/** Uusi dokumentti liidin tiedoista. Hinta tulee kutsujalta (vahvistettu tai laskurin hinta). */
export function buildDefaultOffer(
  input: {
    type?: OfferType;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    serviceDate: string | null;
    serviceTime: string | null;
    fromAddress: string | null;
    toAddress: string | null;
    price: number | null;
    description?: string | null;
  },
  todayIso: string,
): OfferData {
  const type = input.type ?? 'tarjous';
  return {
    type,
    issuedOn: todayIso,
    validUntil: type === 'tarjous' ? addDaysIso(todayIso, DEFAULT_VALID_DAYS) : null,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    serviceDate: input.serviceDate,
    serviceTime: input.serviceTime,
    fromAddress: input.fromAddress,
    toAddress: input.toAddress,
    description: input.description?.trim() || DEFAULT_OFFER_DESCRIPTION,
    lines: input.price != null && input.price > 0 ? [{ label: 'Muuttopalvelu', amount: roundCents(input.price), vatRate: DEFAULT_OFFER_VAT_RATE }] : [],
    priceNote: null,
    notes: null,
    terms: DEFAULT_OFFER_TERMS,
  };
}
