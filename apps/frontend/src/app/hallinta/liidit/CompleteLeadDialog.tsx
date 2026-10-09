'use client';

import { useState } from 'react';
import { computeCommission } from '@/features/calculator/discount';
import { parseEuroAmount } from '@/server/lead-format';
import { markLeadCompleted } from '@/server/lead-completion-actions';
import { formatEuro } from '@/lib/format';
import type { CompleteLeadTarget } from './complete-target';

// "Merkitse toteutuneeksi" — lopullinen laskutettu hinta (sis. alv). Kumppanin palkkio
// maksetaan vain toteutuneista muutoista tästä hinnasta, joten sen esikatselu näytetään heti.
export default function CompleteLeadDialog({
  target,
  onClose,
  onSaved,
}: {
  target: CompleteLeadTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(target.defaultPrice !== null ? String(target.defaultPrice).replace('.', ',') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseEuroAmount(value);
  const commission =
    amount !== null && amount > 0 && target.commissionPercent !== null
      ? computeCommission(amount, target.commissionPercent)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await markLeadCompleted(target.leadId, value);
    setSaving(false);
    if (result.success) onSaved();
    else setError(result.message);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-lead-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 dark:bg-gray-800"
      >
        <h2 id="complete-lead-title" className="text-lg font-bold text-gray-900 dark:text-white">
          {target.isEdit ? 'Korjaa lopullinen hinta' : 'Merkitse toteutuneeksi'}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{target.customerName}</p>

        <label htmlFor="final-price" className="mt-4 block text-sm font-semibold text-gray-700 dark:text-gray-200">
          Lopullinen laskutettu hinta (€ sis. alv)
        </label>
        <input
          id="final-price"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="esim. 648 tai 648,50"
          className="mt-1 h-14 w-full rounded-xl border border-gray-300 px-4 text-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
        {target.defaultPrice !== null && !target.isEdit && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Oletuksena hinta-arvio{target.partnerName ? ' alennuksen jälkeen' : ''}. Muuta, jos laskutettu hinta poikkesi.
          </p>
        )}

        {commission && (
          <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
            🏠 {target.partnerName ?? 'Kumppanin'} palkkio {target.commissionPercent} % ={' '}
            <strong>{formatEuro(commission.commissionAmount)} €</strong>
            <span className="block text-xs opacity-80">laskettuna hinnasta alv 0 % ({formatEuro(commission.finalPriceNet)} €)</span>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-12 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Peruuta
          </button>
          <button
            type="submit"
            disabled={saving || amount === null || amount <= 0}
            className="h-12 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Tallennetaan...' : target.isEdit ? 'Tallenna hinta' : '✅ Toteutunut'}
          </button>
        </div>
      </form>
    </div>
  );
}
