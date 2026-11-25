'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moveTeamCalendarEventsAction } from '@/server/calendar-actions';

// Tiimikalenterin kertasiirto: vanhat keikat ja laatikkomerkinnät yhteisestä kalenterista tiimin omaan.
export default function MoveTeamCalendarButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPending(true);
    setMessage(null);
    const result = await moveTeamCalendarEventsAction();
    setPending(false);
    setMessage(result.message);
    if (result.ok) router.refresh();
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      {message && <span className="text-xs">{message}</span>}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="min-h-9 rounded-md border border-sky-300 bg-white px-3 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-60 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100 dark:hover:bg-sky-900/40"
      >
        {pending ? 'Siirretään…' : label}
      </button>
    </span>
  );
}
