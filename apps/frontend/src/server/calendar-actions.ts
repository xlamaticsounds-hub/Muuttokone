'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { createLog } from '@/server/repo/logs';
import type { CalendarSyncResult } from '@/server/google-calendar';

/** Liidin sivun "Päivitä kalenteriin" -nappi (ks. resyncLeadCalendarEvent). */
export async function resyncLeadCalendarAction(leadId: string): Promise<CalendarSyncResult> {
  const session = await getServerSession(authOptions);
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
