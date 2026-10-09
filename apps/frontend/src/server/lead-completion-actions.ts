'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { parseEuroAmount } from '@/server/lead-format';
import { sentReportsContainingLead } from '@/server/partner-reports';

export type LeadActionResult = { success: true } | { success: false; message: string };

const MAX_FINAL_PRICE = 100_000;

/**
 * "Merkitse toteutuneeksi": tila COMPLETED, toteutumishetki ja lopullinen laskutettu hinta
 * (€ sis. alv). Kumppanin välityspalkkio maksetaan vain näistä, ja kuukausiraportti valitsee
 * muutot completedAt-päivän mukaan — siksi tämä on AINOA tapa asettaa tila COMPLETED
 * (updateLeadStatus kieltäytyy). Jo toteutuneelle liidille kutsu korjaa vain hinnan ja
 * säilyttää alkuperäisen toteutumishetken.
 *
 * Palauttaa aina tuloksen (ei heitä) — Next.js piilottaa server actionin virheviestit tuotannossa.
 */
export async function markLeadCompleted(leadId: string, finalPriceInput: string | number): Promise<LeadActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  const finalPrice = parseEuroAmount(finalPriceInput);
  if (finalPrice === null || finalPrice <= 0 || finalPrice > MAX_FINAL_PRICE) {
    return { success: false, message: 'Syötä lopullinen hinta euroina, esim. 648 tai 648,50.' };
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, status: true, completedAt: true, finalPrice: true, calendarEventId: true, partnerReportedAt: true },
    });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };

    const alreadyCompleted = lead.status === 'COMPLETED' && lead.completedAt != null;
    // Kumottu ja uudelleen toteutuneeksi merkitty: jos muutto on jo lähetetyssä raportissa
    // (palkkio laskutettu), se pysyy siinä kuussa — muuten se päätyisi myös myöhemmän kuun
    // raporttiin ja palkkio maksettaisiin kahdesti.
    // Merkintä liidillä (asetetaan raportin lähetyksessä) kestää myös raportin uudelleenluonnin.
    const alreadyReported =
      !alreadyCompleted &&
      lead.completedAt != null &&
      (lead.partnerReportedAt != null || (await sentReportsContainingLead(lead.id)).length > 0);
    const completedAt = alreadyCompleted || alreadyReported ? lead.completedAt! : new Date();

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'COMPLETED', completedAt, finalPrice },
    });

    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: alreadyCompleted ? 'lead.final_price_updated' : 'lead.completed',
      message: alreadyCompleted
        ? `Lopullinen hinta korjattu: ${lead.finalPrice ?? '-'} € -> ${finalPrice} €`
        : `Merkitty toteutuneeksi, lopullinen hinta ${finalPrice} €${alreadyReported ? ' (jo raportoitu — alkuperäinen toteutumispäivä säilytetty)' : ''}`,
      data: {
        finalPrice,
        previousFinalPrice: lead.finalPrice,
        previousStatus: lead.status,
        completedAt: completedAt.toISOString(),
        alreadyReported,
      },
      actorId: session.user?.email ?? null,
    });

    if (!alreadyCompleted) {
      const { syncCalendarWithLeadStatus } = await import('@/server/google-calendar');
      await syncCalendarWithLeadStatus(lead, 'COMPLETED');
    }

    return { success: true };
  } catch (error) {
    console.error('[markLeadCompleted] Tallennus epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}
