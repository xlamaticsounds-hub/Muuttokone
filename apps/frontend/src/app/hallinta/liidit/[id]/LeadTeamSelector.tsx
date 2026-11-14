'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setLeadTeam } from '@/server/team-actions';
import { TEAMS, teamLabel } from '@/lib/teams';

// Keikan tiimi liidin otsikkorivillä. Omistaja valitsee tiimin; aluevastaava voi vain palauttaa keikan
// jakamattomaksi (silloin se katoaa hänen näkyvistään ja omistaja jakaa sen).
export default function LeadTeamSelector({
  leadId,
  teamId,
  canChooseAny,
}: {
  leadId: string;
  teamId: string | null;
  canChooseAny: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(teamId ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(teamId ?? ''), [teamId]);

  const change = async (next: string) => {
    const nextTeam = next || null;
    if (!canChooseAny && nextTeam === null) {
      const ok = window.confirm('Palautetaanko keikka jakamattomaksi? Se poistuu näkyvistäsi ja omistaja valitsee sille tiimin.');
      if (!ok) return;
    }
    setSaving(true);
    setValue(next);
    const result = await setLeadTeam(leadId, nextTeam);
    setSaving(false);
    if (!result.success) {
      setValue(teamId ?? '');
      alert(result.message);
      return;
    }
    if (!canChooseAny && nextTeam === null) router.push('/hallinta/liidit');
    else router.refresh();
  };

  const unassigned = !value;
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Tiimi</span>
      <select
        aria-label="Keikan tiimi"
        value={value}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
        className={`h-10 rounded-full border px-3 text-sm font-semibold shadow-sm disabled:opacity-50 ${
          unassigned
            ? 'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-200'
            : 'border-gray-300 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {canChooseAny ? (
          <>
            <option value="">❔ Ei tiimiä (jakamaton)</option>
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                📍 {t.name}
              </option>
            ))}
          </>
        ) : (
          <>
            <option value={teamId ?? ''}>📍 {teamLabel(teamId)}</option>
            <option value="">Ei meidän alueen keikka → palauta</option>
          </>
        )}
      </select>
    </label>
  );
}
