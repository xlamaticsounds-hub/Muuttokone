'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { getAnySession, type AccessSession } from '@/server/access';
import { CREW_EDIT_DAYS, CREW_HOME, canAccessTeam, crewCanEditEntry, scopeTeamId, type Actor } from '@/lib/access';
import { TEAM_HELSINKI } from '@/lib/teams';
import {
  DEFAULT_CREW_SIZE,
  MAX_CREW_SIZE,
  MAX_ENTRY_HOURS,
  clampInt,
  parseHelsinkiDateTimeInput,
  validateEntryTimes,
  workedMinutes,
} from '@/lib/work-time';

// Työaikaleimat: keikka leimataan alkavaksi ja päättyväksi hallintapaneelissa tai partiosivulla, aika tallentuu kantaan.
// Kaikki toiminnot palauttavat tuloksen (ei heitä) — Next.js piilottaa server actionin virheviestit tuotannossa.
//
// Oikeudet: omistaja kaikki leimat, aluevastaava ja partionjohtaja vain oman tiimin leimat. Partionjohtaja
// korjaa ja poistaa enintään CREW_EDIT_DAYS päivää vanhoja leimoja; vanhemmat korjaa toimisto.
// Leiman tiimi tulee liidiltä (tai leimaajan tiimistä, kun työ ei liity liidiin).

export type TimeActionResult = { success: true } | { success: false; message: string };

const MAX_TITLE = 160;
const MAX_NOTES = 2000;
const MAX_BREAK_MINUTES = 600;

const noSession: TimeActionResult = { success: false, message: 'Kirjaudu sisään.' };
const notFound: TimeActionResult = { success: false, message: 'Leimaa ei löytynyt.' };

function refresh(leadId?: string | null) {
  revalidatePath('/hallinta/tyoajat');
  revalidatePath(CREW_HOME);
  if (leadId) revalidatePath(`/hallinta/liidit/${leadId}`);
}

const text = (value: unknown, max: number): string | null => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, max) : null;
};

type EntryRef = { teamId?: string | null; startedAt: Date };

/** null = saa käsitellä, muuten virheilmoitus. edit = ajan, henkilöiden tai poiston muutos. */
function entryProblem(actor: Actor, entry: EntryRef, edit: boolean): TimeActionResult | null {
  if (!canAccessTeam(actor, entry.teamId ?? null)) return notFound;
  if (edit && actor.role === 'CREW_LEAD' && !crewCanEditEntry(entry.startedAt)) {
    return { success: false, message: `Yli ${CREW_EDIT_DAYS} päivää vanhan leiman korjaa toimisto.` };
  }
  return null;
}

/** Uuden leiman tiimi: liidin tiimi (oltava käyttäjän näkyvissä) tai vapaalle työlle käyttäjän tiimi. */
async function teamForNewEntry(session: AccessSession, leadId: string | null): Promise<{ teamId: string | null } | TimeActionResult> {
  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, teamId: true } });
    const teamId = (lead as { teamId?: string | null } | null)?.teamId ?? null;
    if (!lead || !canAccessTeam(session.actor, teamId)) return { success: false, message: 'Liidiä ei löytynyt.' };
    return { teamId };
  }
  return { teamId: scopeTeamId(session.actor) ?? TEAM_HELSINKI };
}

/**
 * Leimaan valitut työntekijät: oltava saman tiimin työntekijöitä ja aktiivisia (paitsi jo leimalla olleet,
 * jotta käytöstä poistetun henkilön vanhaa leimaa voi yhä korjata).
 */
async function validWorkerIds(raw: unknown, teamId: string | null, alreadyOnEntry: string[] = []): Promise<string[] | TimeActionResult> {
  if (!Array.isArray(raw)) return [];
  const ids = [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 64))];
  if (ids.length === 0) return [];
  if (ids.length > MAX_CREW_SIZE) return { success: false, message: `Enintään ${MAX_CREW_SIZE} henkilöä.` };
  if (!teamId) return { success: false, message: 'Keikalla ei ole tiimiä, joten työntekijöitä ei voi valita.' };
  const workers = await prisma.worker.findMany({ where: { id: { in: ids } }, select: { id: true, teamId: true, active: true } });
  const ok = ids.every((id) => {
    const worker = workers.find((w) => w.id === id);
    return worker && worker.teamId === teamId && (worker.active || alreadyOnEntry.includes(id));
  });
  return ok ? ids : { success: false, message: 'Valittu työntekijä ei kuulu keikan tiimiin. Päivitä sivu.' };
}

const isResult = (value: unknown): value is TimeActionResult =>
  typeof value === 'object' && value !== null && 'success' in value;

