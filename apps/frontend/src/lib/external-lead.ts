import type { LeadSource } from '@prisma/client';
import { addDaysIso, isIsoDate, isValidEmail, normalizeOffer, type OfferData } from '@/lib/offer';

// Muualta tulleen keikan kirjaus (puhelu, WhatsApp, Muuttomaailma ym.): lähteet ja tekoälyn
// keskustelusta poimimien tietojen siistiminen. Tekoäly voi palauttaa mitä tahansa, joten kaikki
// tarkistetaan ennen kuin se näytetään lomakkeella. Käyttäjät: server/external-lead.ts ja
// hallinta/liidit/uusi.

export const EXTERNAL_SOURCES: { id: string; label: string; leadSource: LeadSource }[] = [
  { id: 'puhelu', label: 'Puhelu', leadSource: 'PHONE' },
  { id: 'whatsapp', label: 'WhatsApp / tekstiviesti', leadSource: 'OTHER' },
  { id: 'sahkoposti', label: 'Sähköposti', leadSource: 'EMAIL' },
  { id: 'muuttomaailma', label: 'Muuttomaailma', leadSource: 'OTHER' },
  { id: 'some', label: 'Facebook / Instagram', leadSource: 'OTHER' },
  { id: 'suositus', label: 'Suositus', leadSource: 'REFERRAL' },
  { id: 'muu', label: 'Muu', leadSource: 'OTHER' },
];

export const EXTERNAL_SOURCE_IDS = EXTERNAL_SOURCES.map((s) => s.id) as [string, ...string[]];
export const DEFAULT_EXTERNAL_SOURCE = 'puhelu';

export function isExternalSourceId(value: unknown): value is string {
  return typeof value === 'string' && EXTERNAL_SOURCES.some((s) => s.id === value);
}

export function externalSourceLabel(id: unknown): string | null {
  return EXTERNAL_SOURCES.find((s) => s.id === id)?.label ?? null;
}

export function leadSourceFor(id: string): LeadSource {
  return EXTERNAL_SOURCES.find((s) => s.id === id)?.leadSource ?? 'OTHER';
}

export type PriceKind = 'fixed' | 'hourly' | 'unknown';

export type ExtractedLead = {
  customerName: string | null;
  phone: string | null;
  email: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null;
  description: string | null;
  priceKind: PriceKind;
  priceAmount: number | null;
  hourlyRate: number | null;
  minHours: number | null;
  crewSize: number | null;
  agreed: boolean; // asiakas on jo hyväksynyt keikan
  source: string | null;
  summary: string | null;
  uncertainties: string[];
};

export const EMPTY_EXTRACTION: ExtractedLead = {
  customerName: null,
  phone: null,
  email: null,
  fromAddress: null,
  toAddress: null,
  date: null,
  time: null,
  description: null,
  priceKind: 'unknown',
  priceAmount: null,
  hourlyRate: null,
  minHours: null,
  crewSize: null,
  agreed: false,
  source: null,
  summary: null,
  uncertainties: [],
};

const clip = (value: unknown, max: number): string | null => {
  const s = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return s ? s.slice(0, max) : null;
};

const clipMultiline = (value: unknown, max: number): string | null => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, max) : null;
};

const numberIn = (value: unknown, min: number, max: number): number | null => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.').replace(/[\s€]/g, '')) : NaN;
  return Number.isFinite(n) && n > min && n <= max ? Math.round(n * 100) / 100 : null;
};

/** Puhelinnumero: vain numerot, välilyönnit, viivat ja alun +. Vähintään 6 numeroa. */
export function cleanPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.replace(/[^\d+\s-]/g, '').replace(/(?!^)\+/g, '').replace(/\s+/g, ' ').trim();
  return s.replace(/\D/g, '').length >= 6 ? s.slice(0, 40) : null;
}

/** "Matti Meikäläinen" -> etunimi ja loput sukunimeksi. Yksittäinen sana on etunimi. */
export function splitName(full: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(' ') : null };
}

/** Tekoälyn vastaus lomakkeelle kelpaavaksi. Epäilyttävät arvot jätetään tyhjiksi ja kirjataan tarkistettaviksi. */
export function normalizeExtraction(raw: unknown, todayIso: string): ExtractedLead {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const uncertainties = Array.isArray(r.uncertainties)
    ? r.uncertainties.map((u) => clip(u, 200)).filter((u): u is string => Boolean(u)).slice(0, 8)
    : [];

  let date: string | null = null;
  if (r.date != null && r.date !== '') {
    // Keikka voi olla jo tehty (kirjataan jälkikäteen) tai tulossa, mutta ei vuosien päässä
    if (isIsoDate(r.date) && r.date >= addDaysIso(todayIso, -60) && r.date <= addDaysIso(todayIso, 400)) date = r.date;
    else uncertainties.push('Päivämäärää ei voitu tulkita varmasti, tarkista se.');
  }

  const email = clip(r.email, 160);
  const priceKind: PriceKind = r.priceKind === 'fixed' || r.priceKind === 'hourly' ? r.priceKind : 'unknown';
  const crew = numberIn(r.crewSize, 0, 10);

  return {
    customerName: clip(r.customerName, 120),
    phone: cleanPhone(r.phone),
    email: email && isValidEmail(email) ? email : null,
    fromAddress: clip(r.fromAddress, 200),
    toAddress: clip(r.toAddress, 200),
    date,
    time: clip(r.time, 80),
    description: clipMultiline(r.description, 2000),
    priceKind,
    priceAmount: numberIn(r.priceAmount, 0, 50_000),
    hourlyRate: numberIn(r.hourlyRate, 0, 1000),
    minHours: numberIn(r.minHours, 0, 24),
    crewSize: crew != null ? Math.round(crew) : null,
    agreed: r.agreed === true,
    source: isExternalSourceId(r.source) ? r.source : null,
    summary: clipMultiline(r.summary, 1500),
    uncertainties,
  };
}

