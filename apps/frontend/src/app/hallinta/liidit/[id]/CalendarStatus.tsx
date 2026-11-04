'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarX, RefreshCw } from 'lucide-react';
import { resyncLeadCalendarAction } from '@/server/calendar-actions';

// Liidin kalenteritila: onko keikalla Google-kalenterimerkintä ja mihin aikaan se kuuluu liidin
// tietojen mukaan. Nappi siirtää merkinnän oikeaan aikaan tai luo puuttuvan merkinnän.
export default function CalendarStatus({
  leadId,
  inCalendar,
  startLabel,
  timeRecognized,
}: {
  leadId: string;
  inCalendar: boolean;
  /** "ke 4.11. klo 10.00" tai null, jos keikalla ei ole päivää */
  startLabel: string | null;
  /** false, kun toivottu kellonaika on annettu mutta sitä ei tunnistettu (merkitään klo 9.00) */
  timeRecognized: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const sync = () =>
    startTransition(async () => {
      const result = await resyncLeadCalendarAction(leadId);
      setFeedback(result);
      if (result.ok) router.refresh();
    });

  return (
    <div>
      <label className="text-xs font-medium text-gray-500 uppercase">Kalenteri</label>
      <div className="mt-1 flex items-center gap-2">
        {inCalendar ? <CalendarCheck className="h-4 w-4 text-green-600" /> : <CalendarX className="h-4 w-4 text-gray-400" />}
        <span className="font-medium text-gray-900 dark:text-white">{inCalendar ? 'Kalenterissa' : 'Ei kalenterissa'}</span>
      </div>
      {startLabel && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Aika tietojen mukaan: {startLabel}
          {!timeRecognized && ' (kellonaikaa ei tunnistettu)'}
        </p>
      )}
      {startLabel && (
        <button
          type="button"
          onClick={sync}
          disabled={pending}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
          {inCalendar ? 'Päivitä kalenteriin' : 'Lisää kalenteriin'}
        </button>
      )}
      {feedback && (
        <p className={`mt-1 text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{feedback.message}</p>
      )}
    </div>
  );
}