/** Leimaa työn alkavaksi nyt. Liitetään liidiin (leadId) tai nimetään vapaasti (title). */
export async function startTimeEntry(input: {
  leadId?: string | null;
  title?: string | null;
  crewSize?: number;
  workerIds?: string[];
}): Promise<TimeActionResult> {
  const session = await getAnySession();
  if (!session) return noSession;

  const leadId = text(input.leadId, 64);
  const title = text(input.title, MAX_TITLE);
  if (!leadId && !title) return { success: false, message: 'Valitse keikka tai kirjoita työn nimi.' };

  try {
    const team = await teamForNewEntry(session, leadId);
    if (isResult(team)) return team;
    if (leadId) {
      // Sama keikka ei voi olla kahdesti käynnissä (tuplanapautus tai toinen laite)
      const running = await prisma.timeEntry.findFirst({ where: { leadId, endedAt: null }, select: { id: true } });
      if (running) return { success: false, message: 'Tälle keikalle on jo käynnissä oleva leimaus.' };
    }
    const workerIds = await validWorkerIds(input.workerIds, team.teamId);
    if (isResult(workerIds)) return workerIds;

    const entry = await prisma.timeEntry.create({
      data: {
        leadId,
        title,
        startedAt: new Date(),
        endedAt: null,
        crewSize: workerIds.length > 0 ? workerIds.length : clampInt(input.crewSize, 1, MAX_CREW_SIZE, DEFAULT_CREW_SIZE),
        breakMinutes: 0,
        teamId: team.teamId,
        workerIds,
        createdBy: session.user.email,
      },
    });
    await createLog({ entityType: 'TimeEntry', entityId: entry.id, action: 'time.start', message: 'Työaika aloitettu', data: { leadId }, actorId: session.user.email }).catch(() => {});
    refresh(leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] startTimeEntry epäonnistui', error);
    return { success: false, message: 'Leimaus epäonnistui. Yritä uudelleen.' };
  }
}

/** Leimaa käynnissä olevan työn päättyneeksi nyt. Jo päättynyt leima jätetään ennalleen. */
export async function stopTimeEntry(id: string): Promise<TimeActionResult> {
  const session = await getAnySession();
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return notFound;
    const problem = entryProblem(session.actor, entry, false);
    if (problem) return problem;
    if (entry.endedAt) return { success: true };

    const now = new Date();
    if (now.getTime() <= entry.startedAt.getTime()) return { success: false, message: 'Loppuajan pitää olla alkuajan jälkeen.' };
    if (now.getTime() - entry.startedAt.getTime() > MAX_ENTRY_HOURS * 3_600_000) {
      return { success: false, message: `Työ on ollut käynnissä yli ${MAX_ENTRY_HOURS} tuntia. Korjaa alku- ja loppuaika muokkaamalla leimaa.` };
    }
    await prisma.timeEntry.update({ where: { id }, data: { endedAt: now } });
    await createLog({ entityType: 'TimeEntry', entityId: id, action: 'time.stop', message: 'Työaika päätetty', data: { leadId: entry.leadId }, actorId: session.user.email }).catch(() => {});
    refresh(entry.leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] stopTimeEntry epäonnistui', error);
    return { success: false, message: 'Leiman päättäminen epäonnistui. Yritä uudelleen.' };
  }
}

/** Lisää tai vähentää taukoa (minuutteina). Rajataan välille 0–600. */
export async function adjustBreak(id: string, deltaMinutes: number): Promise<TimeActionResult> {
  const session = await getAnySession();
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return notFound;
    // Käynnissä olevan tauko on tavallista leimausta, päättyneen muutos on korjaus
    const problem = entryProblem(session.actor, entry, Boolean(entry.endedAt));
    if (problem) return problem;
    const breakMinutes = clampInt(entry.breakMinutes + deltaMinutes, 0, MAX_BREAK_MINUTES, entry.breakMinutes);
    await prisma.timeEntry.update({ where: { id }, data: { breakMinutes } });
    refresh(entry.leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] adjustBreak epäonnistui', error);
    return { success: false, message: 'Tauon tallennus epäonnistui.' };
  }
}

export type SaveTimeEntryInput = {
  id?: string; // puuttuu = uusi (käsin lisätty) leima
  leadId?: string | null; // vain uudelle leimalle
  title?: string | null;
  startedAt: string; // datetime-local, Suomen aikaa ("2026-10-22T09:30")
  endedAt?: string | null; // tyhjä = käynnissä
  crewSize?: number;
  /** Mukana olleet työntekijät. Puuttuu = ei muuteta (muokatessa) / ei valittu (uusi). */
  workerIds?: string[];
  breakMinutes?: number;
  notes?: string | null;
};

