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

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const DEFAULT_JOB_DURATION_HOURS = 4;
const TIME_ZONE = 'Europe/Helsinki';

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

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

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
  if (!calendarId || !client) return null;

  const start = details.requestedDate;
  const end = new Date(start.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);

  const descriptionLines = [
    `Asiakas: ${details.customerName}`,
    details.fromAddress ? `Mistä: ${details.fromAddress}` : null,
    details.toAddress ? `Minne: ${details.toAddress}` : null,
    details.notes ? `Lisätiedot: ${details.notes}` : null,
    '',
    `Liidi hallintapaneelissa: ${details.hallintaUrl}`,
    '',
    '(Alustava merkintä — vahvistuu kun liidi merkitään voitetuksi Discordissa. Kesto on oletusarvoinen arvio.)',
  ].filter((line): line is string => line !== null);

  try {
    const res = await client.events.insert({
      calendarId,
      requestBody: {
        summary: `Muutto – ${details.customerName}`,
        description: descriptionLines.join('\n'),
        status: 'tentative',
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
    await client.events.patch({ calendarId, eventId, requestBody: { status: 'confirmed' } });
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
export async function updateCalendarEventTime(leadId: string, eventId: string, newStart: Date): Promise<void> {
  const calendarId = getCalendarId();
  const client = getCalendarClient();
  if (!calendarId || !client) return;

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
