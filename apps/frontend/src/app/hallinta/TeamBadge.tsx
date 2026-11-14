import { TEAM_TAMPERE, teamLabel } from '@/lib/teams';

// Keikan tiimi listoissa omistajille. Helsinki (tavallisin) jätetään merkitsemättä, ettei listaan tule turhaa kohinaa.
export default function TeamBadge({ teamId }: { teamId?: string | null }) {
  if (teamId && teamId !== TEAM_TAMPERE) return null;
  const unassigned = !teamId;
  return (
    <span
      title={unassigned ? 'Jakamaton: valitse tiimi liidin sivulla' : `Tiimi: ${teamLabel(teamId)}`}
      className={`mt-1 mr-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
        unassigned
          ? 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-900/40'
          : 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-900/40'
      }`}
    >
      {unassigned ? '❔ Ei tiimiä' : `📍 ${teamLabel(teamId)}`}
    </span>
  );
}
