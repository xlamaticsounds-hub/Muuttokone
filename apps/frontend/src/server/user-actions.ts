'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { getActor, getAdminSession, getOwnerSession } from '@/server/access';
import { clearFailedLogins, findUserByEmail, isEnvOwner, normalizeEmail } from '@/server/actors';
import { generateTempPassword, hashPassword, passwordProblem, verifyPassword, verifyUserPassword } from '@/server/password';
import { CREW_HOME, USERS_PATH, canAccessTeam, isRole, roleNeedsTeam, ROLE_LABELS, type Role } from '@/lib/access';
import { isTeamId, teamLabel } from '@/lib/teams';

// Käyttäjähallinta (vain omistajat), oma salasana (kaikki) ja tiimien työntekijät (omistaja + oman tiimin
// aluevastaava). Kaikki palauttavat tuloksen eivätkä heitä (Next.js piilottaa virheviestit tuotannossa).

export type UserActionResult = { success: true; tempPassword?: string } | { success: false; message: string };

const noAccess: UserActionResult = { success: false, message: 'Ei oikeuksia.' };
const MAX_NAME = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanName = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME) : '');

function refreshUsers() {
  revalidatePath(USERS_PATH);
  revalidatePath(CREW_HOME);
}

async function log(action: string, entityId: string, message: string, actorId: string, data?: Record<string, unknown>) {
  await createLog({ entityType: 'System', entityId, action, message, actorId, data }).catch(() => {});
}

/** Aktiivisten omistajien määrä (viimeistä ei saa poistaa, poistaa käytöstä eikä alentaa). */
async function activeOwnerCount(): Promise<number> {
  return prisma.user.count({ where: { role: 'OWNER', active: true } });
}

type UserInput = { name: string; role: Role; teamId: string | null };

function parseUserInput(input: { name?: unknown; role?: unknown; teamId?: unknown }): UserInput | string {
  const name = cleanName(input.name);
  if (!name) return 'Anna nimi.';
  if (!isRole(input.role)) return 'Valitse rooli.';
  const teamId = typeof input.teamId === 'string' && input.teamId ? input.teamId : null;
  if (roleNeedsTeam(input.role) && !teamId) return `${ROLE_LABELS[input.role]} tarvitsee tiimin.`;
  if (teamId && !isTeamId(teamId)) return 'Tuntematon tiimi.';
  return { name, role: input.role, teamId: roleNeedsTeam(input.role) ? teamId : null };
}

/** Partionjohtaja on myös itse töissä: lisätään hänet tiiminsä työntekijälistaan, jos samannimistä ei ole. */
async function ensureWorkerForCrewLead(user: UserInput) {
  if (user.role !== 'CREW_LEAD' || !user.teamId) return;
  const existing = await prisma.worker.findFirst({ where: { teamId: user.teamId, name: user.name } });
  if (!existing) await prisma.worker.create({ data: { teamId: user.teamId, name: user.name, active: true } });
}

export async function createUser(input: { email: string; name: string; role: string; teamId?: string | null }): Promise<UserActionResult> {
  const session = await getOwnerSession();
  if (!session) return noAccess;
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return { success: false, message: 'Tarkista sähköpostiosoite.' };
  const parsed = parseUserInput(input);
  if (typeof parsed === 'string') return { success: false, message: parsed };

  try {
    if (await findUserByEmail(email)) return { success: false, message: 'Tällä sähköpostilla on jo käyttäjä.' };
    const tempPassword = generateTempPassword();
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.name,
        role: parsed.role,
        teamId: parsed.teamId,
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
        active: true,
        createdBy: session.user.email,
      },
    });
    await ensureWorkerForCrewLead(parsed);
    await log('user.create', user.id, `Käyttäjä lisätty: ${email} (${ROLE_LABELS[parsed.role]}${parsed.teamId ? `, ${teamLabel(parsed.teamId)}` : ''})`, session.user.email);
    refreshUsers();
    return { success: true, tempPassword };
  } catch (error) {
    console.error('[user-actions] createUser epäonnistui', error);
    return { success: false, message: 'Käyttäjän lisäys epäonnistui. Yritä uudelleen.' };
  }
}

