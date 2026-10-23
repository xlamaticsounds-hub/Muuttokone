'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { formatClock, formatDuration, formatEntryDate, formatHours, personHours, workedMinutes } from '@/lib/work-time';
import { secondaryButton } from '../form-styles';
import type { LeadOption, TimeEntryDto } from './dto';
import TimeEntryEditor from './TimeEntryEditor';

// Päättyneet työaikamerkinnät (uusin ensin). Muokkaus ja poisto tapahtuvat lomakkeessa.
// lockedLead: liidin sivulla lisäys kohdistuu aina siihen keikkaan eikä keikan nimeä toisteta riveillä.
export default function TimeEntryList({
  entries,
  leadOptions,
  lockedLead,
  emptyMessage = 'Ei työaikamerkintöjä.',
}: {
  entries: TimeEntryDto[];
  leadOptions: LeadOption[];
  lockedLead?: { id: string; label: string };
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<TimeEntryDto | null>(null);
  const [adding, setAdding] = useState(false);

  const refreshAfterSave = () => {
    setEditing(null);
    setAdding(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={() => setAdding(true)} className={`${secondaryButton} flex items-center gap-1.5`}>
          <Plus className="h-4 w-4" />
          Lisää käsin
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {entries.map((entry) => {
            const started = new Date(entry.startedAt);
            const ended = entry.endedAt ? new Date(entry.endedAt) : null;
            const like = { startedAt: started, endedAt: ended, breakMinutes: entry.breakMinutes, crewSize: entry.crewSize };
            return (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <div className="grid min-w-0 flex-1 gap-x-4 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEntryDate(started)}</p>
                    <p className="text-sm tabular-nums text-gray-600 dark:text-gray-300">
                      {formatClock(started)}–{ended ? formatClock(ended) : '…'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    {lockedLead ? (
                      entry.notes ? (
                        <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">{entry.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">–</p>
                      )
                    ) : (
                      <>
                        {entry.leadId ? (
                          <Link href={`/hallinta/liidit/${entry.leadId}`} className="break-words text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                            {entry.jobLabel}
                          </Link>
                        ) : (
                          <p className="break-words text-sm font-medium text-gray-900 dark:text-white">{entry.jobLabel}</p>
                        )}
                        {entry.notes && <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-gray-500 dark:text-gray-400">{entry.notes}</p>}
                      </>
                    )}
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDuration(workedMinutes(like))}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.crewSize} hlö · {formatHours(personHours(like))}
                      {entry.breakMinutes > 0 ? ` · tauko ${entry.breakMinutes} min` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(entry)}
                  aria-label={`Muokkaa: ${entry.jobLabel} ${formatEntryDate(started)}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <TimeEntryEditor mode="edit" entry={editing} leadOptions={leadOptions} lockedLead={lockedLead} onClose={() => setEditing(null)} onSaved={refreshAfterSave} />
      )}
      {adding && <TimeEntryEditor mode="create" leadOptions={leadOptions} lockedLead={lockedLead} onClose={() => setAdding(false)} onSaved={refreshAfterSave} />}
    </div>
  );
}
