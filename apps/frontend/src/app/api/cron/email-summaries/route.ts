import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMailSession, generateLeadEmailSummary, parseEmailSummary } from '@/server/email-summary';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Jätetään aikaa tulosten palauttamiseen ennen kuin ajon enimmäiskesto (maxDuration) täyttyy.
const TIME_BUDGET_MS = 270_000;

/**
 * Reitti joka päivittää AI-yhteenvedon jokaiselle aktiiviselle liidille jolla on sähköpostiosoite tai
 * katuosoite (Muuttomaailma-liidit löytyvät info@-laatikosta osoitteen perusteella). Suojattu CRON_SECRET:illä,
 * ei käyttäjäsessiolla (kutsuja on ajastin eikä kirjautunut admin).
 *
 * HUOM: tätä ei ole tällä hetkellä ajastettu — .github/workflows-kansiossa ei ole email-summary-työtä —
 * joten yhteenveto päivittyy vain liidin sivun napista, ellei reittiä kutsuta erikseen.
 *
 * Kaikki liidit käyvät läpi yhdellä IMAP-yhteydellä per postilaatikko (tarjous@ ja info@). Vanhimmat
 * yhteenvedot käsitellään ensin, ja jos aika loppuu kesken, loput jäävät seuraavalle ajolle.
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

  let leads: { id: string; emailSummary: unknown }[] = [];
  try {
    leads = await prisma.lead.findMany({
      where: {
        status: { notIn: ['LOST', 'ARCHIVED', 'CANCELLED'] },
        OR: [{ contact: { email: { not: null } } }, { fromAddress: { not: null } }, { toAddress: { not: null } }],
      },
      select: { id: true, emailSummary: true },
    });
  } catch (error) {
    console.error('[cron/email-summaries] Tietokantaan ei saada yhteyttä', error);
    return NextResponse.json({ error: 'Tietokantaan ei saada yhteyttä.' }, { status: 503 });
  }

  // Vanhin (tai puuttuva) yhteenveto ensin
  const generatedAt = (lead: { emailSummary: unknown }) => {
    const iso = parseEmailSummary(lead.emailSummary)?.generatedAt;
    return iso ? new Date(iso).getTime() : 0;
  };
  leads.sort((a, b) => generatedAt(a) - generatedAt(b));

  let updated = 0;
  let skipped = 0;
  let deferred = 0;
  const errors: { leadId: string; message: string }[] = [];
  const startedAt = Date.now();
  const session = createMailSession();

  try {
    // Peräkkäin, ei rinnakkain — IMAP-yhteyttä ja AI-kutsuja ei kannata rynnistää yhtä aikaa.
    for (const lead of leads) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        deferred += 1;
        continue;
      }
      const result = await generateLeadEmailSummary(lead.id, session);
      if (result.success) {
        updated += 1;
      } else {
        skipped += 1;
        errors.push({ leadId: lead.id, message: result.message });
      }
    }
  } finally {
    await session.close();
  }

  return NextResponse.json({ processed: leads.length - deferred, updated, skipped, deferred, errors });
}
