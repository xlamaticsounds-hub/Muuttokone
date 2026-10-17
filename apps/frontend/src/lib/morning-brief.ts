import type { LeadStatus } from '@prisma/client';
import { LEAD_STATUS_LABELS } from '@/lib/lead-status';
import { MAX_JOBS_PER_DAY } from '@/lib/calendar-load';

// Aamuyhteenvedon teksti (Discord). Erillään tietokannasta ja lähetyksestä, jotta se on testattava.

export type BriefJob = { time: string | null; customer: string; route: string; status: LeadStatus };
export type BriefTodo = { priority: number; title: string };

export type BriefInput = {
  todayKey: string; // YYYY-MM-DD (Suomen päivä)
  jobsToday: BriefJob[];
  jobsTomorrow: number;
  todos: BriefTodo[]; // avoimet huomiot tärkeysjärjestyksessä
  todosTotal: number;
  overdue: number; // menneen päivän keikkoja käsittelemättä
  dashboardUrl?: string;
};

const WEEKDAYS = ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'];
const MAX_JOB_LINES = 10;
const MAX_TODO_LINES = 5;
const trim = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function buildMorningBrief(input: BriefInput): { title: string; description: string } | null {
  const hasContent = input.jobsToday.length > 0 || input.jobsTomorrow > 0 || input.todosTotal > 0 || input.overdue > 0;
  if (!hasContent) return null;

  const date = new Date(`${input.todayKey}T00:00:00Z`);
  const title = `☀️ Huomenta! ${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()}.${date.getUTCMonth() + 1}.`;
  const lines: string[] = [];

  if (input.jobsToday.length === 0) {
    lines.push('**Tänään ei keikkoja.**');
  } else {
    lines.push(`**Tämän päivän keikat (${input.jobsToday.length})**`);
    const sorted = [...input.jobsToday].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
    for (const job of sorted.slice(0, MAX_JOB_LINES)) {
      const route = job.route ? ` — ${trim(job.route, 70)}` : '';
      lines.push(`• ${job.time ? `${job.time} ` : ''}${trim(job.customer, 40)}${route} _(${LEAD_STATUS_LABELS[job.status]})_`);
    }
    if (sorted.length > MAX_JOB_LINES) lines.push(`…ja ${sorted.length - MAX_JOB_LINES} muuta`);
    if (input.jobsToday.length > MAX_JOBS_PER_DAY) lines.push(`⚠ Päivälle on ${input.jobsToday.length} keikkaa — tarkista kuormitus.`);
  }
  if (input.jobsTomorrow > 0) lines.push(`Huomenna: ${input.jobsTomorrow} ${input.jobsTomorrow === 1 ? 'keikka' : 'keikkaa'}.`);

  if (input.todosTotal > 0) {
    lines.push('', `**Huomio (${input.todosTotal} avointa)**`);
    for (const todo of input.todos.slice(0, MAX_TODO_LINES)) lines.push(`${todo.priority === 1 ? '🔴' : '🟠'} ${trim(todo.title, 110)}`);
    if (input.todosTotal > MAX_TODO_LINES) lines.push(`…ja ${input.todosTotal - MAX_TODO_LINES} muuta`);
  }
  if (input.overdue > 0) lines.push('', `⚠ ${input.overdue} menneen päivän keikkaa ei ole käsitelty (merkitse tehdyksi tai suljettu).`);
  if (input.dashboardUrl) lines.push('', `[Avaa hallintapaneeli](${input.dashboardUrl})`);

  return { title, description: lines.join('\n') };
}
