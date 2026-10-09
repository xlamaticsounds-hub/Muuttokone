'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/server/actions';
import { LeadStatus } from '@prisma/client';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES, statusOptionsFor } from '@/lib/lead-status';
import CompleteLeadDialog from '../CompleteLeadDialog';
import type { CompleteLeadTarget } from '../complete-target';

export default function StatusSelector({
  leadId,
  initialStatus,
  completeTarget,
}: {
  leadId: string;
  initialStatus: LeadStatus;
  completeTarget: CompleteLeadTarget;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [completing, setCompleting] = useState(false);

  // Tila voi muuttua myös sivun muista painikkeista (LeadCompletionCard) -> router.refresh()
  useEffect(() => setStatus(initialStatus), [initialStatus]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    // Toteutuneeksi vain lopullisen hinnan kanssa (kumppaniraportti ja palkkio)
    if (newStatus === 'COMPLETED') {
      setCompleting(true);
      return;
    }
    setUpdating(true);
    // Optimistic update
    setStatus(newStatus);
    try {
      await updateLeadStatus(leadId, newStatus);
      router.refresh();
    } catch (e) {
      console.error('Failed to update status', e);
      const detail = e instanceof Error ? e.message : String(e);
      alert(`Virhe päivitettäessä tilaa: ${detail}`);
      // Revert on error
      setStatus(initialStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <select
          disabled={updating}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          aria-label="Liidin tila"
          className={`h-10 cursor-pointer appearance-none rounded-full border-0 pl-4 pr-8 text-sm font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${LEAD_STATUS_PILL_CLASSES[status]}`}
        >
          {statusOptionsFor(status).map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>

      {completing && (
        <CompleteLeadDialog
          target={completeTarget}
          onClose={() => setCompleting(false)}
          onSaved={() => {
            setCompleting(false);
            setStatus('COMPLETED');
            router.refresh();
          }}
        />
      )}
    </>
  );
}