export async function updateUser(input: { id: string; name: string; role: string; teamId?: string | null }): Promise<UserActionResult> {
  const session = await getOwnerSession();
  if (!session) return noAccess;
  const parsed = parseUserInput(input);
  if (typeof parsed === 'string') return { success: false, message: parsed };

  try {
    const user = await prisma.user.findUnique({ where: { id: input.id } });
    if (!user) return { success: false, message: 'Käyttäjää ei löytynyt.' };
    const demotesOwner = user.role === 'OWNER' && parsed.role !== 'OWNER';
    if (demotesOwner && user.email === session.user.email) return { success: false, message: 'Et voi poistaa itseltäsi omistajan oikeuksia.' };
    if (demotesOwner && user.active && (await activeOwnerCount()) <= 1) return { success: false, message: 'Viimeinen omistaja ei voi vaihtaa roolia.' };

    await prisma.user.update({ where: { id: user.id }, data: { name: parsed.name, role: parsed.role, teamId: parsed.teamId } });
    await ensureWorkerForCrewLead(parsed);
    await log('user.update', user.id, `Käyttäjä muutettu: ${user.email} -> ${ROLE_LABELS[parsed.role]}${parsed.teamId ? `, ${teamLabel(parsed.teamId)}` : ''}`, session.user.email, {
      from: { role: user.role, teamId: user.teamId, name: user.name },
      to: parsed,
    });
    refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('[user-actions] updateUser epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/** Käytöstä poisto / palautus. Käytöstä poistettu ei pääse kirjautumaan, mutta historia säilyy. */
export async function setUserActive(id: string, active: boolean): Promise<UserActionResult> {
  const session = await getOwnerSession();
  if (!session) return noAccess;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, message: 'Käyttäjää ei löytynyt.' };
    if (!active && user.email === session.user.email) return { success: false, message: 'Et voi poistaa itseäsi käytöstä.' };
    if (!active && user.role === 'OWNER' && user.active && (await activeOwnerCount()) <= 1) {
      return { success: false, message: 'Viimeistä omistajaa ei voi poistaa käytöstä.' };
    }
    await prisma.user.update({ where: { id }, data: { active } });
    await log(active ? 'user.enable' : 'user.disable', id, `${active ? 'Palautettu käyttöön' : 'Poistettu käytöstä'}: ${user.email}`, session.user.email);
    refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('[user-actions] setUserActive epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/** Uusi väliaikainen salasana (unohtunut salasana). Käyttäjä vaihtaa sen seuraavalla kirjautumisella. */
export async function resetUserPassword(id: string): Promise<UserActionResult> {
  const session = await getOwnerSession();
  if (!session) return noAccess;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, message: 'Käyttäjää ei löytynyt.' };
    const tempPassword = generateTempPassword();
    await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true } });
    await clearFailedLogins(user.email, session.user.email);
    await log('user.password_reset', id, `Väliaikainen salasana annettu: ${user.email}`, session.user.email);
    refreshUsers();
    return { success: true, tempPassword };
  } catch (error) {
    console.error('[user-actions] resetUserPassword epäonnistui', error);
    return { success: false, message: 'Salasanan nollaus epäonnistui. Yritä uudelleen.' };
  }
}

/**
 * Poistaa käyttäjän kokonaan. Työaikaleimat ja lokit säilyvät (niissä on sähköposti, ei viitettä).
 * Ympäristömuuttujan omistajaa ei poisteta: ilman käyttäjäriviä hän pääsisi yhä sisään hätäavaimella,
 * joten hänet poistetaan käytöstä.
 */
export async function deleteUser(id: string): Promise<UserActionResult> {
  const session = await getOwnerSession();
  if (!session) return noAccess;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: true };
    if (user.email === session.user.email) return { success: false, message: 'Et voi poistaa itseäsi.' };
    if (isEnvOwner(user.email)) return { success: false, message: 'Tämä omistaja on määritelty palvelimen asetuksissa. Poista hänet käytöstä.' };
    if (user.role === 'OWNER' && user.active && (await activeOwnerCount()) <= 1) return { success: false, message: 'Viimeistä omistajaa ei voi poistaa.' };
    await prisma.user.delete({ where: { id } });
    await log('user.delete', id, `Käyttäjä poistettu: ${user.email}`, session.user.email);
    refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('[user-actions] deleteUser epäonnistui', error);
    return { success: false, message: 'Poisto epäonnistui. Yritä uudelleen.' };
  }
}

