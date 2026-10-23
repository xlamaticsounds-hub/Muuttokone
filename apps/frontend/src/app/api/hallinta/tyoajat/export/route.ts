import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { helsinkiMonthRange } from '@/lib/helsinki-time';
import { entriesToCsv, monthParam, parseMonthParam, personHours, type CsvRow } from '@/lib/work-time';
import { leadJobLabel } from '@/app/hallinta/tyoajat/dto';
import { defaultFinalPrice } from '@/server/lead-format';

export const dynamic = 'force-dynamic';

// Kuukauden työajat CSV:nä (suomalainen Excel: puolipiste, desimaalipilkku). Hinta ja €/henkilötunti
// näytetään keikan ensimmäisellä rivillä ja lasketaan keikan kaikkien rivien henkilötunneista, jotta
// sarakkeen summaaminen ei laske hintaa moneen kertaan.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, month } = parseMonthParam(req.nextUrl.searchParams.get('kk'));
  const range = helsinkiMonthRange(year, month);
  const now = new Date();

  const entries = await prisma.timeEntry.findMany({
    where: { startedAt: { gte: range.start, lt: range.end } },
    orderBy: { startedAt: 'asc' },
    take: 2000,
  });

  const leadIds = [...new Set(entries.map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
  const leads = leadIds.length > 0 ? await prisma.lead.findMany({ where: { id: { in: leadIds } }, include: { contact: true } }) : [];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const jobHours = new Map<string, number>();
  for (const e of entries) {
    if (e.leadId) jobHours.set(e.leadId, (jobHours.get(e.leadId) ?? 0) + personHours(e, now));
  }

  const priced = new Set<string>();
  const rows: CsvRow[] = entries.map((e) => {
    const lead = e.leadId ? leadById.get(e.leadId) : undefined;
    const firstOfJob = Boolean(e.leadId) && !priced.has(e.leadId as string);
    if (e.leadId) priced.add(e.leadId);
    return {
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      breakMinutes: e.breakMinutes,
      crewSize: e.crewSize,
      title: lead ? leadJobLabel(lead) : e.title || (e.leadId ? 'Poistettu keikka' : 'Työ'),
      leadId: e.leadId,
      price: firstOfJob && lead ? defaultFinalPrice(lead) : null,
      jobPersonHours: e.leadId ? jobHours.get(e.leadId) : undefined,
      notes: e.notes,
    };
  });

  return new NextResponse(entriesToCsv(rows, now), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tyoajat-${monthParam(year, month)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
