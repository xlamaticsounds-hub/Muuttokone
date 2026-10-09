'use client';

import { useRouter } from 'next/navigation';
import type { LeadStatus } from '@prisma/client';
import { LEAD_STATUS_LABELS, SELECTABLE_LEAD_STATUSES } from '@/lib/lead-status';

// Liidilistan suodattimet (tila + vain alennuskoodilla tulleet). Arvot elävät URL:ssa,
// sivu suodattaa palvelimella; suodattimen vaihto palaa aina ensimmäiselle sivulle.
export default function LeadFilters({ status, onlyDiscount }: { status: LeadStatus | null; onlyDiscount: boolean }) {
  const router = useRouter();

  const apply = (next: { status: LeadStatus | null; onlyDiscount: boolean }) => {
    const params = new URLSearchParams();
    if (next.status) params.set('tila', next.status);
    if (next.onlyDiscount) params.set('koodi', '1');
    const query = params.toString();
    router.push(query ? `/hallinta/liidit?${query}` : '/hallinta/liidit');
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        aria-label="Suodata tilan mukaan"
        value={status ?? ''}
        onChange={(e) => apply({ status: (e.target.value || null) as LeadStatus | null, onlyDiscount })}
        className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="">Kaikki tilat</option>
        {SELECTABLE_LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-pressed={onlyDiscount}
        onClick={() => apply({ status, onlyDiscount: !onlyDiscount })}
        className={`h-11 rounded-lg border px-4 text-sm font-semibold transition-colors ${
          onlyDiscount
            ? 'border-green-600 bg-green-600 text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
        }`}
      >
        🏠 Käytetty alennuskoodia{onlyDiscount ? ' ✓' : ''}
      </button>
      {(status || onlyDiscount) && (
        <button
          type="button"
          onClick={() => apply({ status: null, onlyDiscount: false })}
          className="h-11 px-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 sm:ml-1"
        >
          Tyhjennä suodattimet
        </button>
      )}
    </div>
  );
}