/** Lisää leiman käsin tai korjaa olemassa olevaa (unohtunut leimaus, väärä aika, henkilömäärä, tauot). */
export async function saveTimeEntry(input: SaveTimeEntryInput): Promise<TimeActionResult> {
  const session = await getAnySession();
  if (!session) return noSession;

  const startedAt = parseHelsinkiDateTimeInput(input.startedAt ?? '');
  if (!startedAt) return { success: false, message: 'Syötä alkuaika muodossa pp.kk.vvvv hh:mm.' };
  const endedAtRaw = (input.endedAt ?? '').trim();
  const endedAt = endedAtRaw ? parseHelsinkiDateTimeInput(endedAtRaw) : null;
  if (endedAtRaw && !endedAt) return { success: false, message: 'Loppuaika ei kelpaa.' };

  const timeError = validateEntryTimes(startedAt, endedAt);
  if (timeError) return { success: false, message: timeError };

  const breakMinutes = clampInt(input.breakMinutes, 0, MAX_BREAK_MINUTES, 0);
  if (endedAt && breakMinutes > 0 && workedMinutes({ startedAt, endedAt, breakMinutes: 0 }) <= breakMinutes) {
    return { success: false, message: 'Tauko ei voi olla yhtä pitkä tai pidempi kuin työjakso.' };
  }
  const title = text(input.title, MAX_TITLE);
  const notes = text(input.notes, MAX_NOTES);
  const crewSizeInput = clampInt(input.crewSize, 1, MAX_CREW_SIZE, DEFAULT_CREW_SIZE);

  try {
    if (input.id) {
      const existing = await prisma.timeEntry.findUnique({ where: { id: input.id } });
      if (!existing) return notFound;
      // Sekä vanha että uusi alkuaika: partionjohtaja ei voi siirtää vanhaa leimaa muokkausikkunaan
      const problem = entryProblem(session.actor, existing, true) ?? entryProblem(session.actor, { ...existing, startedAt }, true);
      if (problem) return problem;

      const existingWorkers = (existing as { workerIds?: string[] }).workerIds ?? [];
      const workerIds = input.workerIds === undefined ? existingWorkers : await validWorkerIds(input.workerIds, existing.teamId ?? null, existingWorkers);
      if (isResult(workerIds)) return workerIds;
      const crewSize = workerIds.length > 0 ? workerIds.length : crewSizeInput;

      await prisma.timeEntry.update({ where: { id: input.id }, data: { title, startedAt, endedAt, crewSize, workerIds, breakMinutes, notes } });
      await createLog({ entityType: 'TimeEntry', entityId: input.id, action: 'time.update', message: 'Työaikaa korjattu', data: { leadId: existing.leadId }, actorId: session.user.email }).catch(() => {});
      refresh(existing.leadId);
      return { success: true };
    }

    const leadId = text(input.leadId, 64);
    if (!leadId && !title) return { success: false, message: 'Valitse keikka tai kirjoita työn nimi.' };
    if (session.actor.role === 'CREW_LEAD' && !crewCanEditEntry(startedAt)) {
      return { success: false, message: `Yli ${CREW_EDIT_DAYS} päivää vanhan leiman lisää toimisto.` };
    }
    const team = await teamForNewEntry(session, leadId);
    if (isResult(team)) return team;
    const workerIds = await validWorkerIds(input.workerIds, team.teamId);
    if (isResult(workerIds)) return workerIds;

    const entry = await prisma.timeEntry.create({
      data: {
        leadId,
        title,
        startedAt,
        endedAt,
        crewSize: workerIds.length > 0 ? workerIds.length : crewSizeInput,
        workerIds,
        teamId: team.teamId,
        breakMinutes,
        notes,
        createdBy: session.user.email,
      },
    });
    await createLog({ entityType: 'TimeEntry', entityId: entry.id, action: 'time.create', message: 'Työaika lisätty käsin', data: { leadId }, actorId: session.user.email }).catch(() => {});
    refresh(leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] saveTimeEntry epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

export async function deleteTimeEntry(id: string): Promise<TimeActionResult> {
  const session = await getAnySession();
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return { success: true }; // jo poistettu
    const problem = entryProblem(session.actor, entry, true);
    if (problem) return problem;
    await prisma.timeEntry.delete({ where: { id } });
    await createLog({ entityType: 'TimeEntry', entityId: id, action: 'time.delete', message: 'Työaika poistettu', data: { leadId: entry.leadId }, actorId: session.user.email }).catch(() => {});
    refresh(entry.leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] deleteTimeEntry epäonnistui', error);
    return { success: false, message: 'Poisto epäonnistui. Yritä uudelleen.' };
  }
}
