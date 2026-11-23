// Kirjautuneen käyttäjän rooli ja tiimi tietokannasta (User-taulu) sekä ympäristömuuttujan omistajat.
// Erillään server/access.ts:stä, jotta server/auth.ts voi käyttää tätä ilman kehäriippuvuutta.

import { prisma } from '@/server/db';
import { isRole, type Actor } from '@/lib/access';

// Aiemmin kovakoodattu sallittujen lista (auth.ts + proxy.ts) ja ALLOWED_EMAILS. Nämä ovat lukkiutumisvara:
// jos käyttäjäriviä ei ole (tai kanta ei vastaa), osoite pääsee sisään omistajana hätäavaimella.
// Kun käyttäjärivi on olemassa, se ratkaisee (myös käytöstä poisto).
const BUILT_IN_OWNERS = ['domenic.eklund@gmail.com', 'xlamaticsounds@gmail.com', 'paavo.penttinen@proton.me', 'matias.typpo@gmail.com'];

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function envOwnerEmails(): string[] {
  const fromEnv = (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return [...new Set([...BUILT_IN_OWNERS, ...fromEnv])];
}

export const isEnvOwner = (email: string | null | undefined) => Boolean(email) && envOwnerEmails().includes(normalizeEmail(email!));

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  active: boolean;
  mustChangePassword: boolean;
  passwordHash?: string | null;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  try {
    return (await prisma.user.findUnique({ where: { email: normalizeEmail(email) } })) as UserRow | null;
  } catch (error) {
    console.error('[actors] Käyttäjän haku epäonnistui', error);
    return null;
  }
}

export function actorFromUser(user: UserRow): Actor | null {
  if (!user.active || !isRole(user.role)) return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamId: user.teamId ?? null,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

function envOwnerActor(email: string): Actor {
  const normalized = normalizeEmail(email);
  return { userId: null, email: normalized, name: normalized, role: 'OWNER', teamId: null, mustChangePassword: false };
}

/** Kirjautuneen sähköpostin oikeudet. null = ei pääsyä (tuntematon tai käytöstä poistettu). */
export async function resolveActor(email: string | null | undefined): Promise<Actor | null> {
  if (!email) return null;
  const user = await findUserByEmail(email);
  if (user) return actorFromUser(user);
  return isEnvOwner(email) ? envOwnerActor(email) : null;
}

// Kirjautumisyritysten rajoitus sähköpostia kohden (Log-taulu, kuten muukin rajoitus).
const LOGIN_OK = 'auth.login';
const LOGIN_FAILED = 'auth.login_failed';
const LOGIN_UNLOCK = 'auth.unlock';
const MAX_FAILED_LOGINS = 10;
const FAILED_WINDOW_MS = 15 * 60 * 1000;

export async function tooManyFailedLogins(email: string): Promise<boolean> {
  const entityId = normalizeEmail(email);
  const windowStart = new Date(Date.now() - FAILED_WINDOW_MS);
  try {
    // Onnistunut kirjautuminen tai omistajan antama uusi salasana nollaa laskurin. Ilman tätä
    // väliaikainen salasana näytti väärältä, kunnes edellisistä yrityksistä oli kulunut 15 minuuttia.
    const reset = await prisma.log.findFirst({
      where: { entityType: 'User', entityId, action: { in: [LOGIN_OK, LOGIN_UNLOCK] }, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const count = await prisma.log.count({
      where: { entityType: 'User', entityId, action: LOGIN_FAILED, createdAt: reset ? { gt: reset.createdAt } : { gte: windowStart } },
    });
    return count >= MAX_FAILED_LOGINS;
  } catch {
    return false;
  }
}

/** Avaa kirjautumislukon (omistaja antoi uuden väliaikaisen salasanan). */
export async function clearFailedLogins(email: string, actorId: string): Promise<void> {
  const normalized = normalizeEmail(email);
  try {
    await prisma.log.create({
      data: { entityType: 'User', entityId: normalized, action: LOGIN_UNLOCK, message: `Kirjautumislukko avattu: ${normalized}`, actorId },
    });
  } catch (error) {
    console.error('[actors] Kirjautumislukon avaus epäonnistui', error);
  }
}

export async function recordLogin(email: string, ok: boolean, data?: Record<string, unknown>): Promise<void> {
  const normalized = normalizeEmail(email);
  try {
    await prisma.log.create({
      data: {
        entityType: 'User',
        entityId: normalized,
        action: ok ? 'auth.login' : LOGIN_FAILED,
        message: ok ? `Kirjautuminen: ${normalized}` : `Epäonnistunut kirjautuminen: ${normalized}`,
        actorId: ok ? normalized : null,
        data: data as any,
      },
    });
    if (ok) await prisma.user.updateMany({ where: { email: normalized }, data: { lastLoginAt: new Date() } });
  } catch (error) {
    console.error('[actors] Kirjautumisen kirjaus epäonnistui', error);
  }
}
