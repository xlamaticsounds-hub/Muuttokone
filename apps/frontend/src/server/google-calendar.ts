// src/server/google-calendar.ts
//
// Google Calendar integration for new leads. Uses the same GCP service
// account already configured for Cloud Storage (GCP_SERVICE_ACCOUNT_KEY) —
// it just also needs the Calendar API enabled on that GCP project, and the
// target calendar (GOOGLE_CALENDAR_ID) shared with the service account's
// `client_email` with "Make changes to events" permission.
//
// Tiimien omat kalenterit: GOOGLE_CALENDAR_ID_<TIIMI> (esim. GOOGLE_CALENDAR_ID_TAMPERE) ohjaa tiimin
// keikat ja laatikkovuokrat omaan kalenteriinsa. Ilman sitä tiimi käyttää yhteistä GOOGLE_CALENDAR_ID:tä.
// Kalenteri päätellään liidin tiimistä joka kerta. Jos tapahtuma on vielä vanhassa kalenterissa (tiimi
// vaihtui tai tiimin kalenteri otettiin käyttöön myöhemmin), se siirretään ennen muokkausta.
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
import { isCompletedStatus } from '@/lib/lead-status';
import {
  DEFAULT_START,
  calendarEventStart,
  formatCalendarStart,
  formatClockTime,
  leadPreferredTime,
  parsePreferredTime,
} from '@/lib/calendar-time';
import { helsinkiLocalToUtc } from '@/lib/helsinki-time';
import { GoogleAuth } from 'google-auth-library';
import { createLog } from '@/server/repo/logs';
import { TEAMS } from '@/lib/teams';
import { setLeadCalendarEventId } from '@/server/repo/leads';
import type { LeadStatus } from '@prisma/client';

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const DEFAULT_JOB_DURATION_HOURS = 4;
const TIME_ZONE = 'Europe/Helsinki';
// Tapahtuman kuvauksen viimeinen rivi — vaihdetaan vahvistusriviin kun liidi voitetaan.
const PENDING_NOTE =
  '(Alustava merkintä — vahvistuu kun liidi merkitään voitetuksi Discordissa. Kesto on oletusarvoinen arvio.)';
const PENDING_NOTE_RE = /^\(Alustava merkintä.*$/m;
const CONFIRMED_NOTE = '✅ Vahvistettu — liidi merkitty voitetuksi.';

// Suomen vuorokauden alku sille päivälle, jolle tapahtuma osuu.
function helsinkiDayStart(date: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date).split('-').map(Number);
  return helsinkiLocalToUtc(y, m, d);
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

/** Tiimin kalenteri: GOOGLE_CALENDAR_ID_<TIIMI> jos asetettu, muuten yhteinen kalenteri. */
export function calendarIdForTeam(teamId: string | null | undefined): string | null {
  const own = teamId ? process.env[`GOOGLE_CALENDAR_ID_${teamId.toUpperCase()}`]?.trim() : '';
  return own || getCalendarId();
}

/** Tiimit, joilla on oma kalenteri (eri kuin yhteinen). */
export function teamsWithOwnCalendar(): string[] {
  const shared = getCalendarId();
  return TEAMS.map((t) => t.id).filter((id) => {
    const own = calendarIdForTeam(id);
    return Boolean(own && own !== shared);
  });
}

/** Kaikki käytössä olevat kalenterit (yhteinen ja tiimien omat), ilman tuplia. */
function configuredCalendarIds(): string[] {
  const ids = [getCalendarId(), ...TEAMS.map((t) => calendarIdForTeam(t.id))].filter((id): id is string => Boolean(id));
  return Array.from(new Set(ids));
}

async function teamIdOfLead(leadId: string): Promise<string | null> {
  const { prisma } = await import('@/server/db');
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { teamId: true } });
  return lead?.teamId ?? null;
}

/** Kalenteri, johon liidin merkinnät kuuluvat (liidin tiimin mukaan). */
async function leadCalendarId(leadId: string): Promise<string | null> {
  if (teamsWithOwnCalendar().length === 0) return getCalendarId();
  return calendarIdForTeam(await teamIdOfLead(leadId));
}

