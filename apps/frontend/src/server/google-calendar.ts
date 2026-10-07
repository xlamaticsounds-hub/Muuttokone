// src/server/google-calendar.ts
//
// Google Calendar integration for new leads. Uses the same GCP service
// account already configured for Cloud Storage (GCP_SERVICE_ACCOUNT_KEY) —
// it just also needs the Calendar API enabled on that GCP project, and the
// target calendar (GOOGLE_CALENDAR_ID) shared with the service account's
// `client_email` with "Make changes to events" permission.
//
// Every function here is best-effort: a Calendar failure is logged (via the
// existing Log model) and swallowed rather than thrown, because creating the
// lead and posting it to Discord must never depend on Calendar being
// reachable. Missing configuration (no GCP_SERVICE_ACCOUNT_KEY or
// GOOGLE_CALENDAR_ID) is treated the same way — every function becomes a
// silent no-op instead of an error, same pattern as the Discord webhook.

// Deliberately using the scoped @googleapis/calendar package instead of the
// monolithic `googleapis` — the latter bundles type definitions for every
// single Google API and was enough to make `tsc` run out of heap memory on
// this project. The scoped package is the same client, Calendar v3 only.
import { calendar, calendar_v3 } from '@googleapis/calendar';
import { GoogleAuth } from 'google-auth-library';
import { createLog } from '@/server/repo/logs';
import { setLeadCalendarEventId } from '@/server/repo/leads';
import type { LeadStatus } from '@prisma/client';

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const DEFAULT_JOB_DURATION_HOURS = 4;
const TIME_ZONE = 'Europe/Helsinki';
// Aloitusaika kun asiakas ei ole ilmoittanut toivottua kellonaikaa.
const DEFAULT_START_TIME = '09:00';

// Tapahtuman kuvauksen viimeinen rivi — vaihdetaan vahvistusriviin kun liidi voitetaan.
const PENDING_NOTE =
  '(Alustava merkintä — vahvistuu kun liidi merkitään voitetuksi Discordissa. Kesto on oletusarvoinen arvio.)';
const PENDING_NOTE_RE = /^\(Alustava merkintä.*$/m;
const CONFIRMED_NOTE = '✅ Vahvistettu — liidi merkitty voitetuksi.';

// Europe/Helsinki-aikavyöhykkeen ero UTC:hen (ms) annettuna hetkenä — huomioi kesäajan.
function helsinkiOffsetMs(timestamp: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(timestamp));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - timestamp;
}

// Suomen seinäkelloaika (esim. 5.10.2026 klo 12:00) → oikea hetki (Date).
function helsinkiWallTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(guess - helsinkiOffsetMs(guess));
}

/**
 * Kalenteritapahtuman alkuhetki. Lomakkeet ja hallinnan muokkaus tallentavat muuttopäivän
 * pelkkänä päivänä (<input type="date"> → UTC-keskiyö), jolloin sellaisenaan käytettynä
 * tapahtuma alkoi Suomessa klo 2–3 yöllä. Päivämäärä yhdistetään siksi asiakkaan toivomaan
 * kellonaikaan (laskurin "Toivottu kellonaika") tai oletukseen klo 9.00 Suomen aikaa.
 */
export function calendarEventStart(requestedDate: Date, preferredTime?: string | null): Date {
  const isDateOnly =
    requestedDate.getUTCHours() === 0 && requestedDate.getUTCMinutes() === 0 && requestedDate.getUTCSeconds() === 0;
  if (!isDateOnly) return requestedDate;

  const timeRe = /^(\d{1,2}):(\d{2})/;
  const match = timeRe.exec(preferredTime ?? '') ?? timeRe.exec(DEFAULT_START_TIME)!;
  const hour = Math.min(23, Number(match[1]));
  const minute = Math.min(59, Number(match[2]));
  return helsinkiWallTime(
    requestedDate.getUTCFullYear(),
    requestedDate.getUTCMonth() + 1,
    requestedDate.getUTCDate(),
    hour,
    minute,
  );
}

// Suomen vuorokauden alku sille päivälle, jolle tapahtuma osuu.
function helsinkiDayStart(date: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date).split('-').map(Number);
  return helsinkiWallTime(y, m, d, 0, 0);
}

