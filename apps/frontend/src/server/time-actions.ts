'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import {
  DEFAULT_CREW_SIZE,
  MAX_CREW_SIZE,
  MAX_ENTRY_HOURS,
  clampInt,
  parseHelsinkiDateTimeInput,
  validateEntryTimes,
  workedMinutes,
} from '@/lib/work-time';

// Työaikaleimat: keikka leimataan alkavaksi ja päättyväksi hallintapaneelissa, aika tallentuu kantaan.
// Kaikki toiminnot palauttavat tuloksen (ei heitä) — Next.js piilottaa server actionin virheviestit tuotannossa.

export type TimeActionResult = { success: true } | { success: false; message: string };

const MAX_TITLE = 160;
const MAX_NOTES = 2000;
const MAX_BREAK_MINUTES = 600;

const noSession: TimeActionResult = { success: false, message: 'Kirjaudu sisään.' };

function refresh(leadId?: string | null) {
  revalidatePath('/hallinta/tyoajat');
  if (leadId) revalidatePath(`/hallinta/liidit/${leadId}`);
}

const text = (value: unknown, max: number): string | null => {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, max) : null;
};

/** Leimaa työn alkavaksi nyt. Liitetään liidiin (leadId) tai nimetään vapaasti (title). */
export async function startTimeEntry(input: { leadId?: string | null; title?: string | null; crewSize?: number }): Promise<TimeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  const leadId = text(input.leadId, 64);
  const title = text(input.title, MAX_TITLE);
  if (!leadId && !title) return { success: false, message: 'Valitse keikka tai kirjoita työn nimi.' };

  try {
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
      if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
      // Sama keikka ei voi olla kahdesti käynnissä (tuplanapautus tai toinen laite)
      const running = await prisma.timeEntry.findFirst({ where: { leadId, endedAt: null }, select: { id: true } });
      if (running) return { success: false, message: 'Tälle keikalle on jo käynnissä oleva leimaus.' };
    }
    const entry = await prisma.timeEntry.create({
      data: {
        leadId,
        title,
        startedAt: new Date(),
        endedAt: null,
        crewSize: clampInt(input.crewSize, 1, MAX_CREW_SIZE, DEFAULT_CREW_SIZE),
        breakMinutes: 0,
        createdBy: session.user?.email ?? null,
      },
    });
    await createLog({ entityType: 'TimeEntry', entityId: entry.id, action: 'time.start', message: 'Työaika aloitettu', data: { leadId } }).catch(() => {});
    refresh(leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] startTimeEntry epäonnistui', error);
    return { success: false, message: 'Leimaus epäonnistui. Yritä uudelleen.' };
  }
}

/** Leimaa käynnissä olevan työn päättyneeksi nyt. Jo päättynyt leima jätetään ennalleen. */
export async function stopTimeEntry(id: string): Promise<TimeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return { success: false, message: 'Leimaa ei löytynyt.' };
    if (entry.endedAt) return { success: true };

    const now = new Date();
    if (now.getTime() <= entry.startedAt.getTime()) return { success: false, message: 'Loppuajan pitää olla alkuajan jälkeen.' };
    if (now.getTime() - entry.startedAt.getTime() > MAX_ENTRY_HOURS * 3_600_000) {
      return { success: false, message: `Työ on ollut käynnissä yli ${MAX_ENTRY_HOURS} tuntia. Korjaa alku- ja loppuaika muokkaamalla leimaa.` };
    }
    await prisma.timeEntry.update({ where: { id }, data: { endedAt: now } });
    await createLog({ entityType: 'TimeEntry', entityId: id, action: 'time.stop', message: 'Työaika päätetty', data: { leadId: entry.leadId } }).catch(() => {});
    refresh(entry.leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] stopTimeEntry epäonnistui', error);
    return { success: false, message: 'Leiman päättäminen epäonnistui. Yritä uudelleen.' };
  }
}

/** Lisää tai vähentää taukoa (minuutteina). Rajataan välille 0–600. */
export async function adjustBreak(id: string, deltaMinutes: number): Promise<TimeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return { success: false, message: 'Leimaa ei löytynyt.' };
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
  breakMinutes?: number;
  notes?: string | null;
};

/** Lisää leiman käsin tai korjaa olemassa olevaa (unohtunut leimaus, väärä aika, henkilömäärä, tauot). */
export async function saveTimeEntry(input: SaveTimeEntryInput): Promise<TimeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  const startedAt = parseHelsinkiDateTimeInput(input.startedAt ?? '');
  if (!startedAt) return { success: false, message: 'Syötä alkuaika muodossa pp.kk.vvvv hh:mm.' };
  const endedAtRaw = (input.endedAt ?? '').trim();
  const endedAt = endedAtRaw ? parseHelsinkiDateTimeInput(endedAtRaw) : null;
  if (endedAtRaw && !endedAt) return { success: false, message: 'Loppuaika ei kelpaa.' };

  const timeError = validateEntryTimes(startedAt, endedAt);
  if (timeError) return { success: false, message: timeError };

  const crewSize = clampInt(input.crewSize, 1, MAX_CREW_SIZE, DEFAULT_CREW_SIZE);
  const breakMinutes = clampInt(input.breakMinutes, 0, MAX_BREAK_MINUTES, 0);
  if (endedAt && breakMinutes > 0 && workedMinutes({ startedAt, endedAt, breakMinutes: 0 }) <= breakMinutes) {
    return { success: false, message: 'Tauko ei voi olla yhtä pitkä tai pidempi kuin työjakso.' };
  }
  const title = text(input.title, MAX_TITLE);
  const notes = text(input.notes, MAX_NOTES);

  try {
    if (input.id) {
      const existing = await prisma.timeEntry.findUnique({ where: { id: input.id } });
      if (!existing) return { success: false, message: 'Leimaa ei löytynyt.' };
      await prisma.timeEntry.update({ where: { id: input.id }, data: { title, startedAt, endedAt, crewSize, breakMinutes, notes } });
      await createLog({ entityType: 'TimeEntry', entityId: input.id, action: 'time.update', message: 'Työaikaa korjattu', data: { leadId: existing.leadId } }).catch(() => {});
      refresh(existing.leadId);
      return { success: true };
    }

    const leadId = text(input.leadId, 64);
    if (!leadId && !title) return { success: false, message: 'Valitse keikka tai kirjoita työn nimi.' };
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
      if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    }
    const entry = await prisma.timeEntry.create({
      data: { leadId, title, startedAt, endedAt, crewSize, breakMinutes, notes, createdBy: session.user?.email ?? null },
    });
    await createLog({ entityType: 'TimeEntry', entityId: entry.id, action: 'time.create', message: 'Työaika lisätty käsin', data: { leadId } }).catch(() => {});
    refresh(leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] saveTimeEntry epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

export async function deleteTimeEntry(id: string): Promise<TimeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) return { success: true }; // jo poistettu
    await prisma.timeEntry.delete({ where: { id } });
    await createLog({ entityType: 'TimeEntry', entityId: id, action: 'time.delete', message: 'Työaika poistettu', data: { leadId: entry.leadId } }).catch(() => {});
    refresh(entry.leadId);
    return { success: true };
  } catch (error) {
    console.error('[time-actions] deleteTimeEntry epäonnistui', error);
    return { success: false, message: 'Poisto epäonnistui. Yritä uudelleen.' };
  }
}
