// Työaikaleimojen puhtaat laskentafunktiot (ei tietokantaa, ei Reactia), jotta ne ovat testattavissa.
// Käyttäjät: hallinta/tyoajat (leimaus ja historia), liidin sivun työaikakortti, server/time-actions.ts.
//
// Työaika = loppu − alku − tauot. Henkilötunnit = työaika × henkilömäärä. Tämä on se luku, jolla
// kannattavuusanalyysin "tuntiansio per henkilö" voidaan laskea toteutuneesta (ei laskurin arviosta).

import { HELSINKI_TZ, helsinkiLocalToUtc, helsinkiMonthRange, toHelsinkiDateInput } from '@/lib/helsinki-time';

export const DEFAULT_CREW_SIZE = 3; // keikoilla on yleensä 3 henkilöä
export const MAX_CREW_SIZE = 10;
export const MAX_ENTRY_HOURS = 24;
/** Alku saa olla enintään tämän verran tulevaisuudessa (kellon heitto / hieman etukäteen merkitty). */
export const MAX_FUTURE_START_MS = 60 * 60 * 1000;

export type TimeEntryLike = {
  startedAt: Date;
  endedAt: Date | null;
  breakMinutes: number;
  crewSize: number;
};

/** Työaika minuutteina (alku → loppu tai nyt, miinus tauot). Ei koskaan negatiivinen. */
export function workedMinutes(entry: Pick<TimeEntryLike, 'startedAt' | 'endedAt' | 'breakMinutes'>, now: Date = new Date()): number {
  const end = entry.endedAt ?? now;
  const total = Math.max(0, (end.getTime() - entry.startedAt.getTime()) / 60_000);
  return Math.max(0, total - Math.max(0, entry.breakMinutes));
}

/** Henkilötunnit: työaika (h) × henkilömäärä. */
export function personHours(entry: TimeEntryLike, now: Date = new Date()): number {
  return (workedMinutes(entry, now) / 60) * Math.max(1, entry.crewSize);
}