const isGoneError = (error: unknown) => {
  const code = (error as { code?: number })?.code;
  return code === 404 || code === 410;
};

async function eventExists(client: calendar_v3.Calendar, calendarId: string, eventId: string): Promise<boolean> {
  try {
    const res = await client.events.get({ calendarId, eventId });
    return res.data.status !== 'cancelled';
  } catch (error) {
    if (isGoneError(error)) return false;
    throw error;
  }
}

/**
 * Kalenteri, jossa liidin tapahtuman kuuluu olla. Jos tapahtuma on toisessa käytössä olevassa
 * kalenterissa, se siirretään sinne ensin (events.move). Palauttaa kohdekalenterin, tai null jos
 * kalenteria ei ole määritetty. Jos tapahtumaa ei löydy mistään, kutsuja saa 404:n kuten ennenkin.
 */
async function resolveEventCalendar(
  client: calendar_v3.Calendar,
  leadId: string,
  eventId: string,
): Promise<{ calendarId: string | null; moved: boolean }> {
  const target = await leadCalendarId(leadId);
  if (!target) return { calendarId: null, moved: false };
  const others = configuredCalendarIds().filter((id) => id !== target);
  if (others.length === 0 || (await eventExists(client, target, eventId))) return { calendarId: target, moved: false };
  for (const source of others) {
    if (!(await eventExists(client, source, eventId))) continue;
    await client.events.move({ calendarId: source, eventId, destination: target });
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'calendar.moved',
      message: 'Kalenterimerkintä siirretty tiimin kalenteriin.',
      data: { eventId, from: source, to: target },
    }).catch(() => {});
    return { calendarId: target, moved: true };
  }
  return { calendarId: target, moved: false };
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
  preferredTime?: string | null; // laskurin "HH:MM" tai muualta kirjatun keikan vapaa teksti (lib/calendar-time.ts)
  // 'vuokraus' = Muuttolaatikot-sivun tilaus: tapahtuma on laatikoiden/tuotteiden toimitus, ei muutto
  serviceKind?: 'muutto' | 'vuokraus';
  notes: string | null;
  // Kaukana tukikohdasta: laskurin hinta ei kata tyhjää ajoa (ks. lib/base-trip.ts) — näkyy kalenterissa
  baseTripNote?: string | null;
  hallintaUrl: string;
};

/**
 * Other events already on the calendar the same day as `date` — used to flag
 * a possible double-booking in the Discord message. Best-effort: any failure
 * returns an empty list rather than blocking lead creation.
 */
