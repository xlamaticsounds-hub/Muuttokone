'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeOwnPassword } from '@/server/user-actions';
import { cardClass, inputClass, labelClass, primaryButton } from '../form-styles';

export default function PasswordForm({ requireCurrent, minLength, homeHref }: { requireCurrent: boolean; minLength: number; homeHref: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError('Salasanat eivät täsmää.');
      return;
    }
    setSaving(true);
    const result = await changeOwnPassword({ current, next, confirm });
    setSaving(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setDone(true);
    setCurrent('');
    setNext('');
    setConfirm('');
    router.push(homeHref);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className={`${cardClass} space-y-4`}>
      {requireCurrent && (
        <label className="block">
          <span className={labelClass}>Nykyinen salasana</span>
          <input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        </label>
      )}
      <label className="block">
        <span className={labelClass}>Uusi salasana</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Vähintään {minLength} merkkiä. Pitkä lause on hyvä salasana.</span>
      </label>
      <label className="block">
        <span className={labelClass}>Uusi salasana uudelleen</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      {done && <p className="text-sm font-medium text-green-700 dark:text-green-400">Salasana vaihdettu.</p>}
      <button type="submit" disabled={saving} className={`${primaryButton} w-full`}>
        {saving ? 'Tallennetaan…' : 'Tallenna salasana'}
      </button>
    </form>
  );
}
