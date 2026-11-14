// Oikeustarkistukset palvelimella: sivut, server actionit ja API-reitit. Säännöt: src/lib/access.ts.
//
// Jokainen hallinnan sivu kutsuu requirePageAccess(osio) ja jokainen server action / API-reitti jotakin
// get*Session-funktioista. Pelkkä valikon piilotus ei riitä: server actionin voi kutsua suoraan, ja
// hallinnan yhteistä layoutia ei ajeta uudelleen kun sivulta toiselle siirrytään linkillä.
//
// get*Session palauttaa { user: { email }, actor } tai null, joten vanha `session.user?.email` toimii sellaisenaan.

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { resolveActor } from '@/server/actors';
import {
  PASSWORD_PATH,
  canAccessPath,
  canAccessTeam,
  homePath,
  isAdminRole,
  loginUrl,
  type Actor,
} from '@/lib/access';

export type AccessSession = { user: { email: string }; actor: Actor };

const toSession = (actor: Actor): AccessSession => ({ user: { email: actor.email }, actor });

/** Kirjautunut käyttäjä oikeuksineen (yksi kantahaku per pyyntö). null = ei kirjautunut tai ei pääsyä. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await getServerSession(authOptions);
  return resolveActor(session?.user?.email);
});

/** Kuka tahansa hallinnan käyttäjä (myös partionjohtaja). */
export async function getAnySession(): Promise<AccessSession | null> {
  const actor = await getActor();
  return actor ? toSession(actor) : null;
}

/** Hallinnan työkalut: omistaja tai aluevastaava. Tiimirajaus tarkistetaan erikseen (getLeadSession tms.). */
export async function getAdminSession(): Promise<AccessSession | null> {
  const actor = await getActor();
  return actor && isAdminRole(actor.role) ? toSession(actor) : null;
}

/** Koko yritystä koskevat toiminnot: vain omistajat. */
export async function getOwnerSession(): Promise<AccessSession | null> {
  const actor = await getActor();
  return actor?.role === 'OWNER' ? toSession(actor) : null;
}

/** Liidin teamId (null jos liidiä ei ole). */
async function leadTeam(leadId: string): Promise<{ teamId: string | null } | null> {
  if (!leadId || typeof leadId !== 'string') return null;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { teamId: true } });
  return lead ? { teamId: (lead as { teamId?: string | null }).teamId ?? null } : null;
}

/**
 * Toiminto yhdelle liidille: omistaja aina, aluevastaava vain oman tiimin liidille.
 * allowCrew: myös partionjohtaja oman tiimin liidille (partiosivun toiminnot: laatikot, työajat).
 */
export async function getLeadSession(leadId: string, options: { allowCrew?: boolean } = {}): Promise<AccessSession | null> {
  const session = options.allowCrew ? await getAnySession() : await getAdminSession();
  if (!session) return null;
  if (session.actor.role === 'OWNER') return session;
  const lead = await leadTeam(leadId);
  return lead && canAccessTeam(session.actor, lead.teamId) ? session : null;
}

/** Voiko käyttäjä nähdä liidin (sivut: notFound() jos ei). */
export async function canSeeLead(actor: Actor, leadId: string): Promise<boolean> {
  if (actor.role === 'OWNER') return true;
  if (!isAdminRole(actor.role)) return false;
  const lead = await leadTeam(leadId);
  return Boolean(lead) && canAccessTeam(actor, lead!.teamId);
}

/**
 * Hallinnan sivun alussa: ohjaa kirjautumiseen, salasanan vaihtoon tai oman roolin etusivulle,
 * jos käyttäjällä ei ole pääsyä osioon. Palauttaa käyttäjän.
 */
export async function requirePageAccess(section: string): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(loginUrl(section));
  if (actor.mustChangePassword && section !== PASSWORD_PATH) redirect(PASSWORD_PATH);
  if (!canAccessPath(actor, section)) redirect(homePath(actor.role));
  return actor;
}
