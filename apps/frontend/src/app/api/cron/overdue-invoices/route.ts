import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { sendDiscordNotification } from '@/server/discord-webhook';
import { computeInvoiceTotals, daysOverdue, isInvoiceOverdue, parseInvoiceItems } from '@/lib/invoice';
import { formatEuro } from '@/lib/format';

export const runtime = 'nodejs';

/**
 * Ajastettu reitti (ks. repon juuren .github/workflows/overdue-invoices-cron.yaml, joka
 * kutsuu tätä kerran päivässä). Merkitsee avoimet laskut, joiden eräpäivästä on kulunut
 * vähintään päivä, tilaan OVERDUE ja ilmoittaa niistä Discordiin — maksumuistutuksen voi
 * sitten tehdä suoraan laskun sivulta. Kukin lasku ilmoitetaan vain kerran, koska
 * ilmoituksen jälkeen se ei ole enää tilassa SENT/UNPAID.
 *
 * Suojattu CRON_SECRET:illä, ei käyttäjäsessiolla (kutsuja on ajastin).
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

  let candidates: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];
  try {
    candidates = await prisma.invoice.findMany({
      where: { status: { in: ['SENT', 'UNPAID'] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: 'asc' },
    });
  } catch (error) {
    console.error('[cron/overdue-invoices] Tietokantaan ei saada yhteyttä', error);
    return NextResponse.json({ error: 'Tietokantaan ei saada yhteyttä.' }, { status: 503 });
  }

  const now = new Date();
  const overdue = candidates.filter((invoice) => isInvoiceOverdue(invoice.status, invoice.dueDate, now));

  for (const invoice of overdue) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } });
    await createLog({
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'invoice.status_changed',
      message: 'Laskun tila muutettu automaattisesti: Maksu myöhässä',
      data: { status: 'OVERDUE', automatic: true },
      actorId: null,
    });
  }

  if (overdue.length > 0) {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://muuttokone.fi';
    // Discordin embedissä saa olla enintään 25 kenttää.
    const fields = overdue.slice(0, 25).map((invoice) => ({
      name: `#${invoice.invoiceNumber} ${invoice.customerName}`,
      value: `${formatEuro(computeInvoiceTotals(parseInvoiceItems(invoice.items)).gross)} € · ${daysOverdue(invoice.dueDate!, now)} pv myöhässä\n${baseUrl}/hallinta/laskutus/${invoice.id}`,
    }));
    await sendDiscordNotification(`⏰ ${overdue.length} laskua myöhässä — tee maksumuistutus`, fields);
  }

  return NextResponse.json({ checked: candidates.length, markedOverdue: overdue.length });
}
