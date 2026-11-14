'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Play, Plus, Square } from 'lucide-react';
import { adjustBreak, startTimeEntry, stopTimeEntry, type TimeActionResult } from '@/server/time-actions';
import { DEFAULT_CREW_SIZE, formatClock, formatDuration, formatStopwatch, workedMinutes } from '@/lib/work-time';
import { cardClass, inputClass, labelClass } from '../form-styles';
import type { CrewEntryDto, CrewStartOption, CrewWorker } from './dto';

const OTHER_JOB = '__other';

/** Palvelimen kello selaimessa: näyttö ei heilu, vaikka puhelimen kello olisi väärässä. */
function useServerClock(serverNow: string, active: boolean) {
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  const offset = useRef(0);
  useEffect(() => {
    offset.current = new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

// Partion leimaus: käynnissä olevat työt (sekuntikello, tauko, lopetus) ja uuden aloitus valituilla työntekijöillä.
export default function PartioClock({
  running,
  startOptions,
  workers,
  workerNames,
  serverNow,
}: {
  running: CrewEntryDto[];
  startOptions: CrewStartOption[];
  workers: CrewWorker[];
  workerNames: Record<string, string>;
  serverNow: string;
}) {
  const router = useRouter();
  const now = useServerClock(serverNow, running.length > 0);
  const runningLeadIds = new Set(running.map((r) => r.leadId).filter(Boolean));
  const available = startOptions.filter((o) => !runningLeadIds.has(o.id));
  const todayOptions = available.filter((o) => o.today);
  const otherOptions = available.filter((o) => !o.today);

  const [selected, setSelected] = useState(() => (todayOptions.length === 1 ? todayOptions[0].id : ''));
  const [title, setTitle] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [crew, setCrew] = useState(DEFAULT_CREW_SIZE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perform = async (action: () => Promise<TimeActionResult>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.success) router.refresh();
      else setError(result.message);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setBusy(false);
    }
  };

  const hasWorkers = workers.length > 0;
  const jobChosen = selected === OTHER_JOB ? title.trim().length > 0 : selected !== '';
  const canStart = jobChosen && (!hasWorkers || chosen.length > 0);

  const toggle = (id: string) => setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const start = () =>
    perform(async () => {
      const result = await startTimeEntry({
        leadId: selected === OTHER_JOB ? null : selected,
        title: selected === OTHER_JOB ? title : null,
        workerIds: hasWorkers ? chosen : undefined,
        crewSize: hasWorkers ? chosen.length : crew,
      });
      if (result.success) {
        setSelected('');
        setTitle('');
        setChosen([]);
      }
      return result;
    });

  return (
    <section className="space-y-3">
      {running.map((entry) => {
        const ms = now - new Date(entry.startedAt).getTime();
        const minutes = workedMinutes({ startedAt: new Date(entry.startedAt), endedAt: null, breakMinutes: entry.breakMinutes }, new Date(now));
        const names = entry.workerIds.map((id) => workerNames[id] ?? '?');
        return (
          <div key={entry.id} className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">Työ käynnissä · alkoi {formatClock(new Date(entry.startedAt))}</p>
                <p className="truncate text-base font-semibold text-gray-900 dark:text-white">{entry.jobLabel}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{names.length ? names.join(', ') : `${entry.crewSize} henkilöä`}</p>
              </div>
              <p className="font-mono text-3xl font-bold tabular-nums text-emerald-900 dark:text-emerald-200">{formatStopwatch(ms)}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Tauko {entry.breakMinutes} min</span>
              <button type="button" disabled={busy || entry.breakMinutes <= 0} onClick={() => perform(() => adjustBreak(entry.id, -15))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800" aria-label="Vähennä taukoa 15 min">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" disabled={busy} onClick={() => perform(() => adjustBreak(entry.id, 15))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800" aria-label="Lisää taukoa 15 min">
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Työaika {formatDuration(minutes)}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Lopetetaanko työ nyt?')) perform(() => stopTimeEntry(entry.id));
                }}
                className="ml-auto flex h-12 items-center gap-2 rounded-xl bg-red-600 px-5 text-base font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Lopeta
              </button>
            </div>
          </div>
        );
      })}

      <div className={`${cardClass} space-y-3`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aloita työ</h2>
        <label className="block">
          <span className={labelClass}>Keikka</span>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
            <option value="">Valitse keikka</option>
            {todayOptions.length > 0 && (
              <optgroup label="Tänään">
                {todayOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            )}
            {otherOptions.length > 0 && (
              <optgroup label="Muut päivät">
                {otherOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={OTHER_JOB}>Muu työ (kirjoita nimi)</option>
          </select>
        </label>
        {selected === OTHER_JOB && (
          <label className="block">
            <span className={labelClass}>Työn nimi</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Esim. Auton huolto, laatikoiden haku" className={inputClass} />
          </label>
        )}
        {hasWorkers ? (
          <fieldset>
            <legend className={labelClass}>Ketkä ovat mukana</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {workers.map((w) => {
                const on = chosen.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(w.id)}
                    className={`h-11 rounded-full border px-4 text-sm font-semibold ${
                      on
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {on ? '✓ ' : ''}
                    {w.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <label className="block">
            <span className={labelClass}>Henkilöitä</span>
            <select value={crew} onChange={(e) => setCrew(Number(e.target.value))} className={inputClass}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Työntekijälista puuttuu: toimisto voi lisätä partion jäsenet, jolloin tunnit kirjautuvat nimillä.</span>
          </label>
        )}
        {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="button"
          disabled={busy || !canStart}
          onClick={start}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play className="h-5 w-5" />
          Aloita työ nyt
        </button>
      </div>
    </section>
  );
}
