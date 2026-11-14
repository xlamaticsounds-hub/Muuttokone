import Link from 'next/link';
import { prisma } from '@/server/db';
import { requirePageAccess } from '@/server/access';
import { loadInventoryRentals } from '@/server/box-rentals';
import { toCrewJob, type CrewJob } from '@/server/crew-jobs';
import { CREW_HOME, crewCanEditEntry, isAdminRole } from '@/lib/access';
import { TEAMS, TEAM_TAMPERE, isTeamId, teamLabel } from '@/lib/teams';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import { addDaysToKey, dateToKey } from '@/lib/box-inventory';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { periodRanges, summarizePeriod, workerHours } from '@/lib/work-time';
import { leadJobLabel, leadOptionLabel } from '../tyoajat/dto';
import JobCard from './JobCard';
import PartioClock from './PartioClock';
import PartioEntries from './PartioEntries';
import BoxTasks from './BoxTasks';
import WorkersManager from './WorkersManager';
import type { CrewBoxTask, CrewEntryDto, CrewStartOption, CrewWorker, WorkerHoursDto } from './dto';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const JOB_DAYS_AHEAD = 14;
const BOX_DAYS_AHEAD = 7;

// Partiosivu (puhelimelle): oman tiimin keikat ilman hintoja, työaikaleimat työntekijöittäin ja laatikoiden
// toimitukset/noudot. Partionjohtaja näkee vain tämän sivun. Omistaja ja aluevastaava näkevät saman näkymän
// (omistaja valitsee tiimin) ja ylläpitävät tiimin työntekijälistaa.
export default async function PartioPage({ searchParams }: { searchParams: Promise<{ tiimi?: string }> }) {
  const actor = await requirePageAccess(CREW_HOME);
  const { tiimi } = await searchParams;
  const teamId = actor.role === 'OWNER' ? (isTeamId(tiimi) ? tiimi : TEAM_TAMPERE) : actor.teamId;

  if (!teamId) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">Käyttäjälläsi ei ole tiimiä. Pyydä omistajaa lisäämään sinut tiimiin.</p>;
  }

  const now = new Date();
  const todayKey = toHelsinkiDateInput(now);
  const todayUtc = new Date(`${todayKey}T00:00:00Z`);
  const ranges = periodRanges(now);
  const summaryFrom = new Date(Math.min(ranges.week.start.getTime(), ranges.month.start.getTime()));
  const editFrom = new Date(now.getTime() - 7 * DAY_MS);

  let dbUnavailable = false;
  let jobs: CrewJob[] = [];
  let startOptions: CrewStartOption[] = [];
  let workers: CrewWorker[] = [];
  let running: CrewEntryDto[] = [];
  let recent: CrewEntryDto[] = [];
  let boxTasks: CrewBoxTask[] = [];
  let weekHours: WorkerHoursDto[] = [];
  let monthHours: WorkerHoursDto[] = [];
  let teamWeek = { personHours: 0, jobs: 0 };
  let teamMonth = { personHours: 0, jobs: 0 };

  try {
    const [leadRows, workerRows, runningRows, summaryRows, rentals] = await Promise.all([
      // Viikko taaksepäin (unohtunut leimaus) ja kaksi viikkoa eteenpäin
      prisma.lead.findMany({
        where: {
          teamId,
          deletedAt: null,
          status: { notIn: INACTIVE_JOB_STATUSES },
          requestedDate: { gte: new Date(todayUtc.getTime() - 7 * DAY_MS), lt: new Date(todayUtc.getTime() + (JOB_DAYS_AHEAD + 1) * DAY_MS) },
        },
        include: { contact: true },
        orderBy: { requestedDate: 'asc' },
        take: 100,
      }),
      prisma.worker.findMany({ where: { teamId }, orderBy: { name: 'asc' } }),
      prisma.timeEntry.findMany({ where: { teamId, endedAt: null }, orderBy: { startedAt: 'asc' } }),
      prisma.timeEntry.findMany({ where: { teamId, startedAt: { gte: summaryFrom < editFrom ? summaryFrom : editFrom } }, orderBy: { startedAt: 'desc' }, take: 1000 }),
      loadInventoryRentals(teamId),
    ]);

    workers = workerRows.map((w) => ({ id: w.id, name: w.name, active: w.active }));
    const workerName = new Map(workerRows.map((w) => [w.id, w.name]));

    jobs = leadRows.filter((l) => l.requestedDate && dateToKey(l.requestedDate) >= todayKey).map(toCrewJob);
    startOptions = leadRows.map((l) => ({
      id: l.id,
      label: leadOptionLabel(l),
      today: Boolean(l.requestedDate && dateToKey(l.requestedDate) === todayKey),
    }));

    // Leimojen keikat nimiä varten (myös vanhemmat kuin valintalistan keikat)
    const entryLeadIds = [...new Set([...runningRows, ...summaryRows].map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
    const entryLeads = entryLeadIds.length
      ? await prisma.lead.findMany({ where: { id: { in: entryLeadIds } }, include: { contact: true } })
      : [];
    const leadById = new Map(entryLeads.map((l) => [l.id, l]));
    const toDto = (e: (typeof summaryRows)[number]): CrewEntryDto => {
      const lead = e.leadId ? leadById.get(e.leadId) : undefined;
      return {
        id: e.id,
        leadId: e.leadId,
        jobLabel: lead ? leadJobLabel(lead) : e.title || (e.leadId ? 'Poistettu keikka' : 'Työ'),
        title: e.title,
        startedAt: e.startedAt.toISOString(),
        endedAt: e.endedAt ? e.endedAt.toISOString() : null,
        breakMinutes: e.breakMinutes,
        crewSize: e.crewSize,
        workerIds: (e as { workerIds?: string[] }).workerIds ?? [],
        notes: e.notes,
        editable: actor.role !== 'CREW_LEAD' || crewCanEditEntry(e.startedAt, now),
      };
    };
    running = runningRows.map(toDto);
    recent = summaryRows.filter((e) => e.endedAt && e.startedAt >= editFrom).map(toDto);

    const named = (rows: ReturnType<typeof workerHours>): WorkerHoursDto[] =>
      rows.map((r) => ({ ...r, name: workerName.get(r.workerId) ?? 'Poistettu työntekijä' }));
    weekHours = named(workerHours(summaryRows, ranges.week, now));
    monthHours = named(workerHours(summaryRows, ranges.month, now));
    teamWeek = summarizePeriod(summaryRows, ranges.week, now);
    teamMonth = summarizePeriod(summaryRows, ranges.month, now);

    // Laatikot: vahvistettujen keikkojen toimitukset ja kaikki asiakkailla olevat noudot viikon sisällä (+ myöhässä)
    const horizon = addDaysToKey(todayKey, BOX_DAYS_AHEAD);
    const relevant = rentals.filter(
      (r) =>
        (r.status === 'RESERVED' && r.commitment === 'confirmed' && r.deliveryKey <= horizon) ||
        (r.status === 'DELIVERED' && r.pickupKey <= horizon),
    );
    const rentalLeadIds = [...new Set(relevant.map((r) => r.leadId))];
    const rentalLeads = rentalLeadIds.length
      ? await prisma.lead.findMany({ where: { id: { in: rentalLeadIds } }, include: { contact: true } })
      : [];
    const rentalLead = new Map(rentalLeads.map((l) => [l.id, l]));
    boxTasks = relevant
      .map((r): CrewBoxTask => {
        const lead = rentalLead.get(r.leadId);
        const delivery = r.status === 'RESERVED';
        const dateKey = delivery ? r.deliveryKey : r.pickupKey;
        return {
          id: r.id,
          leadId: r.leadId,
          kind: delivery ? 'delivery' : 'pickup',
          dateKey,
          overdue: dateKey < todayKey,
          customer: r.customer,
          phone: lead?.contact.phone ?? null,
          // Toimitus vanhaan kotiin, nouto uudesta (pelkässä laatikkotilauksessa sama osoite)
          address: delivery ? lead?.fromAddress ?? null : lead?.toAddress || lead?.fromAddress || null,
          quantity: r.quantity,
          status: r.status,
          notes: r.notes,
        };
      })
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/partio] tietokanta ei vastaa', error);
  }

  const tomorrowKey = addDaysToKey(todayKey, 1);
  const todayJobs = jobs.filter((j) => j.dateKey === todayKey);
  const tomorrowJobs = jobs.filter((j) => j.dateKey === tomorrowKey);
  const laterJobs = jobs.filter((j) => j.dateKey && j.dateKey > tomorrowKey);
  const activeWorkers = workers.filter((w) => w.active);
  const workerNames = Object.fromEntries(workers.map((w) => [w.id, w.name]));
  const heading = 'text-lg font-semibold text-gray-900 dark:text-white';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partio · {teamLabel(teamId)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Keikat, työajat ja laatikot. Soita toimistoon, jos jokin keikan tieto on väärin.</p>
        </div>
        {actor.role === 'OWNER' && (
          <div className="flex gap-2" role="group" aria-label="Tiimi">
            {TEAMS.map((t) => (
              <Link
                key={t.id}
                href={`${CREW_HOME}?tiimi=${t.id}`}
                className={`flex h-10 items-center rounded-full border px-4 text-sm font-semibold ${
                  t.id === teamId
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Kirjaa ajat ylös ja leimaa ne myöhemmin.
        </div>
      )}

      <PartioClock running={running} startOptions={startOptions} workers={activeWorkers} workerNames={workerNames} serverNow={now.toISOString()} />

      <section className="space-y-3">
        <h2 className={heading}>Tänään</h2>
        {todayJobs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Ei keikkoja tänään.</p>
        ) : (
          todayJobs.map((job) => <JobCard key={job.id} job={job} open />)
        )}
      </section>

      {tomorrowJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className={heading}>Huomenna</h2>
          {tomorrowJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}

      <BoxTasks tasks={boxTasks} todayKey={todayKey} />

      <section className="space-y-3">
        <h2 className={heading}>Tulevat ({JOB_DAYS_AHEAD} pv)</h2>
        {laterJobs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Ei muita keikkoja kahden viikon sisällä.</p>
        ) : (
          laterJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </section>

      <PartioEntries
        entries={recent}
        workers={workers}
        weekHours={weekHours}
        monthHours={monthHours}
        teamWeek={teamWeek}
        teamMonth={teamMonth}
        canEditAll={actor.role !== 'CREW_LEAD'}
      />

      {isAdminRole(actor.role) && (
        <WorkersManager
          teamId={teamId}
          teamName={teamLabel(teamId)}
          workers={workers.map((w) => ({ ...w, teamId }))}
        />
      )}
    </div>
  );
}