// Google Calendar's built-in numbered event colors (stable across all
// calendars, no setup needed). Blueberry while waiting on an answer, Basil
// once it's actually won — a lost lead just gets its event deleted
// entirely (cancelCalendarEvent), so there's no "red" state to set here.
const COLOR_ID_PENDING = '9'; // Blueberry (blue)
const COLOR_ID_CONFIRMED = '10'; // Basil (green)

function getCalendarId(): string | null {
  return process.env.GOOGLE_CALENDAR_ID || null;
}

export function isCalendarConfigured(): boolean {
  return Boolean(process.env.GCP_SERVICE_ACCOUNT_KEY && getCalendarId());
}

let cachedClient: calendar_v3.Calendar | null = null;

function getCalendarClient(): calendar_v3.Calendar | null {
  if (!process.env.GCP_SERVICE_ACCOUNT_KEY) return null;
  if (cachedClient) return cachedClient;

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
  } catch {
    console.error('❌ Failed to parse GCP_SERVICE_ACCOUNT_KEY JSON (google-calendar)');
    return null;
  }

  const auth = new GoogleAuth({ credentials, scopes: CALENDAR_SCOPES });
  cachedClient = calendar({ version: 'v3', auth });
  return cachedClient;
}

async function logCalendarFailure(action: string, leadId: string, error: unknown) {
  console.error(`[google-calendar] ${action} failed:`, error);
  try {
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: `calendar.${action}.failed`,
      message: error instanceof Error ? error.message : String(error),
    });
  } catch (logError) {
    // Logging itself failing shouldn't throw further — just get it into the server logs.
    console.error('[google-calendar] also failed to write failure log entry:', logError);
  }
}

export type LeadEventDetails = {
  leadId: string;
  customerName: string;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: Date;
  preferredTime?: string | null; // "HH:MM" — laskurin toivottu kellonaika
  // 'vuokraus' = Muuttolaatikot-sivun tilaus: tapahtuma on laatikoiden/tuotteiden toimitus, ei muutto
  serviceKind?: 'muutto' | 'vuokraus';
  notes: string | null;
  hallintaUrl: string;
};

/**
 * Other events already on the calendar the same day as `date` — used to flag
 * a possible double-booking in the Discord message. Best-effort: any failure
 * returns an empty list rather than blocking lead creation.
 */
export async function findOverlappingEvents(leadId: string, date: Date): Promise<string[]> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) return [];

  // Suomen vuorokausi, ei palvelimen (UTC) — muuten päivän rajat heittävät 2–3 tuntia.
  const dayStart = helsinkiDayStart(calendarEventStart(date));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  try {
    const res = await client.events.list({
      calendarId,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return (res.data.items ?? [])
      .filter((event) => event.status !== 'cancelled')
      .map((event) => event.summary || '(nimetön tapahtuma)');
  } catch (error) {
    await logCalendarFailure('findOverlappingEvents', leadId, error);
    return [];
  }
}

/**
 * Creates a TENTATIVE calendar event for a new lead — tentative rather than
 * confirmed so the calendar doesn't fill up with jobs that never actually
 * happen. It's confirmed (or cancelled) from the Discord reaction later.
 * Returns null on any failure or missing config; the caller must proceed
 * regardless (the lead and Discord message can't depend on this).
 */
export async function createTentativeLeadEvent(
  details: LeadEventDetails,
): Promise<{ eventId: string; htmlLink: string | null } | null> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) {
    // Silently returning null here used to be indistinguishable from a real
    // API failure — nothing told you WHY no event showed up. Now it's clear
    // which of the two required pieces is actually missing.
    console.warn('[google-calendar] Not configured, skipping calendar event:', {
      hasServiceAccountKey: Boolean(process.env.GCP_SERVICE_ACCOUNT_KEY),
      hasCalendarId: Boolean(calendarId),
    });
    await createLog({
      entityType: 'Lead',
      entityId: details.leadId,
      action: 'calendar.not_configured',
      message: !client
        ? 'GCP_SERVICE_ACCOUNT_KEY puuttuu tai sen JSON ei jäsenny — kalenteritapahtumaa ei luotu.'
        : 'GOOGLE_CALENDAR_ID puuttuu — kalenteritapahtumaa ei luotu.',
    }).catch(() => {});
    return null;
  }

  const start = calendarEventStart(details.requestedDate, details.preferredTime);
  const end = new Date(start.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);

  const isRental = details.serviceKind === 'vuokraus';
  const descriptionLines = [
    `Asiakas: ${details.customerName}`,
    details.fromAddress ? `${isRental ? 'Toimitusosoite' : 'Mistä'}: ${details.fromAddress}` : null,
    !isRental && details.toAddress ? `Minne: ${details.toAddress}` : null,
    details.preferredTime
      ? `Toivottu kellonaika: ${details.preferredTime}`
      : `Kellonaika: ei ilmoitettu (merkitty klo ${DEFAULT_START_TIME})`,
    details.notes ? `Lisätiedot: ${details.notes}` : null,
    '',
    `Liidi hallintapaneelissa: ${details.hallintaUrl}`,
    '',
    PENDING_NOTE,
  ].filter((line): line is string => line !== null);

  try {
    const res = await client.events.insert({
      calendarId,
      requestBody: {
        summary: `${isRental ? 'Vuokraus (toimitus)' : 'Muutto'} – ${details.customerName}`,
        description: descriptionLines.join('\n'),
        status: 'tentative',
        colorId: COLOR_ID_PENDING,
        start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
        end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
      },
    });
    if (!res.data.id) return null;
    return { eventId: res.data.id, htmlLink: res.data.htmlLink ?? null };
  } catch (error) {
    await logCalendarFailure('createTentativeLeadEvent', details.leadId, error);
    return null;
  }
}

