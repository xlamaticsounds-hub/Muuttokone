import { HELSINKI_TZ, helsinkiLocalToUtc } from '@/lib/helsinki-time';

// Kalenterimerkinnän kellonaika. Laskuri ja Muuttolaatikot-sivu antavat toivotun ajan muodossa "09:00",
// mutta muualta kirjatun keikan aika on vapaata tekstiä (tekoälyn poimima tai käsin kirjoitettu):
// "klo 10", "10.30", "13", "8–12", "aamupäivä". Aiemmin kalenteri ymmärsi vain muodon "HH:MM", ja
// kaikki muu merkittiin klo 9.00:ksi — keikka näkyi kalenterissa väärään aikaan.

export type ClockTime = { hour: number; minute: number };

/** Aloitusaika, kun toivottua kellonaikaa ei ole tai sitä ei tunnisteta. */
export const DEFAULT_START: ClockTime = { hour: 9, minute: 0 };

// Sanalliset ajat: samat alkuajat kuin Muuttolaatikot-sivun aikaikkunoissa (RentalOrderForm).
// Järjestys ratkaisee: "aamupäivä" ennen "aamua" ja "iltapäivä" ennen "iltaa".
const WORD_TIMES: [RegExp, ClockTime][] = [
  [/aamupäiv/, { hour: 8, minute: 0 }],
  [/iltapäiv|keskipäiv|puoliltapäiv/, { hour: 12, minute: 0 }],
  [/aamu/, { hour: 8, minute: 0 }],
  [/(?:^|\s)(?:ilta|illa)/, { hour: 17, minute: 0 }], // "ilta", "illalla"
];

const CLOCK_RE = /(?:klo|kello)\.?\s*(\d{1,2})(?:[:.](\d{2}))?/;
// Pelkkä luku tai "10.30" / "10:30". Ei päivämääriä ("4.11."), eikä lukuja, joiden perässä on yksikkö
// ("3 h", "2 henkilöä", "450 €").
const TIME_RE = /(?<![\d.:])(\d{1,2})(?:[:.](\d{2}))?(?![\d:.])(?!\s*(?:h\b|t\b|tun|min|hl|henk|€|e\b|eur|km|kpl|m2|m²|m3|m³))/g;

function clockTime(hour: string, minute: string | undefined): ClockTime | null {
  const h = Number(hour);
  const m = minute ? Number(minute) : 0;
  return h <= 23 && m <= 59 ? { hour: h, minute: m } : null;
}

/** Toivottu kellonaika tekstistä. Aikavälistä ("8–12") otetaan alku. null, jos aikaa ei tunnisteta. */
export function parsePreferredTime(text: string | null | undefined): ClockTime | null {
  const value = (text ?? '').toLowerCase().trim();
  if (!value) return null;

  const clock = CLOCK_RE.exec(value);
  const fromClock = clock ? clockTime(clock[1], clock[2]) : null;
  if (fromClock) return fromClock;

  for (const match of value.matchAll(TIME_RE)) {
    const time = clockTime(match[1], match[2]);
    if (time) return time;
  }
  return WORD_TIMES.find(([re]) => re.test(value))?.[1] ?? null;
}

/** Liidin toivottu kellonaika (jäsennetystä formDatasta): hallinnassa tai muualta kirjatun keikan
 *  preferredTime, muuten laskurin / Muuttolaatikot-sivun payload.preferred_time. */
export function leadPreferredTime(formData: Record<string, unknown>): string | null {
  if (typeof formData.preferredTime === 'string' && formData.preferredTime) return formData.preferredTime;
  const payload = formData.payload && typeof formData.payload === 'object' ? (formData.payload as Record<string, unknown>) : {};
  return typeof payload.preferred_time === 'string' && payload.preferred_time ? payload.preferred_time : null;
}

/** "9.00", "10.30" */
export const formatClockTime = ({ hour, minute }: ClockTime) => `${hour}.${String(minute).padStart(2, '0')}`;

/**
 * Kalenteritapahtuman alkuhetki. Lomakkeet ja hallinnan muokkaus tallentavat muuttopäivän
 * pelkkänä päivänä (<input type="date"> → UTC-keskiyö), jolloin sellaisenaan käytettynä
 * tapahtuma alkoi Suomessa klo 2–3 yöllä. Päivämäärä yhdistetään siksi toivottuun
 * kellonaikaan tai oletukseen klo 9.00 Suomen aikaa.
 */
export function calendarEventStart(requestedDate: Date, preferredTime?: string | null): Date {
  const isDateOnly =
    requestedDate.getUTCHours() === 0 && requestedDate.getUTCMinutes() === 0 && requestedDate.getUTCSeconds() === 0;
  if (!isDateOnly) return requestedDate;

  const { hour, minute } = parsePreferredTime(preferredTime) ?? DEFAULT_START;
  return helsinkiLocalToUtc(requestedDate.getUTCFullYear(), requestedDate.getUTCMonth() + 1, requestedDate.getUTCDate(), hour, minute);
}

/** "ke 4.11. klo 10.00" Suomen aikaa */
export function formatCalendarStart(date: Date): string {
  const day = date.toLocaleDateString('fi-FI', { timeZone: HELSINKI_TZ, weekday: 'short', day: 'numeric', month: 'numeric' });
  const time = date.toLocaleTimeString('fi-FI', { timeZone: HELSINKI_TZ, hour: 'numeric', minute: '2-digit' });
  return `${day} klo ${time}`;
}