export type DraftLine = { label: string; amount: number | null };

const euro = (value: number) => value.toLocaleString('fi-FI', { maximumFractionDigits: 2 });

/** Hintarivit ja hinnoittelun lisätieto tekoälyn tulkinnasta (lomakkeen esitäyttö). */
export function priceDraftFromExtraction(e: ExtractedLead): { lines: DraftLine[]; priceNote: string | null } {
  const label = e.crewSize ? `Muuttopalvelu (${e.crewSize} henkilöä)` : 'Muuttopalvelu';
  if (e.priceKind === 'hourly' && e.hourlyRate != null) {
    const min = e.minHours != null ? `, vähimmäisveloitus ${euro(e.minHours)} h` : '';
    return {
      lines: [],
      priceNote: `Tuntihinta ${euro(e.hourlyRate)} €/h${min}. Lopullinen hinta määräytyy toteutuneen työajan mukaan.`,
    };
  }
  return { lines: [{ label, amount: e.priceAmount }], priceNote: null };
}

/** Tila johon muualta tullut keikka kirjataan. */
export const EXTERNAL_LEAD_STATUSES = [
  { id: 'NEW', label: 'Uusi (tarjousta ei vielä annettu)' },
  { id: 'PROPOSAL_SENT', label: 'Tarjous annettu, odottaa vastausta' },
  { id: 'WON', label: 'Vahvistettu (kalenteriin)' },
] as const;
export type ExternalLeadStatus = (typeof EXTERNAL_LEAD_STATUSES)[number]['id'];

export type ExternalLeadInput = {
  customerName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  date: string | null;
  time: string | null;
  source: string;
  sourceDetail: string | null;
  status: ExternalLeadStatus;
  conversationNotes: string | null;
  summary: string | null;
  offer: OfferData;
};

/**
 * Lomakkeelta tuleva keikka tarkistettuna. Asiakkaan ja keikan tiedot kopioidaan myös
 * tarjousdokumenttiin, jotta liidi ja dokumentti alkavat samoista tiedoista.
 */
export function normalizeExternalLeadInput(raw: unknown, todayIso: string): { ok: true; value: ExternalLeadInput } | { ok: false; message: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const customerName = clip(r.customerName, 120);
  if (!customerName) return { ok: false, message: 'Asiakkaan nimi puuttuu.' };
  const email = clip(r.email, 160);
  if (email && !isValidEmail(email)) return { ok: false, message: 'Sähköpostiosoite ei kelpaa.' };
  const phone = r.phone == null || r.phone === '' ? null : cleanPhone(r.phone);
  if (r.phone && !phone) return { ok: false, message: 'Puhelinnumero ei kelpaa.' };
  let date: string | null = null;
  if (r.date != null && r.date !== '') {
    if (!isIsoDate(r.date)) return { ok: false, message: 'Päivämäärä ei kelpaa.' };
    date = r.date;
  }
  const status = EXTERNAL_LEAD_STATUSES.some((s) => s.id === r.status) ? (r.status as ExternalLeadStatus) : 'PROPOSAL_SENT';
  const source = isExternalSourceId(r.source) ? r.source : DEFAULT_EXTERNAL_SOURCE;
  const fromAddress = clip(r.fromAddress, 200);
  const toAddress = clip(r.toAddress, 200);
  const time = clip(r.time, 80);

  const offerRaw = (r.offer && typeof r.offer === 'object' ? r.offer : {}) as Record<string, unknown>;
  const offer = normalizeOffer(
    { ...offerRaw, customerName, customerEmail: email, customerPhone: phone, serviceDate: date, serviceTime: time, fromAddress, toAddress },
    todayIso,
  );
  if (!offer.ok) return offer;

  const { firstName, lastName } = splitName(customerName);
  return {
    ok: true,
    value: {
      customerName,
      firstName,
      lastName,
      phone,
      email,
      fromAddress,
      toAddress,
      date,
      time,
      source,
      sourceDetail: clip(r.sourceDetail, 120),
      status,
      conversationNotes: clipMultiline(r.conversationNotes, 10_000),
      summary: clipMultiline(r.summary, 1500),
      offer: offer.value,
    },
  };
}

/** Vahvistettu hinta liidille (formData.confirmedPrice): kokonaiset eurot ilman desimaaleja, muuten "443,20". */
export function confirmedPriceText(total: number): string {
  return Number.isInteger(total) ? String(total) : total.toFixed(2).replace('.', ',');
}
