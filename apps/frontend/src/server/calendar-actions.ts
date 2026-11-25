'use server';

import { revalidatePath } from 'next/cache';
import { getLeadSession, getOwnerSession } from '@/server/access';
import { createLog } from '@/server/repo/logs';
import type { CalendarSyncResult } from '@/server/google-calendar';

/** Liidin sivun "Päivitä kalenteriin" -nappi (ks. resyncLeadCalendarEvent). */
export async function resyncLeadCalendarAction(leadId: string): Promise<CalendarSyncResult> {
  const session = await getLeadSession(leadId);
  if (!session) return { ok: false, message: 'Kirjaudu sisään.' };

  const { resyncLeadCalendarEvent } = await import('@/server/google-calendar');
  const result = await resyncLeadCalendarEvent(leadId);
  if (result.ok) {
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'calendar.resynced',
      message: result.message,
      actorId: session.user?.email ?? null,
    }).catch(() => {});
  }
  return result;
}

/** Hallinnan etusivun nappi: siirtää tiimien (esim. Tampere) vanhat merkinnät tiimin omaan kalenteriin. */
export async function moveTeamCalendarEventsAction(): Promise<CalendarSyncResult> {
  const session = await getOwnerSession();
  if (!session) return { ok: false, message: 'Ei oikeuksia.' };

  const { markTeamCalendarMoveDone, moveTeamEventsToTeamCalendars, teamsWithOwnCalendar } = await import('@/server/google-calendar');
  if (teamsWithOwnCalendar().length === 0) {
    return { ok: false, message: 'Tiimeillä ei ole omia kalentereita (GOOGLE_CALENDAR_ID_TAMPERE puuttuu palvelimelta).' };
  }
  try {
    const result = await moveTeamEventsToTeamCalendars();
    await createLog({
      entityType: 'System',
      entityId: 'calendar',
      action: 'calendar.team_move',
      message: `Tiimikalenterit: ${result.moved} merkintää siirretty, ${result.leads} keikkaa tarkistettu, ${result.failed} epäonnistui`,
      data: result,
      actorId: session.user.email,
    }).catch(() => {});
    if (result.failed > 0) {
      return { ok: false, message: `${result.moved} merkintää siirrettiin, ${result.failed} epäonnistui. Yritä uudelleen hetken päästä.` };
    }
    await markTeamCalendarMoveDone();
    revalidatePath('/hallinta/dashboard');
    return { ok: true, message: `Valmis: ${result.moved} merkintää siirrettiin (${result.leads} keikkaa tarkistettu).` };
  } catch (error) {
    console.error('[calendar-actions] moveTeamCalendarEventsAction', error);
    return { ok: false, message: 'Siirto epäonnistui. Yritä hetken päästä uudelleen.' };
  }
}
