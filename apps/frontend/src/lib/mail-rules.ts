import type { LeadStatus } from '@prisma/client';
import { COMPLETED_STATUSES } from '@/lib/lead-status';

// Säännöt joilla AI saa (tai ei saa) muuttaa liidin tilaa sähköpostin perusteella. Tarkoituksella
// erillään IMAP- ja AI-koodista, jotta ne voi testata ja ne on helppo lukea yhdestä paikasta.

/** Sallitut automaattiset siirtymät. Kaikki muu on vain ehdotus ihmiselle. */
const AUTO_TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  NEW: ['PROPOSAL_SENT', 'WON', 'LOST'],
  SCHEDULED: ['PROPOSAL_SENT', 'WON', 'LOST'],
  QUALIFIED: ['PROPOSAL_SENT', 'WON', 'LOST'],
  CONTACTED: ['PROPOSAL_SENT', 'WON', 'LOST'],
  PROPOSAL_SENT: ['WON', 'LOST'],
  COMPLETED: ['PAID'],
  INVOICED: ['PAID'],
};

/**
 * Perumisen AI ehdottaa mutta ei tee itse (poistaa kalenterimerkinnän), eikä AI koskaan merkitse
 * keikkaa Tehdyksi (vaatii lopullisen hinnan) tai vie tilaa taaksepäin.
 */
export function canAutoTransition(from: LeadStatus, to: LeadStatus): boolean {
  return AUTO_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Saako tilanmuutosta ehdottaa ihmiselle? Kaikki automaattisesti sallitut siirtymät sekä peruminen
 * (WON/PROPOSAL_SENT -> CANCELLED). Taaksepäin ei ehdoteta koskaan: viesti ei kerro, että asia olisi peruttu.
 */
export function canSuggestTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (canAutoTransition(from, to)) return true;
  return to === 'CANCELLED' && (from === 'WON' || from === 'PROPOSAL_SENT');
}

/** Tilat joissa meidän lähettämä viesti voi vielä muuttaa tilaa (tarjous lähtee). Muualla tekoälyä ei tarvita. */
export const QUOTE_STAGE_STATUSES: LeadStatus[] = ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED'];

/** Onko tila sellainen, jossa liidi on yhä "työn alla" (viesti kohdistetaan ensisijaisesti tällaiseen). */
const OPEN_STATUSES: LeadStatus[] = ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'WON'];

export function pickLeadForEmail<T extends { status: LeadStatus; createdAt: Date }>(leads: T[]): T | null {
  if (leads.length === 0) return null;
  const newestFirst = [...leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    newestFirst.find((l) => OPEN_STATUSES.includes(l.status)) ??
    newestFirst.find((l) => (COMPLETED_STATUSES as LeadStatus[]).includes(l.status)) ??
    newestFirst[0]
  );
}

/** ukko.fi-kirjanpitopalvelun lähettäjä (myös aliverkkotunnukset, esim. mail.ukko.fi). */
export function isUkkoSender(address: string | null | undefined): boolean {
  if (!address) return false;
  const domain = address.toLowerCase().split('@').pop() ?? '';
  return domain === 'ukko.fi' || domain.endsWith('.ukko.fi');
}

/** Sama summa 1 euron tarkkuudella (pyöristykset, senttierot). */
export function amountsMatch(a: number | null | undefined, b: number | null | undefined, tolerance = 1): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tolerance;
}

export function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // ä -> a, ö -> o: nimet voivat tulla eri kirjoitusasuilla
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kaikki nimen osat löytyvät toisesta nimestä (järjestyksellä ei ole väliä: "Meikäläinen Matti"). */
export function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = normalizeName(a).split(' ').filter(Boolean);
  const tb = normalizeName(b).split(' ').filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return false;
  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return small.every((part) => large.includes(part));
}

/** Lähettäjät joiden viestejä ei lähetetä AI:lle (automaattiviestit, uutiskirjeet). */
export function isAutomatedSender(address: string | null | undefined): boolean {
  if (!address) return true;
  return /(^|[._-])(no-?reply|noreply|donotreply|mailer-daemon|postmaster|notifications?)([._-]|@)/i.test(address.toLowerCase());
}

export type UkkoPayment = { invoiceNumber: string; customerName: string | null; amount: number | null };

/**
 * ukko.fi:n maksuilmoitus: aihe "Laskullesi 123 on tullut maksu", teksti "Myyntilaskullesi 123 on
 * tullut maksu. Laskun vastaanottaja: Matti Meikäläinen Maksettu summa: 169.00". Numero on ukon
 * oma laskunumero (ei hallintapaneelin Invoice-numero), joten kohdistus tehdään nimellä ja summalla.
 */
export function parseUkkoPayment(subject: string, text: string): UkkoPayment | null {
  const num = /(?:myyntilasku|lasku)\w*\s+(\d+)\s+on\s+tullut\s+maksu/i.exec(`${subject}\n${text}`);
  if (!num) return null;
  const name = /Laskun\s+vastaanottaja:\s*([\s\S]+?)\s*(?:Maksettu\s+summa|Yst[aä]v[aä]llisin|$)/i.exec(text);
  const amount = /Maksettu\s+summa:\s*([\d\s.,]+)/i.exec(text);
  const parsedAmount = amount ? Number(amount[1].replace(/\s/g, '').replace(',', '.')) : NaN;
  return {
    invoiceNumber: num[1],
    customerName: name ? name[1].trim() || null : null,
    amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
  };
}

/** HTML-viesti tekstiksi (ukon ilmoituksilla ei ole text/plain-osaa). */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&aring;/g, 'å')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
