'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteTimeEntry, saveTimeEntry } from '@/server/time-actions';
import { formatClock, formatDuration, formatEntryDate, formatHours, toHelsinkiDateTimeInput, workedMinutes } from '@/lib/work-time';
import { cardClass, dangerButton, inputClass, labelClass, primaryButton, secondaryButton, textareaClass } from '../form-styles';
import type { CrewEntryDto, CrewWorker, WorkerHoursDto } from './dto';
import { CREW_EDIT_DAYS } from '@/lib/access';



function HoursTable({ title, rows, team }: { title: string; rows: WorkerHoursDto[]; team: { personHours: number; jobs: number } }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {team.jobs} työtä · {formatHours(team.personHours)} henkilötunteja
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ei nimettyjä tunteja.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-700">
          {rows.map((r) => (
            <li key={r.workerId} className="flex justify-between py-1.5">
              <span className="text-gray-800 dark:text-gray-200">{r.name}</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatDuration(r.minutes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryEditor({ entry, workers, onDone }: { entry: CrewEntryDto; workers: CrewWorker[]; onDone: () => void }) {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(toHelsinkiDateTimeInput(new Date(entry.startedAt)));
  const [endedAt, setEndedAt] = useState(entry.endedAt ? toHelsinkiDateTimeInput(new Date(entry.endedAt)) : '');
  const [breakMinutes, setBreakMinutes] = useState(entry.breakMinutes);
  const [chosen, setChosen] = useState<string[]>(entry.workerIds);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Leimalla jo olleet näkyvät, vaikka heidät olisi poistettu käytöstä
  const selectable = workers.filter((w) => w.active || entry.workerIds.includes(w.id));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await saveTimeEntry({
      id: entry.id,
      title: entry.title,
      startedAt,
      endedAt,
      breakMinutes,
      crewSize: entry.crewSize,
      workerIds: selectable.length > 0 ? chosen : undefined,
      notes,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    onDone();
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Alku</span>
          <input type="datetime-local" required value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Loppu</span>
          <input type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Tauot (min)</span>
          <input type="number" min={0} max={600} step={5} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)} className={inputClass} />
        </label>
      </div>
      {selectable.length > 0 && (
        <fieldset>
          <legend className={labelClass}>Mukana</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectable.map((w) => {
              const on = chosen.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChosen((prev) => (on ? prev.filter((x) => x !== w.id) : [...prev, w.id]))}
                  className={`h-10 rounded-full border px-3 text-sm font-semibold ${
                    on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <label className="block">
        <span className={labelClass}>Lisätiedot</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={textareaClass} />
      </label>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          Tallenna
        </button>
        <button type="button" onClick={onDone} className={secondaryButton}>
          Peruuta
        </button>
      </div>
    </form>
  );
}

// Viikon ja kuukauden tunnit henkilöittäin sekä viimeisen viikon leimat korjattavina.
export default function PartioEntries({
  entries,
  workers,
  weekHours,
  monthHours,
  teamWeek,
  teamMonth,
  canEditAll,
}: {
  entries: CrewEntryDto[];
  workers: CrewWorker[];
  weekHours: WorkerHoursDto[];
  monthHours: WorkerHoursDto[];
  teamWeek: { personHours: number; jobs: number };
  teamMonth: { personHours: number; jobs: number };
  canEditAll: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const names = new Map(workers.map((w) => [w.id, w.name]));

  const remove = async (entry: CrewEntryDto) => {
    if (!window.confirm(`Poistetaanko leima ${entry.jobLabel}?`)) return;
    setError(null);
    const result = await deleteTimeEntry(entry.id);
    if (!result.success) setError(result.message);
    else router.refresh();
  };

  return (
    <section className={`${cardClass} space-y-4`}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Työajat</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <HoursTable title="Tämä viikko" rows={weekHours} team={teamWeek} />
        <HoursTable title="Tämä kuukausi" rows={monthHours} team={teamMonth} />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Viimeiset 7 päivää</h3>
        {!canEditAll && <p className="text-xs text-gray-500 dark:text-gray-400">Voit korjata leimoja {CREW_EDIT_DAYS} päivää taaksepäin. Vanhemmat korjaa toimisto.</p>}
        {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ei päättyneitä leimoja.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map((entry) => {
              const start = new Date(entry.startedAt);
              const end = entry.endedAt ? new Date(entry.endedAt) : null;
              const minutes = workedMinutes({ startedAt: start, endedAt: end, breakMinutes: entry.breakMinutes });
              const who = entry.workerIds.map((id) => names.get(id) ?? '?');
              return (
                <li key={entry.id} className="py-3">
                  {editing === entry.id ? (
                    <EntryEditor entry={entry} workers={workers} onDone={() => setEditing(null)} />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{entry.jobLabel}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formatEntryDate(start)} {formatClock(start)}–{end ? formatClock(end) : '…'} · {formatDuration(minutes)}
                          {entry.breakMinutes > 0 ? ` (tauko ${entry.breakMinutes} min)` : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{who.length ? who.join(', ') : `${entry.crewSize} henkilöä`}</p>
                        {entry.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{entry.notes}</p>}
                      </div>
                      {entry.editable && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditing(entry.id)} className={secondaryButton} aria-label="Korjaa leimaa">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => remove(entry)} className={dangerButton} aria-label="Poista leima">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
