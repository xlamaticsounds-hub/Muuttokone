'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { generateLeadEmailSummary, type EmailSummaryResult } from '@/server/email-summary';

/**
 * Session-suojattu kääre generateLeadEmailSummarylle liidin sivun napille — ydinlogiikka
 * itsessään ei tarkista sessiota, koska sitä kutsuu myös CRON_SECRET-suojattu
 * /api/cron/email-summaries-reitti, jolla ei ole käyttäjäsessiota.
 */
export async function generateLeadEmailSummaryAction(leadId: string): Promise<EmailSummaryResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään luodaksesi yhteenvedon.' };
  }
  return generateLeadEmailSummary(leadId);
}