/** Oma salasana. Nykyistä ei kysytä, jos sitä ei vielä ole (omistaja kirjautunut hätäavaimella). */
export async function changeOwnPassword(input: { current?: string; next: string; confirm: string }): Promise<UserActionResult> {
  const actor = await getActor();
  if (!actor) return { success: false, message: 'Kirjaudu sisään.' };
  const next = typeof input.next === 'string' ? input.next : '';
  if (next !== input.confirm) return { success: false, message: 'Salasanat eivät täsmää.' };
  const problem = passwordProblem(next);
  if (problem) return { success: false, message: problem };

  try {
    const user = await findUserByEmail(actor.email);
    if (user?.passwordHash) {
      if (!(await verifyUserPassword(input.current ?? '', user))) return { success: false, message: 'Nykyinen salasana on väärin.' };
      if (await verifyPassword(next, user.passwordHash)) return { success: false, message: 'Valitse eri salasana kuin nykyinen.' };
    }
    const passwordHash = await hashPassword(next);
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    } else {
      // Ympäristömuuttujan omistaja ilman käyttäjäriviä: rivi luodaan nyt
      await prisma.user.create({
        data: { email: actor.email, name: actor.name, role: 'OWNER', passwordHash, mustChangePassword: false, active: true, createdBy: actor.email },
      });
    }
    await log('user.password_changed', user?.id ?? actor.email, `Salasana vaihdettu: ${actor.email}`, actor.email);
    return { success: true };
  } catch (error) {
    console.error('[user-actions] changeOwnPassword epäonnistui', error);
    return { success: false, message: 'Salasanan vaihto epäonnistui. Yritä uudelleen.' };
  }
}

// ===== Työntekijät (ei tunnuksia): partionjohtaja valitsee leimaan ketkä olivat mukana =====

async function workerTeamSession(teamId: string) {
  const session = await getAdminSession();
  return session && isTeamId(teamId) && canAccessTeam(session.actor, teamId) ? session : null;
}

export async function addWorker(teamId: string, name: string): Promise<UserActionResult> {
  const session = await workerTeamSession(teamId);
  if (!session) return noAccess;
  const clean = cleanName(name);
  if (!clean) return { success: false, message: 'Anna nimi.' };
  try {
    const existing = await prisma.worker.findFirst({ where: { teamId, name: clean } });
    if (existing) {
      if (!existing.active) await prisma.worker.update({ where: { id: existing.id }, data: { active: true } });
      refreshUsers();
      return { success: true };
    }
    const worker = await prisma.worker.create({ data: { teamId, name: clean, active: true } });
    await log('worker.create', worker.id, `Työntekijä lisätty: ${clean} (${teamLabel(teamId)})`, session.user.email);
    refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('[user-actions] addWorker epäonnistui', error);
    return { success: false, message: 'Lisäys epäonnistui. Yritä uudelleen.' };
  }
}

export async function updateWorker(id: string, input: { name?: string; active?: boolean }): Promise<UserActionResult> {
  try {
    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) return { success: false, message: 'Työntekijää ei löytynyt.' };
    const session = await workerTeamSession(worker.teamId);
    if (!session) return noAccess;
    const data: { name?: string; active?: boolean } = {};
    if (input.name !== undefined) {
      const clean = cleanName(input.name);
      if (!clean) return { success: false, message: 'Anna nimi.' };
      data.name = clean;
    }
    if (typeof input.active === 'boolean') data.active = input.active;
    await prisma.worker.update({ where: { id }, data });
    await log('worker.update', id, `Työntekijä muutettu: ${worker.name}${data.name && data.name !== worker.name ? ` -> ${data.name}` : ''}${data.active === false ? ' (pois käytöstä)' : data.active ? ' (käyttöön)' : ''}`, session.user.email);
    refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('[user-actions] updateWorker epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}
