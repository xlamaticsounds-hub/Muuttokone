import Link from 'next/link';
import { prisma } from '@/server/db';
import { Lead, Contact } from '@prisma/client';
import LeadsTable from '../LeadsTable';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import JobsCalendar, { type CalendarJob, type CalendarNotices } from './JobsCalendar';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import AiTodoList, { type AiTodoItem, type MailStatus } from './AiTodoList';
import AutoAssignButton from './AutoAssignButton';
import MoveTeamCalendarButton from './MoveTeamCalendarButton';
import { teamCalendarMoveStatus } from '@/server/google-calendar';
import { teamLabel } from '@/lib/teams';
import { getLastMailCycle } from '@/server/mail-cycle';
import { getIngestMode } from '@/server/mail-ingest';
import { describeLastRun } from '@/lib/mail-status';
import { summarizeInventory } from '@/lib/box-inventory';
import { loadInventoryRentals } from '@/server/box-rentals';
import { requirePageAccess } from '@/server/access';
import { ADMIN_HOME, scopeTeamId, teamWhere } from '@/lib/access';

export const dynamic = 'force-dynamic'; // Ensure we always get fresh data

const RECENT_LEADS_LIMIT = 8;
const TODO_LIMIT = 8;

type LeadWithContact = Lead & { contact: Contact };

