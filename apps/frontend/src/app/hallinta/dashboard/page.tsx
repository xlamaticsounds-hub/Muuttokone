import Link from 'next/link';
import { prisma } from '@/server/db';
import { Lead, Contact } from '@prisma/client';
import LeadsTable from '../LeadsTable';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import JobsCalendar, { type CalendarJob, type CalendarNotices } from './JobsCalendar';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import AiTodoList, { type AiTodoItem, type MailStatus } from './AiTodoList';
import { getLastMailCycle } from '@/server/mail-cycle';
import { getIngestMode } from '@/server/mail-ingest';
import { describeLastRun } from '@/lib/mail-status';

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
  let dbUnavailable = false;
  let recentLeads: LeadWithContact[] = [];
  let calendarJobs: CalendarJob[] = [];
  let aiTodos: AiTodoItem[] = [];
  let aiTodoTotal = 0;
  let mailStatus: MailStatus = { label: 'ei vielä luettu', stale: true, mode: getIngestMode(), summary: null, error: null, neverRun: true };
  let totalLeads = 0;
  let notices: CalendarNotices = { undated: 0, overdue: 0 };

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
    [recentLeads, calendarLeads, totalLeads, undated, overdue] = await Promise.all([
      prisma.lead.findMany({
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LEADS_LIMIT,
      }),
      prisma.lead.findMany({
        where: {
          status: { notIn: ['LOST', 'ARCHIVED', 'CANCELLED'] },
          // gte/lt jättää NULL-päivämäärät automaattisesti pois
          requestedDate: { gte: calendarFrom, lt: calendarTo },
        },
        include: { contact: true },
        orderBy: { requestedDate: 'asc' },
      }),
      prisma.lead.count(),
      // Kalenterin huomautukset: keikat jotka eivät näy kalenterissa tai jäivät käsittelemättä
      prisma.lead.count({ where: { ...activeWhere, requestedDate: null } }),
      prisma.lead.count({ where: { ...activeWhere, requestedDate: { lt: todayUtc } } }),
    ]);
    notices = { undated, overdue };
    // Huomiolista on lisäosa: jos sen haku epäonnistuu (esim. migraatiota ei ole ajettu), etusivu toimii silti
    try {
      const [todos, total] = await Promise.all([
        prisma.aiTodo.findMany({ where: { status: 'OPEN' }, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }], take: TODO_LIMIT }),
        prisma.aiTodo.count({ where: { status: 'OPEN' } }),
      ]);
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
        <LeadsTable leads={recentLeads} />
      </section>
    </div>
  );
}
