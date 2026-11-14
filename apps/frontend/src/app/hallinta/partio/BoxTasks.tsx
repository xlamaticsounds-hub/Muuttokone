'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation, Phone } from 'lucide-react';
import { setBoxRentalStatus } from '@/server/box-rental-actions';
import { cardClass, inputClass } from '../form-styles';
import type { CrewBoxTask } from './dto';

function formatDay(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
}

function TaskRow({ task, todayKey }: { task: CrewBoxTask; todayKey: string }) {
  const router = useRouter();
  const [returned, setReturned] = useState(String(task.quantity));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const delivery = task.kind === 'delivery';

  const mark = async () => {
    setBusy(true);
    setError(null);
    const result = await setBoxRentalStatus(
      delivery ? { id: task.id, status: 'DELIVERED' } : { id: task.id, status: 'RETURNED', returnedQty: Number(returned) },
    );
    setBusy(false);
    if (!result.success) setError(result.message);
    else router.refresh();
  };

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${task.overdue ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-300'}`}>
            {delivery ? 'Toimitus' : 'Nouto'} · {task.dateKey === todayKey ? 'tänään' : formatDay(task.dateKey)}
            {task.overdue ? ' · myöhässä' : ''}
          </p>
          <p className="font-medium text-gray-900 dark:text-white">
            {task.customer} · {task.quantity} laatikkoa
          </p>
          {task.address && <p className="text-sm text-gray-600 dark:text-gray-300">{task.address}</p>}
          {task.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{task.notes}</p>}
        </div>
        <div className="flex gap-2">
          {task.phone && (
            <a href={`tel:${task.phone.replace(/\s+/g, '')}`} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-emerald-700 dark:border-gray-600 dark:text-emerald-300" aria-label={`Soita: ${task.customer}`}>
              <Phone className="h-4 w-4" />
            </a>
          )}
          {task.address && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-blue-700 dark:border-gray-600 dark:text-blue-300"
              aria-label={`Navigoi: ${task.address}`}
            >
              <Navigation className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!delivery && (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            Palautui
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={task.quantity * 2}
              value={returned}
              onChange={(e) => setReturned(e.target.value)}
              className={`${inputClass} mt-0 w-24`}
            />
            / {task.quantity}
          </label>
        )}
        <button
          type="button"
          disabled={busy || (!delivery && returned.trim() === '')}
          onClick={mark}
          className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {delivery ? 'Merkitse toimitetuksi' : 'Merkitse noudetuksi'}
        </button>
      </div>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </li>
  );
}

// Muuttolaatikot: viikon toimitukset (vahvistetut keikat) ja noudot sekä myöhässä olevat.
export default function BoxTasks({ tasks, todayKey }: { tasks: CrewBoxTask[]; todayKey: string }) {
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Laatikot (7 pv)</h2>
      {tasks.length === 0 ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ei laatikoiden toimituksia tai noutoja viikon sisällä.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} todayKey={todayKey} />
          ))}
        </ul>
      )}
    </section>
  );
}
