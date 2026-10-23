'use client';

import { formatDuration, formatHours, personHours, revenuePerPersonHour, workedMinutes } from '@/lib/work-time';
import { formatEuro } from '@/lib/format';
import TimeClock from '../../tyoajat/TimeClock';
import TimeEntryList from '../../tyoajat/TimeEntryList';
import type { TimeEntryDto } from '../../tyoajat/dto';

// Liidin sivun työaikakortti: leimaus tälle keikalle, keikan työajat yhteensä ja hinta per henkilötunti.
export default function LeadWorkTimeCard({
  lead,
  running,
  entries,
  price,
  serverNow,
}: {
  lead: { id: string; label: string };
  running: TimeEntryDto[];
  entries: TimeEntryDto[]; // päättyneet
  price: number | null;
  serverNow: string;
}) {
  const like = entries.map((e) => ({ startedAt: new Date(e.startedAt), endedAt: e.endedAt ? new Date(e.endedAt) : null, breakMinutes: e.breakMinutes, crewSize: e.crewSize }));
  const minutes = like.reduce((sum, e) => sum + workedMinutes(e), 0);
  const hours = like.reduce((sum, e) => sum + personHours(e), 0);
  const perHour = revenuePerPersonHour(price, hours);

  return (
    <div className="space-y-4">
      <TimeClock running={running} leadOptions={[]} serverNow={serverNow} lockedLead={lead} embedded />

      {entries.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { label: 'Työaika', value: formatDuration(minutes) },
            { label: 'Henkilötunnit', value: formatHours(hours) },
            { label: '€ / henkilötunti', value: perHour != null ? `${formatEuro(perHour)} €` : '–' },
          ].map((tile) => (
            <div key={tile.label} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 sm:block sm:text-center dark:bg-gray-900/50">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{tile.label}</p>
              <p className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{tile.value}</p>
            </div>
          ))}
        </div>
      )}
      {entries.length > 0 && price != null && (
        <p className="text-xs text-gray-500 dark:text-gray-400">Hinta {formatEuro(price)} € ÷ henkilötunnit, ennen kuluja (polttoaine, kalusto, ajo).</p>
      )}

      <TimeEntryList entries={entries} leadOptions={[]} lockedLead={lead} emptyMessage="Tälle keikalle ei ole vielä kirjattu työaikaa." />
    </div>
  );
}
