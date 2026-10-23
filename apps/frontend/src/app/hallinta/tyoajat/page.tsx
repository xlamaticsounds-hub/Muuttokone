import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { prisma } from '@/server/db';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import { helsinkiMonthRange, toHelsinkiDateInput } from '@/lib/helsinki-time';
import { formatDuration, formatHours, monthLabel, monthParam, parseMonthParam, periodRanges, shiftMonth, summarizePeriod } from '@/lib/work-time';
import { cardClass, secondaryButton } from '../form-styles';
import { leadOptionLabel, toTimeEntryDto, type LeadOption } from './dto';
import TimeClock from './TimeClock';
import TimeEntryList from './TimeEntryList';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

export default async function TyoajatPage({ searchParams }: { searchParams: Promise<{ kk?: string }> }) {
  const { kk } = await searchParams;
  const now = new Date();
  const selected = parseMonthParam(kk, now);
  const current = parseMonthParam(undefined, now);
  const isCurrentMonth = selected.year === current.year && selected.month === current.month;
  const range = helsinkiMonthRange(selected.year, selected.month);
  const ranges = periodRanges(now);
  const summaryFrom = new Date(Math.min(ranges.week.start.getTime(), ranges.month.start.getTime()));
  // requestedDate on tallennettu UTC-keskiyönä, joten "tänään" on Suomen päivä UTC-keskiyönä
  const todayUtc = new Date(`${toHelsinkiDateInput(now)}T00:00:00Z`);

  let dbUnavailable = false;
  let running: ReturnType<typeof toTimeEntryDto>[] = [];
  let history: ReturnType<typeof toTimeEntryDto>[] = [];
  let startOptions: LeadOption[] = [];
  let manualOptions: LeadOption[] = [];
  let todaySummary = { entries: 0, jobs: 0, minutes: 0, personHours: 0 };
  let weekSummary = todaySummary;
  let monthSummary = todaySummary;

  try {
    const [runningRows, monthRows, summaryRows, startLeads, manualLeads] = await Promise.all([
      prisma.timeEntry.findMany({ where: { endedAt: null }, orderBy: { startedAt: 'asc' } }),
      prisma.timeEntry.findMany({ where: { startedAt: { gte: range.start, lt: range.end } }, orderBy: { startedAt: 'desc' }, take: 500 }),
      prisma.timeEntry.findMany({ where: { startedAt: { gte: summaryFrom } }, orderBy: { startedAt: 'desc' }, take: 1000 }),
      // Aloitettavat keikat: aktiiviset, viikko taaksepäin ja kaksi viikkoa eteenpäin
      prisma.lead.findMany({
        where: {
          status: { notIn: INACTIVE_JOB_STATUSES },
          requestedDate: { gte: new Date(todayUtc.getTime() - 7 * DAY_MS), lt: new Date(todayUtc.getTime() + 15 * DAY_MS) },
        },
        include: { contact: true },
        orderBy: { requestedDate: 'asc' },
        take: 60,
      }),
      // Käsin lisättävät: myös tehdyt ja laskutetut keikat parin kuukauden ajalta
      prisma.lead.findMany({
        where: {
          status: { notIn: ['LOST', 'ARCHIVED', 'CANCELLED'] },
          requestedDate: { gte: new Date(todayUtc.getTime() - 60 * DAY_MS), lt: new Date(todayUtc.getTime() + 15 * DAY_MS) },
        },
        include: { contact: true },
        orderBy: { requestedDate: 'desc' },
        take: 120,
      }),
    ]);

    const leadIds = [...new Set([...runningRows, ...monthRows].map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
    const entryLeads = leadIds.length > 0 ? await prisma.lead.findMany({ where: { id: { in: leadIds } }, include: { contact: true } }) : [];
    const leadById = new Map(entryLeads.map((l) => [l.id, l]));

    const toOption = (lead: (typeof startLeads)[number]): LeadOption => ({
      id: lead.id,
      label: leadOptionLabel(lead),
      today: lead.requestedDate != null && lead.requestedDate.getTime() === todayUtc.getTime(),
    });

    startOptions = startLeads.map(toOption);
    manualOptions = manualLeads.map(toOption);
    running = runningRows.map((e) => toTimeEntryDto(e, e.leadId ? leadById.get(e.leadId) : null));
    history = monthRows.filter((e) => e.endedAt).map((e) => toTimeEntryDto(e, e.leadId ? leadById.get(e.leadId) : null));

    todaySummary = summarizePeriod(summaryRows, ranges.today, now);
    weekSummary = summarizePeriod(summaryRows, ranges.week, now);
    monthSummary = summarizePeriod(monthRows, range, now);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/tyoajat] Database unavailable, showing fallback view', error);
  }

  const prev = shiftMonth(selected.year, selected.month, -1);
  const next = shiftMonth(selected.year, selected.month, 1);
  const navLink =
    'flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700';

  const tiles = [
    { label: 'Tänään', summary: todaySummary },
    { label: 'Tällä viikolla', summary: weekSummary },
    { label: monthLabel(selected.year, selected.month), summary: monthSummary },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Työajat</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Leimaa keikka alkavaksi ja päättyväksi — aika tallentuu automaattisesti.</p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Leimausta ei voi tehdä ennen kuin yhteys palaa.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div>
          <TimeClock running={running} leadOptions={startOptions} serverNow={now.toISOString()} />
        </div>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {tiles.map(({ label, summary }) => (
              <div key={label} className={cardClass}>
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatDuration(summary.minutes)}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {formatHours(summary.personHours)} henkilötunteja · {summary.jobs} {summary.jobs === 1 ? 'työ' : 'työtä'}
                </p>
              </div>
            ))}
          </div>

          <div className={cardClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link href={`/hallinta/tyoajat?kk=${monthParam(prev.year, prev.month)}`} aria-label="Edellinen kuukausi" className={navLink}>
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <h2 className="min-w-[8.5rem] text-center text-lg font-semibold capitalize text-gray-900 dark:text-white">{monthLabel(selected.year, selected.month)}</h2>
                {isCurrentMonth ? (
                  <span className={`${navLink} cursor-not-allowed opacity-40`} aria-hidden="true">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                ) : (
                  <Link href={`/hallinta/tyoajat?kk=${monthParam(next.year, next.month)}`} aria-label="Seuraava kuukausi" className={navLink}>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
              <a
                href={`/api/hallinta/tyoajat/export?kk=${monthParam(selected.year, selected.month)}`}
                download
                className={`${secondaryButton} flex items-center gap-1.5`}
              >
                <Download className="h-4 w-4" />
                Lataa CSV
              </a>
            </div>
            <TimeEntryList entries={history} leadOptions={manualOptions} emptyMessage={`Ei päättyneitä työaikoja kuussa ${monthLabel(selected.year, selected.month)}.`} />
          </div>
        </div>
      </div>
    </div>
  );
}
