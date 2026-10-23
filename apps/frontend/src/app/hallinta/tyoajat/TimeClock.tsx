'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Pencil, Play, Plus, Square } from 'lucide-react';
import { adjustBreak, startTimeEntry, stopTimeEntry, type TimeActionResult } from '@/server/time-actions';
import { DEFAULT_CREW_SIZE, formatClock, formatDuration, formatStopwatch, workedMinutes } from '@/lib/work-time';
import { cardClass, inputClass, labelClass } from '../form-styles';
import type { LeadOption, TimeEntryDto } from './dto';
import TimeEntryEditor from './TimeEntryEditor';

const OTHER_JOB = '__other';
const CREW_CHOICES = [1, 2, 3, 4, 5, 6];

/** Palvelimen kello selaimessa: näyttö ei heilu, vaikka laitteen kello olisi väärässä. */
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

// Leimaus: käynnissä olevat työt (sekuntikello, tauot, lopetus) ja uuden työn aloitus.
// lockedLead: liidin sivulla keikka on valmiiksi valittu eikä valintalistaa näytetä.
export default function TimeClock({
  running,
  leadOptions,
  serverNow,
  lockedLead,
  embedded = false,
}: {
  running: TimeEntryDto[];
  leadOptions: LeadOption[];
  serverNow: string;
  lockedLead?: { id: string; label: string };
  embedded?: boolean; // liidin sivulla: aloituslomake ei ole oma korttinsa
}) {
  const router = useRouter();
  const now = useServerClock(serverNow, running.length > 0);

  const runningLeadIds = new Set(running.map((r) => r.leadId).filter(Boolean));
  const available = leadOptions.filter((o) => !runningLeadIds.has(o.id));
  const todayOptions = available.filter((o) => o.today);
  const otherOptions = available.filter((o) => !o.today);

  const [selected, setSelected] = useState<string>(() => (todayOptions.length === 1 ? todayOptions[0].id : ''));
  const [title, setTitle] = useState('');
  const [crew, setCrew] = useState(DEFAULT_CREW_SIZE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TimeEntryDto | null>(null);

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

  const canStart = lockedLead ? !runningLeadIds.has(lockedLead.id) : selected === OTHER_JOB ? title.trim().length > 0 : selected !== '';

  const start = () =>
    perform(async () => {
      const result = await startTimeEntry(
        lockedLead
          ? { leadId: lockedLead.id, crewSize: crew }
          : selected === OTHER_JOB
            ? { title: title.trim(), crewSize: crew }
            : { leadId: selected, crewSize: crew },
      );
      if (result.success) {
        setSelected('');
        setTitle('');
      }
      return result;
    });

  return (
    <div className="space-y-4">
      {running.map((entry) => {
        const startedMs = new Date(entry.startedAt).getTime();
        const net = workedMinutes({ startedAt: new Date(entry.startedAt), endedAt: null, breakMinutes: entry.breakMinutes }, new Date(now));
        return (
          <div
            key={entry.id}
            className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 shadow-sm sm:p-5 dark:border-emerald-600 dark:bg-emerald-900/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Käynnissä
                </p>
                <p className="mt-1 break-words text-lg font-bold text-gray-900 dark:text-white">{entry.jobLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(entry)}
                aria-label="Muokkaa leimaa"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-gray-800 dark:text-emerald-200"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 font-mono text-4xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-5xl dark:text-white" aria-live="off">
              {formatStopwatch(now - startedMs)}
            </p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Alkoi {formatClock(new Date(entry.startedAt))} · {entry.crewSize} hlö · työaikaa {formatDuration(net)}
              {entry.breakMinutes > 0 ? ` (tauot ${entry.breakMinutes} min)` : ''}
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white px-2 dark:border-emerald-700 dark:bg-gray-800">
                <button
                  type="button"
                  disabled={busy || entry.breakMinutes === 0}
                  onClick={() => perform(() => adjustBreak(entry.id, -15))}
                  aria-label="Vähennä taukoa 15 minuuttia"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="px-1 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">Tauko {entry.breakMinutes} min</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => perform(() => adjustBreak(entry.id, 15))}
                  aria-label="Lisää taukoa 15 minuuttia"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => perform(() => stopTimeEntry(entry.id))}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-base font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                <Square className="h-5 w-5 fill-current" />
                Lopeta työ
              </button>
            </div>
          </div>
        );
      })}

      {(!lockedLead || canStart) && (
        <div className={embedded ? 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40' : cardClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lockedLead ? 'Aloita työ tälle keikalle' : 'Aloita työ'}</h2>

          {!lockedLead && (
            <div className="mt-3">
              <label htmlFor="tc-job" className={labelClass}>Keikka</label>
              <select id="tc-job" value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
                <option value="">Valitse keikka…</option>
                {todayOptions.length > 0 && (
                  <optgroup label="Tänään">
                    {todayOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </optgroup>
                )}
                {otherOptions.length > 0 && (
                  <optgroup label="Muut lähipäivien keikat">
                    {otherOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </optgroup>
                )}
                <option value={OTHER_JOB}>Muu työ (kirjoita nimi)…</option>
              </select>
              {selected === OTHER_JOB && (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  placeholder="esim. Varaston siivous"
                  aria-label="Työn nimi"
                  className={inputClass}
                />
              )}
            </div>
          )}

          <fieldset className="mt-3">
            <legend className={labelClass}>Henkilöitä työssä</legend>
            <div className="mt-1 grid grid-cols-6 gap-2">
              {CREW_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCrew(n)}
                  aria-pressed={crew === n}
                  className={`h-11 rounded-lg border text-sm font-bold ${
                    crew === n
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            disabled={busy || !canStart}
            onClick={start}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-5 w-5 fill-current" />
            Aloita työ
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {editing && (
        <TimeEntryEditor
          mode="edit"
          entry={editing}
          leadOptions={leadOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
