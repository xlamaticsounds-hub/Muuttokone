// Suomen aikavyöhykkeen päivämäärät. Palvelin (Railway) ajaa UTC:ssä, joten "päivä" ja
// "kuukausi" pitää laskea Europe/Helsinki-ajassa — muuten esim. 1.10. klo 00–03 toteutunut
// muutto osuisi syyskuun raportille, ja 31.12. päättyvä koodi lakkaisi toimimasta jo klo 22.

export const HELSINKI_TZ = 'Europe/Helsinki';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: HELSINKI_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function helsinkiParts(date: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Helsingin ajan ero UTC:hen (ms) annettuna hetkenä: +2 h talvella, +3 h kesällä. */
function helsinkiOffsetMs(date: Date): number {
  const p = helsinkiParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Helsingin paikallinen kellonaika -> UTC-hetki. */
export function helsinkiLocalToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  // Kaksi kierrosta riittää myös kesäaikasiirtymien ympärillä.
  let result = guess - helsinkiOffsetMs(new Date(guess));
  result = guess - helsinkiOffsetMs(new Date(result));
  return new Date(result);
}

const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-12-31" -> päivän alku Suomen aikaa (UTC-hetkenä). null jos muoto on väärä. */
export function helsinkiDayStart(dateInput: string): Date | null {
  const m = DATE_INPUT_RE.exec(dateInput);
  return m ? helsinkiLocalToUtc(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

/** "2026-12-31" -> päivän viimeinen millisekunti Suomen aikaa (31.12. klo 23.59.59,999). */
export function helsinkiDayEnd(dateInput: string): Date | null {
  const m = DATE_INPUT_RE.exec(dateInput);
  return m ? helsinkiLocalToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 23, 59, 59, 999) : null;
}

/** UTC-hetki -> "YYYY-MM-DD" Suomen aikaa (date-kentän arvoksi). */
export function toHelsinkiDateInput(date: Date): string {
  const p = helsinkiParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Esim. "12.10.2026" Suomen aikaa. */
export function formatHelsinkiDate(date: Date): string {
  return date.toLocaleDateString('fi-FI', { timeZone: HELSINKI_TZ });
}

/** Kalenterikuukauden rajat Suomen aikaa: [alku, seuraavan kuun alku). month = 1–12. */
export function helsinkiMonthRange(year: number, month: number): { start: Date; end: Date } {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return { start: helsinkiLocalToUtc(year, month, 1), end: helsinkiLocalToUtc(nextYear, nextMonth, 1) };
}

/** Edellinen kalenterikuukausi Suomen aikaa annetusta hetkestä (kuukausiraportin jakso). */
export function previousHelsinkiMonth(now: Date): { year: number; month: number } {
  const p = helsinkiParts(now);
  return p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 };
}
