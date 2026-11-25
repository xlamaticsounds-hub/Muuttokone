'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { getLeadSession, getOwnerSession } from '@/server/access';
import { CREW_HOME } from '@/lib/access';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import { isTeamId, suggestTeamId, teamLabel } from '@/lib/teams';
import { parseLeadFormData } from '@/server/lead-format';
import { CREW_NOTES_KEY, MAX_CREW_NOTES } from '@/server/crew-jobs';

/** Tiimi vaihtui: keikan ja laatikkovuokran kalenterimerkinnät tiimin kalenteriin (esim. Tampere). Ei heitä. */
async function moveEventsToTeamCalendar(leadId: string): Promise<void> {
  try {
    const { moveLeadEventsToTeamCalendar } = await import('@/server/google-calendar');
    await moveLeadEventsToTeamCalendar(leadId);
  } catch (error) {
    console.warn('[team-calendar] kalenterimerkintöjen siirto epäonnistui', leadId, error);
  }
}

export type TeamActionResult = { success: true } | { success: false; message: string };

/**
 * Toimiston ohjeet partiolle (ovikoodi, pysäköinti, raskaat esineet...). Näkyvät partiosivulla. Tallennetaan
 * formData-JSONiin kuten vahvistettu hinta (ei migraatiota). Liidin omat lisätiedot (Lead.notes) eivät näy
 * partiolle, koska niissä on hintatietoja.
 */
export async function setCrewNotes(leadId: string, text: string): Promise<TeamActionResult> {
  const session = await getLeadSession(leadId);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };
  const value = typeof text === 'string' ? text.trim().slice(0, MAX_CREW_NOTES) : '';
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { formData: true } });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    const formData = { ...parseLeadFormData(lead.formData) };
    if (value) formData[CREW_NOTES_KEY] = value;
    else delete formData[CREW_NOTES_KEY];
    await prisma.lead.update({ where: { id: leadId }, data: { formData: JSON.stringify(formData) } });
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'lead.crew_notes',
      message: value ? 'Ohjeet partiolle päivitetty' : 'Ohjeet partiolle poistettu',
      actorId: session.user.email,
    });
    revalidatePath(`/hallinta/liidit/${leadId}`);
    revalidatePath(CREW_HOME);
    return { success: true };
  } catch (error) {
    console.error('[team-actions] setCrewNotes epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

export type AutoAssignResult = { success: true; assigned: number; left: number } | { success: false; message: string };

/**
 * Jakaa avoimet jakamattomat keikat tiimeille osoitteen mukaan, samalla säännöllä kuin uudet liidit
 * (lib/teams.ts: pääkaupunkiseutu Helsingille, muut 100 km säteellä tiimille). Kauempana olevat ja
 * tunnistamattomat jäävät jakamattomiksi. Vain omistaja.
 */
export async function autoAssignUnassignedLeads(): Promise<AutoAssignResult> {
  const session = await getOwnerSession();
  if (!session) return { success: false, message: 'Ei oikeuksia.' };
  try {
    const leads = await prisma.lead.findMany({
      where: { status: { notIn: INACTIVE_JOB_STATUSES }, teamId: null, deletedAt: null },
      select: { id: true, fromAddress: true, toAddress: true },
    });
    let assigned = 0;
    for (const lead of leads) {
      const teamId = suggestTeamId(lead);
      if (!teamId) continue;
      // Ehto teamId: null: ei ohiteta tiimiä, jonka joku valitsi samaan aikaan
      const { count } = await prisma.lead.updateMany({ where: { id: lead.id, teamId: null }, data: { teamId } });
      if (count === 0) continue;
      assigned++;
      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.team_changed',
        message: `Tiimi: ${teamLabel(null)} -> ${teamLabel(teamId)} (automaattinen, osoitteen mukaan)`,
        data: { from: null, to: teamId, auto: true },
        actorId: session.user.email,
      }).catch(() => {});
      await moveEventsToTeamCalendar(lead.id);
    }
    if (assigned > 0) {
      revalidatePath('/hallinta/liidit');
      revalidatePath('/hallinta/keikat');
      revalidatePath('/hallinta/dashboard');
      revalidatePath(CREW_HOME);
    }
    return { success: true, assigned, left: leads.length - assigned };
  } catch (error) {
    console.error('[team-actions] autoAssignUnassignedLeads epäonnistui', error);
    return { success: false, message: 'Automaattinen jako epäonnistui. Yritä uudelleen.' };
  }
}

/**
 * Liidin tiimi. Omistaja valitsee minkä tahansa tiimin tai jättää jakamattomaksi. Aluevastaava voi vain
 * palauttaa oman tiiminsä keikan jakamattomaksi (ei omalle alueelle kuuluva), jolloin omistaja jakaa sen.
 */
export async function setLeadTeam(leadId: string, teamId: string | null): Promise<TeamActionResult> {
  const session = await getLeadSession(leadId);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };
  if (teamId !== null && !isTeamId(teamId)) return { success: false, message: 'Tuntematon tiimi.' };
  if (session.actor.role !== 'OWNER' && teamId !== null) {
    return { success: false, message: 'Vain omistaja voi siirtää keikan toiselle tiimille.' };
  }

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, teamId: true } });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    const previous = (lead as { teamId?: string | null }).teamId ?? null;
    if (previous === teamId) return { success: true };

    await prisma.lead.update({ where: { id: leadId }, data: { teamId } });
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'lead.team_changed',
      message: `Tiimi: ${teamLabel(previous)} -> ${teamLabel(teamId)}`,
      data: { from: previous, to: teamId },
      actorId: session.user.email,
    });
    await moveEventsToTeamCalendar(leadId);
    revalidatePath(`/hallinta/liidit/${leadId}`);
    revalidatePath('/hallinta/liidit');
    revalidatePath('/hallinta/keikat');
    revalidatePath('/hallinta/dashboard');
    revalidatePath(CREW_HOME);
    return { success: true };
  } catch (error) {
    console.error('[team-actions] setLeadTeam epäonnistui', error);
    return { success: false, message: 'Tiimin vaihto epäonnistui. Yritä uudelleen.' };
  }
}