/** "2 h 15 min", "45 min", "3 h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Käynnissä olevan ajan näyttö: "1:05:09" (tunnit:minuutit:sekunnit). */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const clockFormatter = new Intl.DateTimeFormat('fi-FI', { timeZone: HELSINKI_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Kellonaika Suomen aikaa, esim. "09.30". */
export function formatClock(date: Date): string {
  return clockFormatter.format(date);
}

const entryDateFormatter = new Intl.DateTimeFormat('fi-FI', { timeZone: HELSINKI_TZ, weekday: 'short', day: 'numeric', month: 'numeric' });

/** Päivä listoissa Suomen aikaa: "to 22.10.". */
export function formatEntryDate(date: Date): string {
  return entryDateFormatter.format(date);
}

/** Desimaalituntien näyttö: 7,5 → "7,5 h". */
export function formatHours(hours: number): string {
  return `${hours.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} h`;
}

/** UTC-hetki -> datetime-local-kentän arvo Suomen aikaa ("2026-10-22T09:30"). */
export function toHelsinkiDateTimeInput(date: Date): string {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: HELSINKI_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${toHelsinkiDateInput(date)}T${time}`;
}

const DATETIME_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** datetime-local-kentän arvo (Suomen aikaa) -> UTC-hetki. null jos muoto tai arvot ovat virheellisiä. */
export function parseHelsinkiDateTimeInput(value: string): Date | null {
  const m = DATETIME_INPUT_RE.exec(value.trim());
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const date = helsinkiLocalToUtc(year, month, day, hour, minute);
  // Estää esim. 31.2. -> 3.3. -muunnoksen: päivämäärän on pysyttävä samana
  return toHelsinkiDateInput(date) === `${m[1]}-${m[2]}-${m[3]}` ? date : null;
}

/** Tarkistaa leiman ajat. Palauttaa virheviestin tai null jos kelpaa. */
export function validateEntryTimes(startedAt: Date, endedAt: Date | null, now: Date = new Date()): string | null {
  if (Number.isNaN(startedAt.getTime())) return 'Alkuaika ei kelpaa.';
  if (startedAt.getTime() > now.getTime() + MAX_FUTURE_START_MS) return 'Alkuaika ei voi olla tulevaisuudessa.';
  if (endedAt) {
    if (Number.isNaN(endedAt.getTime())) return 'Loppuaika ei kelpaa.';
    if (endedAt.getTime() <= startedAt.getTime()) return 'Loppuajan pitää olla alkuajan jälkeen.';
    if (endedAt.getTime() - startedAt.getTime() > MAX_ENTRY_HOURS * 3_600_000) return `Työjakso voi olla enintään ${MAX_ENTRY_HOURS} tuntia.`;
    if (endedAt.getTime() > now.getTime() + MAX_FUTURE_START_MS) return 'Loppuaika ei voi olla tulevaisuudessa.';
  }
  return null;
}

/** Siivoaa lukumäärät: kokonaisluku annetulla välillä, muuten oletus. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export type Period = { start: Date; end: Date };

/** Tämän päivän, viikon (ma–su) ja kuukauden rajat Suomen aikaa annetusta hetkestä. */
export function periodRanges(now: Date = new Date()): { today: Period; week: Period; month: Period } {
  const dateInput = toHelsinkiDateInput(now);
  const [y, m, d] = dateInput.split('-').map(Number);
  const todayStart = helsinkiLocalToUtc(y, m, d);
  const tomorrowStart = helsinkiLocalToUtc(y, m, d + 1);
  // Viikon alku: maanantai. getUTCDay(): su=0 … la=6 → päiviä taaksepäin maanantaihin
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const back = (weekday + 6) % 7;
  const weekStart = helsinkiLocalToUtc(y, m, d - back);
  const weekEnd = helsinkiLocalToUtc(y, m, d - back + 7);
  return {
    today: { start: todayStart, end: tomorrowStart },
    week: { start: weekStart, end: weekEnd },
    month: helsinkiMonthRange(y, m),
  };
}

export type PeriodSummary = { entries: number; jobs: number; minutes: number; personHours: number };

/** Jaksoon alkavien leimojen yhteenveto (alkuhetken mukaan). `jobs` = eri liidit tai erillisiä töitä ilman liidiä. */
export function summarizePeriod(
  entries: (TimeEntryLike & { id: string; leadId: string | null })[],
  period: Period,
  now: Date = new Date(),
): PeriodSummary {
  const inPeriod = entries.filter((e) => e.startedAt >= period.start && e.startedAt < period.end);
  const jobKeys = new Set(inPeriod.map((e) => e.leadId ?? `entry:${e.id}`));
  return {
    entries: inPeriod.length,
    jobs: jobKeys.size,
    minutes: inPeriod.reduce((sum, e) => sum + workedMinutes(e, now), 0),
    personHours: inPeriod.reduce((sum, e) => sum + personHours(e, now), 0),
  };
}

/** Hinta ÷ henkilötunnit (€/henkilötunti, ennen kuluja). null jos hintaa tai tunteja ei ole. */
export function revenuePerPersonHour(price: number | null | undefined, hours: number): number | null {
  if (price == null || !(price > 0) || !(hours > 0)) return null;
  return price / hours;
}

export type CsvRow = {
  startedAt: Date;
  endedAt: Date | null;
  breakMinutes: number;
  crewSize: number;
  title: string;
  leadId: string | null;
  price: number | null;
  /** Keikan kaikkien leimojen henkilötunnit yhteensä; €/h lasketaan tästä, ei yksittäisen rivin tunneista. */
  jobPersonHours?: number;
  notes: string | null;
};

const csvCell = (value: string | number): string => {
  let text = String(value);
  // Excel tulkitsee =, +, - ja @ -alkuisen solun kaavaksi (CSV-injektio): heittomerkki pitää sen tekstinä.
  // Luvut ovat aina ei-negatiivisia, joten ne eivät osu tähän.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const decimal = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');

/** CSV suomalaiseen Exceliin: puolipiste erottimena, desimaalipilkku, UTF-8 BOM. */
export function entriesToCsv(rows: CsvRow[], now: Date = new Date()): string {
  const header = ['Päivä', 'Alku', 'Loppu', 'Tauko (min)', 'Työaika (h)', 'Henkilöä', 'Henkilötunnit', 'Keikka tai työ', 'Liidin ID', 'Hinta (€)', '€ / henkilötunti', 'Muistiinpano'];
  const lines = rows.map((r) => {
    const minutes = workedMinutes(r, now);
    const ph = personHours(r, now);
    const perHour = revenuePerPersonHour(r.price, r.jobPersonHours ?? ph);
    return [
      toHelsinkiDateInput(r.startedAt),
      formatClock(r.startedAt),
      r.endedAt ? formatClock(r.endedAt) : 'käynnissä',
      r.breakMinutes,
      decimal(minutes / 60),
      r.crewSize,
      decimal(ph),
      r.title,
      r.leadId ?? '',
      r.price != null ? decimal(r.price) : '',
      perHour != null ? decimal(perHour) : '',
      r.notes ?? '',
    ].map(csvCell).join(';');
  });
  return `﻿${[header.map(csvCell).join(';'), ...lines].join('\r\n')}\r\n`;
}

const MONTH_NAMES = ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'];

/** "2026-10" -> kuukausi. Puuttuva tai virheellinen arvo -> annetun hetken kuukausi Suomen aikaa. */
export function parseMonthParam(value: string | null | undefined, now: Date = new Date()): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec((value ?? '').trim());
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) return { year, month };
  }
  const [year, month] = toHelsinkiDateInput(now).split('-').map(Number);
  return { year, month };
}

/** Kuukausi -> osoiterivin arvo ("2026-10"). */
export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Siirtää kuukautta eteen- tai taaksepäin (delta voi ylittää vuodenvaihteen). */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** "lokakuu 2026". */
export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}