// Toivottu kellonaika (HH:MM) on tallennettu liidin formData-JSONiin, jos asiakas antoi sen.
function preferredTimeOf(formData: unknown): string | null {
  try {
    const raw = typeof formData === 'string' ? JSON.parse(formData) : formData;
    const payload = (raw as { payload?: Record<string, unknown> } | null)?.payload ?? (raw as Record<string, unknown> | null);
    const time = payload?.preferred_time ?? payload?.preferredTime;
    return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time) ? time : null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const actor = await requirePageAccess(ADMIN_HOME);
  // Aluevastaava näkee vain oman tiiminsä keikat; omistaja kaikki (+ jakamattomien määrä)
  const scope = teamWhere(actor);
  const isOwner = actor.role === 'OWNER';
  let unassigned = 0;
  // Tiimin oma kalenteri otettu käyttöön (esim. GOOGLE_CALENDAR_ID_TAMPERE): vanhat merkinnät siirtämättä
  const teamCalendarMove = isOwner ? await teamCalendarMoveStatus() : null;
  let dbUnavailable = false;
  let recentLeads: LeadWithContact[] = [];
  let calendarJobs: CalendarJob[] = [];
  let aiTodos: AiTodoItem[] = [];
  let aiTodoTotal = 0;
  let mailStatus: MailStatus = { label: 'ei vielä luettu', stale: true, mode: getIngestMode(), summary: null, error: null, neverRun: true };
  let totalLeads = 0;
  let notices: CalendarNotices = { undated: 0, overdue: 0 };
  // Laatikkovuokrat: myöhässä olevat noudot ja tämän päivän toimitukset/noudot (ks. /hallinta/inventaario)
  let boxNotices: string[] = [];

  const todayKey = toHelsinkiDateInput(new Date());
  // Kalenteriin: edellisestä kuusta vuoden päähän. Hävityt, perutut ja arkistoidut jäävät pois.
  const calendarFrom = new Date(`${todayKey.slice(0, 7)}-01T00:00:00Z`);
  calendarFrom.setUTCMonth(calendarFrom.getUTCMonth() - 1);
  const calendarTo = new Date(calendarFrom);
  calendarTo.setUTCMonth(calendarTo.getUTCMonth() + 14);

  try {
    let calendarLeads: LeadWithContact[] = [];
    const activeWhere = { status: { notIn: INACTIVE_JOB_STATUSES } };
    const todayUtc = new Date(`${todayKey}T00:00:00Z`);
    let undated = 0;
    let overdue = 0;
    [recentLeads, calendarLeads, totalLeads, undated, overdue, unassigned] = await Promise.all([
      prisma.lead.findMany({
        where: scope,
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LEADS_LIMIT,
      }),
      prisma.lead.findMany({
        where: {
          ...scope,
          status: { notIn: ['LOST', 'ARCHIVED', 'CANCELLED'] },
          // gte/lt jättää NULL-päivämäärät automaattisesti pois
          requestedDate: { gte: calendarFrom, lt: calendarTo },
        },
        include: { contact: true },
        orderBy: { requestedDate: 'asc' },
      }),
      prisma.lead.count({ where: scope }),
      // Kalenterin huomautukset: keikat jotka eivät näy kalenterissa tai jäivät käsittelemättä
      prisma.lead.count({ where: { ...scope, ...activeWhere, requestedDate: null } }),
      prisma.lead.count({ where: { ...scope, ...activeWhere, requestedDate: { lt: todayUtc } } }),
      // Jakamattomat (ei tiimiä): vain omistajille, jotka valitsevat tiimin
      isOwner ? prisma.lead.count({ where: { ...activeWhere, teamId: null, deletedAt: null } }) : Promise.resolve(0),
    ]);
    notices = { undated, overdue };
    try {
      const inventory = summarizeInventory(0, await loadInventoryRentals(scopeTeamId(actor)), todayKey);
      const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
      const deliveriesToday = inventory.upcoming.filter((r) => r.deliveryKey === todayKey).length;
      const pickupsToday = inventory.current.filter((r) => r.pickupKey === todayKey).length;
      boxNotices = [
        inventory.overduePickups.length ? count(inventory.overduePickups.length, 'nouto myöhässä', 'noutoa myöhässä') : null,
        inventory.unmarkedDeliveries.length ? count(inventory.unmarkedDeliveries.length, 'toimitus merkitsemättä', 'toimitusta merkitsemättä') : null,
        deliveriesToday ? `toimituksia tänään ${deliveriesToday}` : null,
        pickupsToday ? `noutoja tänään ${pickupsToday}` : null,
      ].filter((line): line is string => line !== null);
    } catch (error) {
      console.warn('[hallinta/dashboard] laatikkovuokria ei voitu hakea', error);
    }
    // Huomiolista on lisäosa: jos sen haku epäonnistuu (esim. migraatiota ei ole ajettu), etusivu toimii silti
    try {
      let [todos, total] = await Promise.all([
        prisma.aiTodo.findMany({ where: { status: 'OPEN' }, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }], take: isOwner ? TODO_LIMIT : undefined }),
        prisma.aiTodo.count({ where: { status: 'OPEN' } }),
      ]);
      if (!isOwner) {
        // Aluevastaavalle vain oman tiimin liideihin liittyvät huomiot (avoimia on vähän, joten suodatus tässä)
        const leadIds = [...new Set(todos.map((t) => t.leadId).filter((id): id is string => Boolean(id)))];
        const teamLeads = leadIds.length ? await prisma.lead.findMany({ where: { id: { in: leadIds }, ...scope }, select: { id: true } }) : [];
        const visible = new Set(teamLeads.map((l) => l.id));
        todos = todos.filter((t) => t.leadId && visible.has(t.leadId));
        total = todos.length;
        todos = todos.slice(0, TODO_LIMIT);
      }
      aiTodos = todos.map((t) => ({ id: t.id, leadId: t.leadId, type: t.type, priority: t.priority, title: t.title, reason: t.reason, suggestedStatus: t.suggestedStatus }));
      aiTodoTotal = total;
      const last = await getLastMailCycle();
      const described = describeLastRun(last?.at ?? null, new Date());
      mailStatus = {
        ...described,
        mode: getIngestMode(),
        summary: last
          ? [`${last.scanned} uutta viestiä`, last.suggested ? `${last.suggested} ehdotusta` : null, last.applied ? `${last.applied} päivitystä` : null].filter(Boolean).join(' · ')
          : null,
        error: last && last.errors.length > 0 ? last.errors[0].slice(0, 120) : null,
        neverRun: !last,
      };
    } catch (error) {
      console.warn('[hallinta/dashboard] AI-huomiolistaa ei voitu hakea', error);
    }
    calendarJobs = calendarLeads.map((lead) => ({
      id: lead.id,
      // requestedDate tallennetaan UTC-keskiyönä (YYYY-MM-DD), joten päivä luetaan UTC:nä
      date: lead.requestedDate!.toISOString().slice(0, 10),
      time: preferredTimeOf(lead.formData),
      customer: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas',
      route: [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → '),
      status: lead.status,
    }));
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/dashboard] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Hallintapaneeli on silti käytettävissä, mutta data ei päivity.
        </div>
      )}

      {teamCalendarMove && teamCalendarMove.leads > 0 && (
        <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
          <span>
            <span className="font-semibold">Tiimikalenteri:</span> {teamCalendarMove.teams.map(teamLabel).join(', ')} käyttää nyt omaa
            kalenteria. Siirrä tiimin nykyiset {teamCalendarMove.leads} keikkaa sinne.
          </span>
          <span className="ml-auto">
            <MoveTeamCalendarButton label={`Siirrä ${teamCalendarMove.teams.map(teamLabel).join(' ja ')}-keikat`} />
          </span>
        </div>
      )}

      {unassigned > 0 && (
        <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-900 dark:border-violet-900/40 dark:bg-violet-900/20 dark:text-violet-200">
          <span>
            <span className="font-semibold">Jakamattomat:</span> {unassigned} {unassigned === 1 ? 'keikka ilman tiimiä' : 'keikkaa ilman tiimiä'}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-3">
            <AutoAssignButton />
            <Link href="/hallinta/liidit?tiimi=jakamaton" className="font-semibold hover:underline">
              Valitse tiimi →
            </Link>
          </span>
        </div>
      )}

      {boxNotices.length > 0 && (
        <Link
          href="/hallinta/inventaario"
          className="flex min-h-11 flex-wrap items-center gap-x-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
        >
          <span className="font-semibold">📦 Laatikot:</span> {boxNotices.join(' · ')} <span className="ml-auto font-semibold">Inventaario →</span>
        </Link>
      )}

      {/* Työpöydällä Huomio ja Keikat vierekkäin, puhelimella päällekkäin (Huomio ensin) */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        <AiTodoList items={aiTodos} totalOpen={aiTodoTotal} mailStatus={mailStatus} />
        <JobsCalendar jobs={calendarJobs} todayKey={todayKey} notices={notices} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viimeisimmät liidit</h2>
          <Link
            href="/hallinta/liidit"
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            Näytä kaikki ({totalLeads}) →
          </Link>
        </div>
        <LeadsTable leads={recentLeads} showTeam={isOwner} />
      </section>
    </div>
  );
}
