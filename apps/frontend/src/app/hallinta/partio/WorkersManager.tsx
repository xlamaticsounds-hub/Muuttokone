'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { addWorker, updateWorker } from '@/server/user-actions';
import { cardClass, inputClass, primaryButton, secondaryButton } from '../form-styles';

export type WorkerDto = { id: string; teamId: string; name: string; active: boolean };

// Tiimin työntekijälista (ei tunnuksia). Käytöstä poistettu ei näy leiman valinnoissa, mutta vanhat tunnit säilyvät.
export default function WorkersManager({ teamId, teamName, workers }: { teamId: string; teamName: string; workers: WorkerDto[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const run = async (key: string, action: () => Promise<{ success: boolean; message?: string }>) => {
    setBusy(key);
    setError(null);
    const result = await action();
    setBusy(null);
    if (!result.success) {
      setError(result.message ?? 'Toiminto epäonnistui.');
      return false;
    }
    router.refresh();
    return true;
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run('add', () => addWorker(teamId, name))) setName('');
  };

  return (
    <div className={`${cardClass} space-y-3`}>
      <h3 className="font-semibold text-gray-900 dark:text-white">{teamName}: työntekijät</h3>
      {workers.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Ei vielä työntekijöitä. Lisää partion jäsenet, niin heidät voi valita leimaan.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {workers.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              {renaming?.id === w.id ? (
                <form
                  className="flex flex-1 flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run(w.id, () => updateWorker(w.id, { name: renaming.name }))) setRenaming(null);
                  }}
                >
                  <input value={renaming.name} onChange={(e) => setRenaming({ id: w.id, name: e.target.value })} className={`${inputClass} mt-0 flex-1`} />
                  <button type="submit" disabled={busy === w.id} className={primaryButton}>
                    Tallenna
                  </button>
                  <button type="button" onClick={() => setRenaming(null)} className={secondaryButton}>
                    Peruuta
                  </button>
                </form>
              ) : (
                <>
                  <span className={`text-sm font-medium ${w.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>{w.name}</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setRenaming({ id: w.id, name: w.name })} className="h-9 rounded-lg px-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                      Nimeä
                    </button>
                    <button
                      type="button"
                      disabled={busy === w.id}
                      onClick={() => run(w.id, () => updateWorker(w.id, { active: !w.active }))}
                      className="h-9 rounded-lg px-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {w.active ? 'Pois käytöstä' : 'Palauta'}
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nimi" className={`${inputClass} mt-0 flex-1`} aria-label="Uuden työntekijän nimi" />
        <button type="submit" disabled={busy === 'add' || !name.trim()} className={secondaryButton}>
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Lisää
          </span>
        </button>
      </form>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
