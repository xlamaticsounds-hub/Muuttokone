import type { LeadStatus } from '@prisma/client';
import { FOLLOW_UP_AFTER_DAYS, NOT_INVOICED_AFTER_DAYS, UNPAID_AFTER_DAYS } from '@/lib/ai-todo-rules';

// Pipeline-näkymän säännöt: sarakkeet, seuraava vaihe, järjestys ja AI-merkit. Puhtaita funktioita,
// jotta ne voi testata ilman tietokantaa.

/** Sarakkeet vasemmalta oikealle (avoimet ensin, suljetut viimeisinä). */
export const PIPELINE_STAGES: LeadStatus[] = ['NEW', 'SCHEDULED', 'PROPOSAL_SENT', 'WON', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'LOST'];

/** Suljetut vaiheet kasvavat ajan mittaan, joten niistä näytetään vain tuoreimmat. */
export const CLOSED_STAGES: LeadStatus[] = ['PAID', 'CANCELLED', 'LOST'];

/** Mihin sarakkeeseen tila kuuluu. Käytöstä poistuneet tilat eivät saa hävitä listalta; arkistoidut eivät näy. */
export function stageFor(status: LeadStatus): LeadStatus | null {
  switch (status) {
    case 'QUALIFIED':
      return 'NEW';
    case 'CONTACTED':
      return 'PROPOSAL_SENT';
    case 'ARCHIVED':
      return null;
    default:
      return status;
  }
}

/** Seuraava vaihe "Siirrä eteenpäin" -napille. Uusi varaus (laskurin varaus) vahvistetaan suoraan voitetuksi. */
export function nextStage(status: LeadStatus): LeadStatus | null {
  switch (status) {
    case 'NEW':
    case 'QUALIFIED':
    case 'CONTACTED':
      return 'PROPOSAL_SENT';
    case 'SCHEDULED':
      return 'WON';
    case 'PROPOSAL_SENT':
      return 'WON';
    case 'WON':
      return 'COMPLETED'; // vaatii lopullisen hinnan (dialogi)
    case 'COMPLETED':
      return 'INVOICED';
    case 'INVOICED':
      return 'PAID';
    default:
      return null;
  }
}

/** Onko liidi jäänyt vaiheeseensa odottamaan liian pitkäksi aikaa? (samat rajat kuin Huomio-lista) */
export function stageAgeWarning(status: LeadStatus, ageDays: number): boolean {
  switch (status) {
    case 'NEW':
    case 'SCHEDULED':
      return ageDays >= 1; // uuteen pyyntöön pitää vastata nopeasti
    case 'PROPOSAL_SENT':
      return ageDays >= FOLLOW_UP_AFTER_DAYS;
    case 'COMPLETED':
      return ageDays >= NOT_INVOICED_AFTER_DAYS;
    case 'INVOICED':
      return ageDays >= UNPAID_AFTER_DAYS;
    default:
      return false;
  }
}

export type SortableCard = { createdTs: number; updatedTs: number; moveTs: number | null };

/**
 * Korttien järjestys sarakkeessa: ylimpänä se mikä vaatii seuraavaksi toimia.
 * Uudet: tuorein ensin. Tarjous/tehty/laskutettu: pisimpään odottanut ensin. Voitettu: lähin muuttopäivä
 * ensin (päivättömät viimeisinä). Suljetut: tuorein ensin.
 */
export function sortStageCards<T extends SortableCard>(stage: LeadStatus, cards: T[]): T[] {
  const copy = [...cards];
  switch (stage) {
    case 'NEW':
    case 'SCHEDULED':
      return copy.sort((a, b) => b.createdTs - a.createdTs);
    case 'PROPOSAL_SENT':
    case 'COMPLETED':
    case 'INVOICED':
      return copy.sort((a, b) => a.updatedTs - b.updatedTs);
    case 'WON':
      return copy.sort((a, b) => (a.moveTs ?? Infinity) - (b.moveTs ?? Infinity) || a.updatedTs - b.updatedTs);
    default:
      return copy.sort((a, b) => b.updatedTs - a.updatedTs);
  }
}

// ---------- Sähköpostista johdettu tieto kortille ----------

export type MailEventLike = { kind: string; receivedAt: Date; analysis: unknown };

export type LastMail = {
  direction: 'in' | 'out'; // in = asiakas kirjoitti, out = me kirjoitimme
  daysAgo: number;
  summary: string | null; // tekoälyn yhden lauseen tiivistelmä (jos viesti on analysoitu)
  unanswered: boolean; // asiakkaan viimeiseen asialliseen viestiin ei ole vastattu
};

const DAY_MS = 86_400_000;
const intentOf = (analysis: unknown): string | null => {
  const intent = (analysis as { intent?: unknown } | null)?.intent;
  return typeof intent === 'string' ? intent : null;
};
const summaryOf = (analysis: unknown): string | null => {
  const summary = (analysis as { summary?: unknown } | null)?.summary;
  return typeof summary === 'string' && summary.trim() ? summary.trim() : null;
};

/** Liidin viimeisin asiakasviesti (sisään tai ulos) ja onko asiakkaan viestiin vastattu. */
export function summarizeMail(events: MailEventLike[], now: Date): LastMail | null {
  const relevant = events.filter((e) => e.kind === 'customer_inbound' || e.kind === 'customer_outbound');
  if (relevant.length === 0) return null;
  const sorted = [...relevant].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  const last = sorted[0];

  const lastInbound = sorted.find((e) => e.kind === 'customer_inbound');
  const substantive = lastInbound ? ['accepts_quote', 'declines_quote', 'cancels_booking', 'reschedule_request', 'question'].includes(intentOf(lastInbound.analysis) ?? '') : false;
  const answered = lastInbound ? sorted.some((e) => e.kind === 'customer_outbound' && e.receivedAt > lastInbound.receivedAt) : true;

  return {
    direction: last.kind === 'customer_inbound' ? 'in' : 'out',
    daysAgo: Math.max(0, Math.floor((now.getTime() - last.receivedAt.getTime()) / DAY_MS)),
    summary: summaryOf(last.analysis),
    unanswered: Boolean(lastInbound) && substantive && !answered,
  };
}

export function formatDaysAgo(days: number): string {
  if (days <= 0) return 'tänään';
  if (days === 1) return 'eilen';
  return `${days} pv sitten`;
}

/** Huomio-tyypin lyhyt merkkiteksti kortille (status_suggestion näytetään omana "Hyväksy"-rivinään). */
export function todoBadge(type: string): string | null {
  switch (type) {
    case 'needs_reply':
      return '✉ Vastaa asiakkaalle';
    case 'follow_up':
      return '⏰ Seuraa tarjousta';
    case 'not_invoiced':
      return '🧾 Muista laskuttaa';
    case 'unpaid':
      return '💶 Maksua ei ole tullut';
    case 'payment_needs_completion':
      return '💶 Maksu tullut — merkitse Tehdyksi';
    default:
      return null;
  }
}

// ---------- Eurot ----------

export function sumValues(values: (number | null)[]): { sum: number; missing: number } {
  let sum = 0;
  let missing = 0;
  for (const value of values) {
    if (value == null) missing += 1;
    else sum += value;
  }
  return { sum, missing };
}

/** Kokonaiset eurot suomalaisittain, esim. "1 950 €". */
export function formatEuros(value: number): string {
  return `${Math.round(value).toLocaleString('fi-FI', { maximumFractionDigits: 0 })} €`;
}