export async function findOverlappingEvents(leadId: string, date: Date): Promise<string[]> {
  const client = getCalendarClient();
  const calendarId = client ? await leadCalendarId(leadId).catch(() => getCalendarId()) : null;
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
  const client = getCalendarClient();
  const calendarId = client ? await leadCalendarId(details.leadId).catch(() => getCalendarId()) : getCalendarId();
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
      ? `Toivottu kellonaika: ${details.preferredTime}${parsePreferredTime(details.preferredTime) ? '' : ` (ei tunnistettu, merkitty klo ${formatClockTime(DEFAULT_START)})`}`
      : `Kellonaika: ei ilmoitettu (merkitty klo ${formatClockTime(DEFAULT_START)})`,
    details.notes ? `Lisätiedot: ${details.notes}` : null,
    details.baseTripNote ? `⚠️ Kaukana tukikohdasta: ${details.baseTripNote}` : null,
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
  const client = getCalendarClient();
  if (!getCalendarId() || !client) return;

  try {
    const { calendarId } = await resolveEventCalendar(client, leadId, eventId);
    if (!calendarId) return;
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
  const client = getCalendarClient();
  if (!getCalendarId() || !client) return;

  try {
    // Poistetaan sieltä missä tapahtuma on: tiimin kalenterissa tai vielä vanhassa (siirto ensin)
    const { calendarId } = await resolveEventCalendar(client, leadId, eventId);
    if (!calendarId) return;
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
  const client = getCalendarClient();
  if (!getCalendarId() || !client) return;

  const newStart = calendarEventStart(newRequestedDate, preferredTime);
  const newEnd = new Date(newStart.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);

  try {
    const { calendarId } = await resolveEventCalendar(client, leadId, eventId);
    if (!calendarId) return;
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
  // Laatikkovuokran toimitus- ja noutomerkinnät seuraavat samaa tilaa (ks. server/box-rentals.ts).
  // Dynaaminen import: box-rentals käyttää tämän tiedoston funktioita.
  try {
    const { syncBoxRentalCalendarForLead } = await import('@/server/box-rentals');
    await syncBoxRentalCalendarForLead(lead.id, status);
  } catch (error) {
    console.warn('[google-calendar] laatikkovuokran kalenterisynkronointi epäonnistui', error);
  }
  if (!lead.calendarEventId) return;
  if (status === 'WON' || isCompletedStatus(status)) {
    await confirmCalendarEvent(lead.id, lead.calendarEventId);
  } else if (status === 'LOST' || status === 'CANCELLED') {
    await cancelCalendarEvent(lead.id, lead.calendarEventId);
    await setLeadCalendarEventId(lead.id, null);
  }
}

/**
 * Peruttu/hävitty liidi palautettiin vahvistetuksi, mutta sen kalenterimerkintä poistettiin
 * perumisen yhteydessä (calendarEventId = null) — luodaan uusi ja vahvistetaan se heti.
 * Never throws, kuten muutkin kalenteritoiminnot.
 */
export async function recreateConfirmedLeadEvent(leadId: string): Promise<void> {
  try {
    const { prisma } = await import('@/server/db');
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
    if (!lead || !lead.requestedDate || lead.calendarEventId) return;

    const created = await createTentativeLeadEvent(await leadEventDetails(lead, lead.requestedDate));
    if (!created) return;
    await setLeadCalendarEventId(lead.id, created.eventId);
    await confirmCalendarEvent(lead.id, created.eventId);
  } catch (error) {
    await logCalendarFailure('recreateConfirmedLeadEvent', leadId, error);
  }
}

type LeadWithContact = {
  id: string;
  formData: unknown;
  fromAddress: string | null;
  toAddress: string | null;
  notes: string | null;
  contact: { firstName: string | null; lastName: string | null };
};

async function leadEventDetails(lead: LeadWithContact, requestedDate: Date): Promise<LeadEventDetails> {
  const { parseLeadFormData } = await import('@/server/lead-format');
  const pfd = parseLeadFormData(lead.formData);
  const payload = pfd.payload && typeof pfd.payload === 'object' ? (pfd.payload as Record<string, unknown>) : {};
  return {
    leadId: lead.id,
    customerName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || 'Ei nimeä',
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    requestedDate,
    preferredTime: leadPreferredTime(pfd),
    serviceKind: payload.service_type === 'vuokraus' ? 'vuokraus' : 'muutto',
    notes: lead.notes,
    hallintaUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muuttokone.fi'}/hallinta/liidit/${lead.id}`,
  };
}

export type CalendarSyncResult = { ok: boolean; message: string };

/** Tiloja, joille puuttuva kalenterimerkintä luodaan: laskurivaraus (alustava) ja vahvistettu keikka. */
const CALENDAR_STATUSES: LeadStatus[] = ['SCHEDULED', 'WON'];

/**
 * Liidin sivun "Päivitä kalenteriin" -nappi: siirtää olemassa olevan merkinnän liidin päivälle ja
 * kellonajalle (korjaa myös vanhat, väärään aikaan menneet merkinnät) tai luo puuttuvan merkinnän
 * vahvistetulle keikalle. Jos merkintä on poistettu kalenterista käsin, luodaan uusi. Ei heitä.
 */
export async function resyncLeadCalendarEvent(leadId: string): Promise<CalendarSyncResult> {
  const client = getCalendarClient();
  if (!getCalendarId() || !client) return { ok: false, message: 'Google-kalenteria ei ole määritetty palvelimelle.' };

  try {
    const { prisma } = await import('@/server/db');
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
    if (!lead) return { ok: false, message: 'Liidiä ei löytynyt.' };
    if (!lead.requestedDate) return { ok: false, message: 'Keikalla ei ole päivää. Lisää päivä ensin.' };

    const details = await leadEventDetails(lead, lead.requestedDate);
    const start = calendarEventStart(lead.requestedDate, details.preferredTime);
    const end = new Date(start.getTime() + DEFAULT_JOB_DURATION_HOURS * 60 * 60 * 1000);
    const confirmed = lead.status === 'WON' || isCompletedStatus(lead.status);

    if (lead.calendarEventId) {
      let gone = false;
      try {
        const { calendarId } = await resolveEventCalendar(client, lead.id, lead.calendarEventId);
        if (!calendarId) return { ok: false, message: 'Google-kalenteria ei ole määritetty palvelimelle.' };
        const res = await client.events.patch({
          calendarId,
          eventId: lead.calendarEventId,
          requestBody: {
            start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
            end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
          },
        });
        gone = res.data.status === 'cancelled'; // poistettu tapahtuma voi yhä vastata, mutta ei näy kalenterissa
      } catch (error) {
        const code = (error as { code?: number })?.code;
        if (code !== 404 && code !== 410) throw error;
        gone = true;
      }
      if (!gone) {
        if (confirmed) await confirmCalendarEvent(lead.id, lead.calendarEventId);
        return { ok: true, message: `Kalenteri päivitetty: ${formatCalendarStart(start)}.` };
      }
      await setLeadCalendarEventId(lead.id, null);
    }

    if (!CALENDAR_STATUSES.includes(lead.status)) {
      return { ok: false, message: 'Kalenteriin viedään vahvistetut keikat. Merkitse keikka ensin voitetuksi.' };
    }
    const created = await createTentativeLeadEvent(details);
    if (!created) return { ok: false, message: 'Kalenterimerkinnän luonti epäonnistui. Yritä hetken päästä uudelleen.' };
    await setLeadCalendarEventId(lead.id, created.eventId);
    if (confirmed) await confirmCalendarEvent(lead.id, created.eventId);
    return { ok: true, message: `Lisätty kalenteriin: ${formatCalendarStart(start)}.` };
  } catch (error) {
    await logCalendarFailure('resyncLeadCalendarEvent', leadId, error);
    return { ok: false, message: 'Kalenterin päivitys epäonnistui. Yritä hetken päästä uudelleen.' };
  }
}

/**
 * Koko päivän merkintä (laatikkovuokran toimitus tai nouto). Päivittää olemassa olevan tai luo uuden,
 * jos merkintää ei ole tai se on poistettu kalenterista käsin. Palauttaa tapahtuman tunnisteen, tai
 * null jos kalenteria ei ole määritetty tai luonti epäonnistui. Ei heitä.
 */
export async function upsertAllDayEvent(
  leadId: string,
  eventId: string | null,
  event: { summary: string; description: string; dateKey: string; confirmed: boolean },
): Promise<string | null> {
  const client = getCalendarClient();
  if (!getCalendarId() || !client) return null;

  const next = new Date(`${event.dateKey}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const requestBody: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description,
    start: { date: event.dateKey },
    end: { date: next.toISOString().slice(0, 10) },
    status: event.confirmed ? 'confirmed' : 'tentative',
    colorId: event.confirmed ? COLOR_ID_CONFIRMED : COLOR_ID_PENDING,
    transparency: 'transparent', // ei varaa koko päivää kalenterissa
  };

  try {
    const calendarId = eventId ? (await resolveEventCalendar(client, leadId, eventId)).calendarId : await leadCalendarId(leadId);
    if (!calendarId) return null;
    if (eventId) {
      try {
        const res = await client.events.patch({ calendarId, eventId, requestBody });
        if (res.data.status !== 'cancelled') return eventId;
      } catch (error) {
        if (!isGoneError(error)) throw error;
      }
    }
    const res = await client.events.insert({ calendarId, requestBody });
    return res.data.id ?? null;
  } catch (error) {
    await logCalendarFailure('upsertAllDayEvent', leadId, error);
    return eventId;
  }
}

/**
 * Siirtää liidin kalenterimerkinnät (keikka sekä laatikoiden toimitus ja nouto) liidin tiimin
 * kalenteriin. Kutsutaan kun tiimi vaihtuu. Palauttaa siirrettyjen määrän. Ei heitä.
 */
export async function moveLeadEventsToTeamCalendar(leadId: string): Promise<{ moved: number; failed: number }> {
  const client = getCalendarClient();
  if (!getCalendarId() || !client || configuredCalendarIds().length < 2) return { moved: 0, failed: 0 };
  let moved = 0;
  let failed = 0;
  try {
    const { prisma } = await import('@/server/db');
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { calendarEventId: true, boxRental: { select: { deliveryEventId: true, pickupEventId: true } } },
    });
    const eventIds = [lead?.calendarEventId, lead?.boxRental?.deliveryEventId, lead?.boxRental?.pickupEventId].filter(
      (id): id is string => Boolean(id),
    );
    for (const eventId of eventIds) {
      try {
        if ((await resolveEventCalendar(client, leadId, eventId)).moved) moved++;
      } catch (error) {
        failed++;
        await logCalendarFailure('moveLeadEventsToTeamCalendar', leadId, error);
      }
    }
  } catch (error) {
    failed++;
    await logCalendarFailure('moveLeadEventsToTeamCalendar', leadId, error);
  }
  return { moved, failed };
}

/**
 * Kertasiirto, kun tiimille otetaan oma kalenteri käyttöön: kaikkien tiimin keikkojen merkinnät
 * siirretään yhteisestä kalenterista tiimin kalenteriin. Turvallinen ajaa uudelleen. Ei heitä.
 */
export async function moveTeamEventsToTeamCalendars(): Promise<{ leads: number; moved: number; failed: number }> {
  const teams = teamsWithOwnCalendar();
  if (teams.length === 0 || !getCalendarClient()) return { leads: 0, moved: 0, failed: 0 };
  const { prisma } = await import('@/server/db');
  const leads = await prisma.lead.findMany({
    where: {
      teamId: { in: teams },
      OR: [
        { calendarEventId: { not: null } },
        { boxRental: { OR: [{ deliveryEventId: { not: null } }, { pickupEventId: { not: null } }] } },
      ],
    },
    select: { id: true },
  });
  let moved = 0;
  let failed = 0;
  for (const lead of leads) {
    const result = await moveLeadEventsToTeamCalendar(lead.id);
    moved += result.moved;
    failed += result.failed;
  }
  return { leads: leads.length, moved, failed };
}

const TEAM_CALENDAR_MOVE_KEY = 'calendar.teamMoveDone';

/** Tiimikalenterien asetus tunnisteena: kun uusi tiimikalenteri otetaan käyttöön, kertasiirto tarjotaan uudelleen. */
function teamCalendarSignature(): string {
  return teamsWithOwnCalendar()
    .map((teamId) => `${teamId}:${calendarIdForTeam(teamId)}`)
    .join('|');
}

/**
 * Hallinnan etusivun ilmoitus: tiimeillä on omat kalenterit, mutta vanhoja merkintöjä ei ole vielä
 * siirretty. null = ei mitään tehtävää.
 */
export async function teamCalendarMoveStatus(): Promise<{ teams: string[]; leads: number } | null> {
  const teams = teamsWithOwnCalendar();
  if (teams.length === 0 || !getCalendarClient()) return null;
  try {
    const { getAppState } = await import('@/server/app-state');
    if ((await getAppState<string>(TEAM_CALENDAR_MOVE_KEY)) === teamCalendarSignature()) return null;
    const { prisma } = await import('@/server/db');
    const leads = await prisma.lead.count({
      where: {
        teamId: { in: teams },
        OR: [
          { calendarEventId: { not: null } },
          { boxRental: { OR: [{ deliveryEventId: { not: null } }, { pickupEventId: { not: null } }] } },
        ],
      },
    });
    return { teams, leads };
  } catch {
    return null;
  }
}

/** Merkitsee kertasiirron tehdyksi nykyisille tiimikalentereille. */
export async function markTeamCalendarMoveDone(): Promise<void> {
  const { setAppState } = await import('@/server/app-state');
  await setAppState(TEAM_CALENDAR_MOVE_KEY, teamCalendarSignature());
}