/** Called when a lead is marked WON — the job is really happening. */
export async function confirmCalendarEvent(leadId: string, eventId: string): Promise<void> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) return;

  try {
    // Pelkkä status/väri ei riitä: kuvaukseen jäi muuten teksti "Alustava merkintä —
    // vahvistuu kun…", vaikka liidi oli jo vahvistettu Discordissa.
    const existing = await client.events.get({ calendarId, eventId });
    const oldDescription = existing.data.description ?? '';
    const description = PENDING_NOTE_RE.test(oldDescription)
      ? oldDescription.replace(PENDING_NOTE_RE, CONFIRMED_NOTE)
      : oldDescription.includes(CONFIRMED_NOTE)
        ? oldDescription
        : `${oldDescription}

${CONFIRMED_NOTE}`.trim();

    await client.events.patch({
      calendarId,
      eventId,
      requestBody: { status: 'confirmed', colorId: COLOR_ID_CONFIRMED, description },
    });
  } catch (error) {
    await logCalendarFailure('confirmCalendarEvent', leadId, error);
  }
}

/** Called when a lead is marked LOST — the tentative slot frees back up. */
export async function cancelCalendarEvent(leadId: string, eventId: string): Promise<void> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) return;

  try {
    await client.events.delete({ calendarId, eventId });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 410 || code === 404) return; // already gone — nothing left to clean up
    await logCalendarFailure('cancelCalendarEvent', leadId, error);
  }
}

/** Keeps the calendar event in sync if a lead's moving date is edited later. */
export async function updateCalendarEventTime(
  leadId: string,
  eventId: string,
  newRequestedDate: Date,
  preferredTime?: string | null,
): Promise<void> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) return;

  const newStart = calendarEventStart(newRequestedDate, preferredTime);
  const newEnd = new Date(newStart.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);

  try {
    await client.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: { dateTime: newStart.toISOString(), timeZone: TIME_ZONE },
        end: { dateTime: newEnd.toISOString(), timeZone: TIME_ZONE },
      },
    });
  } catch (error) {
    await logCalendarFailure('updateCalendarEventTime', leadId, error);
  }
}

/**
 * Pitää kalenterin samassa tilassa kuin liidin: voitettu → vahvistettu (vihreä),
 * hävitty → tapahtuma poistetaan. Kutsutaan sekä Discord-reaktiosta että hallinnan
 * tilavalitsimesta, jotta kalenteri ei riipu siitä kummasta tilaa muutettiin.
 */
export async function syncCalendarWithLeadStatus(
  lead: { id: string; calendarEventId: string | null },
  status: LeadStatus,
): Promise<void> {
  if (!lead.calendarEventId) return;
  if (status === 'WON') {
    await confirmCalendarEvent(lead.id, lead.calendarEventId);
  } else if (status === 'LOST') {
    await cancelCalendarEvent(lead.id, lead.calendarEventId);
    await setLeadCalendarEventId(lead.id, null);
  }
}
