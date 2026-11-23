// Hallinnan roolit ja oikeussäännöt (puhtaat funktiot, ei tietokantaa eikä Next.js:ää, jotta testattavissa).
// Tarkistukset tehdään palvelimella: src/server/access.ts (sivut, server actionit, API-reitit).
//
// OWNER       kaikki tiimit ja toiminnot + käyttäjähallinta
// TEAM_ADMIN  aluevastaava (esim. Tampere): hallinnan työkalut, mutta vain oman tiimin keikat
// CREW_LEAD   partionjohtaja: vain partiosivu (oman tiimin keikat, työajat ja laatikot)

export const ROLES = ['OWNER', 'TEAM_ADMIN', 'CREW_LEAD'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Omistaja',
  TEAM_ADMIN: 'Aluevastaava',
  CREW_LEAD: 'Partionjohtaja',
};

export const isRole = (value: unknown): value is Role => typeof value === 'string' && (ROLES as readonly string[]).includes(value);

/** Roolit, joilla on aina tiimi (omistaja näkee kaikki tiimit). */
export const roleNeedsTeam = (role: Role) => role !== 'OWNER';

export type Actor = {
  /** null = ympäristömuuttujan omistaja, jolla ei ole käyttäjäriviä (hätäavain) */
  userId: string | null;
  email: string;
  name: string;
  role: Role;
  teamId: string | null;
  mustChangePassword: boolean;
};

export const PASSWORD_PATH = '/hallinta/salasana';
export const CREW_HOME = '/hallinta/partio';
export const ADMIN_HOME = '/hallinta/dashboard';
export const USERS_PATH = '/hallinta/kayttajat';
export const LOGIN_PATH = '/kirjaudu';

/** Kirjautumisen virhekoodi, kun sähköpostilla on liian monta väärää yritystä (server/auth.ts). */
export const LOGIN_LOCKED_ERROR = 'LoginLocked';
export const LOGIN_LOCKED_MESSAGE =
  'Liian monta väärää yritystä. Kirjautuminen on estetty 15 minuutiksi, tai pyydä omistajalta uusi väliaikainen salasana (se avaa eston heti).';

/** Kirjautumissivu, jolta palataan annetulle hallinnan sivulle. */
export function loginUrl(callbackPath: string): string {
  return `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

/** Kirjautumisen jälkeinen paluuosoite: vain hallinnan sisäinen polku, ettei sivua voi käyttää ohjaamaan muualle. */
export function safeCallbackPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!/^\/hallinta(?:[/?#]|$)/.test(value)) return null;
  if (value.includes('\\') || value.includes('//')) return null;
  return value;
}

// Aluevastaavan osiot. Puuttuvat (raportit, ennuste, asetukset, alennuskoodit, blogi, galleria, analytiikka,
// lokit, laskutus, käyttäjät) koskevat koko yritystä, joten ne ovat vain omistajille.
const TEAM_ADMIN_SECTIONS = [
  ADMIN_HOME,
  '/hallinta/liidit',
  '/hallinta/keikat',
  '/hallinta/inventaario',
  '/hallinta/tyoajat',
  '/hallinta/asiakkaat',
  '/hallinta/diilit',
  '/hallinta/postilaatikko',
  '/hallinta/muistiinpanot',
  CREW_HOME,
];
const CREW_LEAD_SECTIONS = [CREW_HOME];

const isUnder = (pathname: string, section: string) => pathname === section || pathname.startsWith(`${section}/`);

export function homePath(role: Role): string {
  return role === 'CREW_LEAD' ? CREW_HOME : ADMIN_HOME;
}

/** Saako rooli avata hallinnan sivun (polku ilman kyselyosaa). */
export function canAccessPath(actor: Pick<Actor, 'role'>, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (!isUnder(path, '/hallinta')) return true;
  // Juuri ohjaa roolin etusivulle, salasanan vaihto kuuluu kaikille
  if (path === '/hallinta' || isUnder(path, PASSWORD_PATH)) return true;
  if (actor.role === 'OWNER') return true;
  const sections = actor.role === 'TEAM_ADMIN' ? TEAM_ADMIN_SECTIONS : CREW_LEAD_SECTIONS;
  return sections.some((s) => isUnder(path, s));
}

export const isAdminRole = (role: Role) => role === 'OWNER' || role === 'TEAM_ADMIN';

/** Tiimi, jota ei ole olemassa: käyttäjä ilman tiimiä ei näe yhtään keikkaa (virheellinen asetus ei avaa kaikkea). */
export const NO_TEAM = '__ei_tiimia__';

/** Keikkojen rajaus: null = kaikki tiimit (omistaja), muuten käyttäjän tiimi. */
export function scopeTeamId(actor: Pick<Actor, 'role' | 'teamId'>): string | null {
  if (actor.role === 'OWNER') return null;
  return actor.teamId || NO_TEAM;
}

/** Prisma-ehto liideille / työaikaleimoille: {} omistajalle, muuten { teamId }. */
export function teamWhere(actor: Pick<Actor, 'role' | 'teamId'>): { teamId?: string } {
  const teamId = scopeTeamId(actor);
  return teamId ? { teamId } : {};
}

/** Kuuluuko tietue (liidi, leima, laatikkovuokra liidin kautta) käyttäjän näkyviin. */
export function canAccessTeam(actor: Pick<Actor, 'role' | 'teamId'>, teamId: string | null | undefined): boolean {
  const scope = scopeTeamId(actor);
  return scope === null || teamId === scope;
}

/** Partionjohtaja saa korjata omia leimojaan näin monta päivää taaksepäin; vanhemmat korjaa hallinto. */
export const CREW_EDIT_DAYS = 7;

export function crewCanEditEntry(startedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - startedAt.getTime() <= CREW_EDIT_DAYS * 24 * 60 * 60 * 1000;
}
