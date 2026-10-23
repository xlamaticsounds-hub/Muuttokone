'use client';

import { useEffect, useState } from 'react';
import { deleteTimeEntry, saveTimeEntry } from '@/server/time-actions';
import { DEFAULT_CREW_SIZE, MAX_CREW_SIZE, toHelsinkiDateTimeInput } from '@/lib/work-time';
import { inputClass, labelClass, primaryButton, secondaryButton, dangerButton, textareaClass } from '../form-styles';
import type { LeadOption, TimeEntryDto } from './dto';

const OTHER_JOB = '__other';

// Lisää työaika käsin tai korjaa leimaa (unohtunut leimaus, väärä aika, henkilömäärä, tauot).
// Ajat syötetään Suomen aikaa riippumatta selaimen aikavyöhykkeestä.
export default function TimeEntryEditor({
  mode,
  entry,
  leadOptions,
  lockedLead,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  entry?: TimeEntryDto;
  leadOptions: LeadOption[];
  lockedLead?: { id: string; label: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [job, setJob] = useState<string>(() => (lockedLead ? lockedLead.id : ''));
  const [title, setTitle] = useState(entry?.title ?? '');
  const [startedAt, setStartedAt] = useState(() =>
    entry ? toHelsinkiDateTimeInput(new Date(entry.startedAt)) : toHelsinkiDateTimeInput(new Date(Date.now() - 3 * 3_600_000)),
  );
  const [endedAt, setEndedAt] = useState(() =>
    entry ? (entry.endedAt ? toHelsinkiDateTimeInput(new Date(entry.endedAt)) : '') : toHelsinkiDateTimeInput(new Date()),
  );
  const [breakMinutes, setBreakMinutes] = useState(String(entry?.breakMinutes ?? 0));
  const [crewSize, setCrewSize] = useState(String(entry?.crewSize ?? DEFAULT_CREW_SIZE));
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  const isCreate = mode === 'create';
  const needsTitle = isCreate ? job === OTHER_JOB : !entry?.leadId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreate && !job) {
      setError('Valitse keikka tai Muu työ.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await saveTimeEntry({
        id: entry?.id,
        leadId: isCreate && job !== OTHER_JOB ? job : undefined,
        title: needsTitle ? title : null,
        startedAt,
        endedAt: endedAt || null,
        crewSize: Number(crewSize),
        breakMinutes: Number(breakMinutes || 0),
        notes,
      });
      if (result.success) onSaved();
      else setError(result.message);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry || !window.confirm('Poistetaanko tämä työaikamerkintä? Toimintoa ei voi perua.')) return;
    setSaving(true);
    setError(null);
    try {
      const result = await deleteTimeEntry(entry.id);
      if (result.success) onSaved();
      else setError(result.message);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setSaving(false);
    }
  };

  const todayOptions = leadOptions.filter((o) => o.today);
  const otherOptions = leadOptions.filter((o) => !o.today);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 dark:bg-gray-800"
      >
        <h2 id="time-entry-title" className="text-lg font-bold text-gray-900 dark:text-white">
          {isCreate ? 'Lisää työaika käsin' : 'Muokkaa työaikaa'}
        </h2>
        {!isCreate && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{entry?.leadId ? entry.jobLabel : 'Muu työ'}</p>}

        {isCreate && (
          <div className="mt-4">
            {lockedLead ? (
              <>
                <span className={labelClass}>Keikka</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{lockedLead.label}</p>
              </>
            ) : (
              <>
                <label htmlFor="te-job" className={labelClass}>Keikka</label>
                <select id="te-job" value={job} onChange={(e) => setJob(e.target.value)} className={inputClass}>
                  <option value="">Valitse keikka…</option>
                  {todayOptions.length > 0 && (
                    <optgroup label="Tänään">
                      {todayOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherOptions.length > 0 && (
                    <optgroup label="Muut keikat">
                      {otherOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </optgroup>
                  )}
                  <option value={OTHER_JOB}>Muu työ (kirjoita nimi)…</option>
                </select>
              </>
            )}
          </div>
        )}

        {needsTitle && (
          <div className="mt-4">
            <label htmlFor="te-title" className={labelClass}>Työn nimi</label>
            <input id="te-title" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="esim. Varaston siivous" className={inputClass} />
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="te-start" className={labelClass}>Alkoi</label>
            <input id="te-start" type="datetime-local" required value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="te-end" className={labelClass}>Päättyi</label>
            <input id="te-end" type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tyhjä = työ on vielä käynnissä.</p>
          </div>
          <div>
            <label htmlFor="te-break" className={labelClass}>Tauot (min)</label>
            <input id="te-break" type="number" inputMode="numeric" min={0} max={600} step={5} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="te-crew" className={labelClass}>Henkilöitä</label>
            <input id="te-crew" type="number" inputMode="numeric" min={1} max={MAX_CREW_SIZE} value={crewSize} onChange={(e) => setCrewSize(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="te-notes" className={labelClass}>Muistiinpano (valinnainen)</label>
          <textarea id="te-notes" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="esim. odotusaikaa kiinteistön huollon takia" className={textareaClass} />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!isCreate && (
            <button type="button" onClick={remove} disabled={saving} className={dangerButton}>
              Poista
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} disabled={saving} className={secondaryButton}>
              Peruuta
            </button>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Tallennetaan…' : 'Tallenna'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
