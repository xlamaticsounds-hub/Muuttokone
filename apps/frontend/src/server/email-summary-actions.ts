'use server';

import { getLeadSession } from '@/server/access';
import { generateLeadEmailSummary, type EmailSummaryResult } from '@/server/email-summary';

/**
 * Session-suojattu kääre generateLeadEmailSummarylle liidin sivun napille — ydinlogiikka
 * itsessään ei tarkista sessiota, koska sitä kutsuu myös CRON_SECRET-suojattu
 * /api/cron/email-summaries-reitti, jolla ei ole käyttäjäsessiota.
 */
export async function generateLeadEmailSummaryAction(leadId: string): Promise<EmailSummaryResult> {
  const session = await getLeadSession(leadId);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään luodaksesi yhteenvedon.' };
  }
  return generateLeadEmailSummary(leadId);
}
