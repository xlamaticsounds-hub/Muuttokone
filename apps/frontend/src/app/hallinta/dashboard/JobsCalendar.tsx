'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES } from '@/lib/lead-status';
import { MAX_JOBS_PER_DAY, overloadedDays } from '@/lib/calendar-load';
import type { LeadStatus } from '@prisma/client';

export type CalendarJob = {
  id: string;
  date: string; // YYYY-MM-DD (muuttopäivä)
  time: string | null; // HH:MM
  customer: string;
  route: string;
  status: LeadStatus;
};

export type CalendarNotices = { undated: number; overdue: number };

type View = 'day' | 'week' | 'month';

const WEEKDAYS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
const MONTHS = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
const WEEKDAYS_LONG = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];

// Päivämäärät käsitellään YYYY-MM-DD-merkkijonoina ja UTC-laskennalla, ettei selaimen aikavyöhyke siirrä päiviä.
const parse = (key: string) => new Date(`${key}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (key: string, n: number) => fmt(new Date(parse(key).getTime() + n * 86_400_000));
const mondayOf = (key: string) => addDays(key, -((parse(key).getUTCDay() + 6) % 7));
const finnishDate = (key: string) => {
  const d = parse(key);
  return `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
};

function JobRow({ job, dimmed }: { job: CalendarJob; dimmed?: boolean }) {
  // Kapealla näytöllä nimi ja reitti saavat koko leveyden ja tila tulee viimeiseksi; leveämmällä tila on oikealla.
  return (
    <Link
      href={`/hallinta/liidit/${job.id}`}
      className={`grid grid-cols-1 gap-1 rounded-lg border border-gray-100 px-3 py-3 hover:bg-gray-50 active:bg-gray-100 sm:grid-cols-[1fr_auto] sm:gap-x-3 dark:border-gray-700 dark:hover:bg-gray-700/40 ${dimmed ? 'opacity-60' : ''}`}
    >
      <p className="min-w-0 font-medium text-gray-900 sm:col-start-1 dark:text-white">
        {job.time && <span className="mr-2 font-semibold text-blue-600 dark:text-blue-400">{job.time}</span>}
        {job.customer}
      </p>
      {job.route && <p className="line-clamp-2 text-sm text-gray-500 sm:col-start-1 dark:text-gray-400">{job.route}</p>}
      <span
        className={`mt-1 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:self-start ${LEAD_STATUS_PILL_CLASSES[job.status]}`}
      >
        {LEAD_STATUS_LABELS[job.status]}
      </span>
    </Link>
  );
}

export default function JobsCalendar({ jobs, todayKey, notices }: { jobs: CalendarJob[]; todayKey: string; notices: CalendarNotices }) {
  const [view, setView] = useState<View>('day');
  const [month, setMonth] = useState(() => todayKey.slice(0, 7)); // YYYY-MM
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarJob[]>();
    for (const job of jobs) map.set(job.date, [...(map.get(job.date) ?? []), job]);
    for (const list of map.values()) list.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
    return map;
  }, [jobs]);

  const overloaded = useMemo(() => overloadedDays(jobs), [jobs]);
  const overloadLabel = (day: string) => `⚠ ${overloaded.get(day)} keikkaa samana päivänä (raja ${MAX_JOBS_PER_DAY})`;

  const isDone = (job: CalendarJob) => ['COMPLETED', 'INVOICED', 'PAID'].includes(job.status);

  const weekStart = mondayOf(todayKey);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [year, mon] = month.split('-').map(Number);
  const firstOfMonth = `${month}-01`;
  const gridStart = mondayOf(firstOfMonth);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const weeks = Math.ceil((((parse(firstOfMonth).getUTCDay() + 6) % 7) + daysInMonth) / 7);
  const gridDays = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
  const shiftMonth = (delta: number) => {
    setSelected(null);
    setMonth(fmt(new Date(Date.UTC(year, mon - 1 + delta, 1))).slice(0, 7));
  };

  const tab = (v: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`h-11 rounded-md text-sm font-semibold transition-colors lg:h-9 ${
        view === v
          ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-600 dark:text-white'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  const todayCount = byDay.get(todayKey)?.length ?? 0;
  const isCurrentMonth = month === todayKey.slice(0, 7);

  const selectedJobs = selected ? byDay.get(selected) ?? [] : [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keikat</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {todayCount === 0 ? 'Tänään ei keikkoja' : `Tänään ${todayCount} ${todayCount === 1 ? 'keikka' : 'keikkaa'}`}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/60" role="group" aria-label="Näkymä">
        {tab('day', 'Tänään')}
        {tab('week', 'Viikko')}
        {tab('month', 'Kuukausi')}
      </div>

      {(notices.overdue > 0 || notices.undated > 0) && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {notices.overdue > 0 && (
            <Link href="/hallinta/keikat#menneet" className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">
              ⚠ {notices.overdue} menneen päivän keikkaa ei ole käsitelty
            </Link>
          )}
          {notices.undated > 0 && (
            <Link href="/hallinta/keikat#ilman-paivaa" className="rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
              {notices.undated} keikkaa ilman päivää (ei näy kalenterissa)
            </Link>
          )}
        </div>
      )}

      {view === 'day' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {finnishDate(todayKey)}
            {overloaded.has(todayKey) && <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{overloadLabel(todayKey)}</span>}
          </p>
          {(byDay.get(todayKey) ?? []).length === 0 && (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-700/30 dark:text-gray-400">Ei keikkoja tänään.</p>
          )}
          {(byDay.get(todayKey) ?? []).map((job) => (
            <JobRow key={job.id} job={job} dimmed={isDone(job)} />
          ))}
        </div>
      )}

      {view === 'week' && (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const list = byDay.get(day) ?? [];
            return (
              <div key={day}>
                <p className={`mb-1 text-sm font-semibold ${day === todayKey ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {finnishDate(day)}
                  {day === todayKey && ' · tänään'}
                  {overloaded.has(day) && <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{overloadLabel(day)}</span>}
                </p>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ei keikkoja</p>
                ) : (
                  <div className="space-y-2">
                    {list.map((job) => (
                      <JobRow key={job.id} job={job} dimmed={isDone(job)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'month' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Edellinen kuukausi" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">
                {MONTHS[mon - 1]} {year}
              </p>
              {!isCurrentMonth && (
                <button type="button" onClick={() => { setSelected(null); setMonth(todayKey.slice(0, 7)); }} className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Takaisin tähän kuukauteen
                </button>
              )}
            </div>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Seuraava kuukausi" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const count = byDay.get(day)?.length ?? 0;
              const inMonth = day.startsWith(month);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(selected === day ? null : day)}
                  title={overloaded.has(day) ? overloadLabel(day) : undefined}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md border text-sm sm:aspect-[4/3] ${
                    selected === day
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      : overloaded.has(day)
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                        : day === todayKey
                        ? 'border-blue-400'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  } ${inMonth ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}
                >
                  <span>{parse(day).getUTCDate()}</span>
                  {count > 0 && (
                    <span className={`mt-0.5 rounded-full px-1.5 text-[10px] font-bold leading-4 text-white ${overloaded.has(day) ? 'bg-red-600' : 'bg-blue-600'}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {finnishDate(selected)}
                {overloaded.has(selected) && <span className="ml-2 text-red-600 dark:text-red-400">{overloadLabel(selected)}</span>}
              </p>
              {selectedJobs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Ei keikkoja.</p>}
              {selectedJobs.map((job) => (
                <JobRow key={job.id} job={job} dimmed={isDone(job)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
