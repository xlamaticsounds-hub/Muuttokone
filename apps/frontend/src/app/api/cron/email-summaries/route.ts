import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { generateLeadEmailSummary } from '@/server/email-summary';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Ajastettu reitti (ks. .github/workflows/email-summary-cron.yaml, joka kutsuu tätä 6h
 * välein) — päivittää AI-yhteenvedon jokaiselle aktiiviselle liidille jolla on
 * sähköpostiosoite. Suojattu CRON_SECRET:illä, ei käyttäjäsessiolla (kutsuja ei ole
 * kirjautunut admin vaan ajastin).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET ei ole määritetty palvelimelle.' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let leads: { id: string }[] = [];
  try {
    leads = await prisma.lead.findMany({
      where: {
        status: { notIn: ['LOST', 'ARCHIVED'] },
        contact: { email: { not: null } },
      },
      select: { id: true },
    });
  } catch (error) {
    console.error('[cron/email-summaries] Tietokantaan ei saada yhteyttä', error);
    return NextResponse.json({ error: 'Tietokantaan ei saada yhteyttä.' }, { status: 503 });
  }

  let updated = 0;
  let skipped = 0;
  const errors: { leadId: string; message: string }[] = [];

  // Peräkkäin, ei rinnakkain — IMAP-yhteyksiä ja AI-kutsuja ei kannata rynnistää yhtä aikaa.
  for (const lead of leads) {
    const result = await generateLeadEmailSummary(lead.id);
    if (result.success) {
      updated += 1;
    } else {
      skipped += 1;
      errors.push({ leadId: lead.id, message: result.message });
    }
  }

  return NextResponse.json({ processed: leads.length, updated, skipped, errors });
}
