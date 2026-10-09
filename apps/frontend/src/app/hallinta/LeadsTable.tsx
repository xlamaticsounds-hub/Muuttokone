'use client';

import { LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '@/server/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalTable, Column, TablePagination } from '@/components/ui/UniversalTable';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES, statusOptionsFor } from '@/lib/lead-status';
import { formatEuro } from '@/lib/format';
import CompleteLeadDialog from './liidit/CompleteLeadDialog';
import { completeTargetFor, type CompleteLeadTarget, type LeadForCompletion } from './liidit/complete-target';

type LeadWithContact = LeadForCompletion;

export default function LeadsTable({
  leads,
  pagination,
}: {
  leads: LeadWithContact[];
  pagination?: TablePagination;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [completing, setCompleting] = useState<CompleteLeadTarget | null>(null);

  const handleStatusChange = async (lead: LeadWithContact, newStatus: LeadStatus) => {
    // Toteutuneeksi vain lopullisen hinnan kanssa (kumppaniraportti ja palkkio)
    if (newStatus === 'COMPLETED') {
      setCompleting(completeTargetFor(lead));
      return;
    }
    setUpdating(lead.id);
    try {
      await updateLeadStatus(lead.id, newStatus);
      router.refresh();
    } catch (e) {
      console.error('Failed to update status', e);
      const detail = e instanceof Error ? e.message : String(e);
      alert(`Virhe päivitettäessä tilaa: ${detail}`);
    } finally {
      setUpdating(null);
    }
  };

  const columns: Column<LeadWithContact>[] = [
    {
      header: 'Pvm',
      cell: (lead) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(lead.createdAt).toLocaleDateString('fi-FI')}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(lead.createdAt).toLocaleTimeString('fi-FI', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      header: 'Asiakas',
      cell: (lead) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {lead.contact.firstName} {lead.contact.lastName}
          </div>
          {lead.discountCode && (
            <span className="mt-0.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-800 dark:bg-green-900/20 dark:text-green-300">
              🏠 {lead.discountPartner ?? lead.discount?.partner ?? 'Kumppani'}-koodi
            </span>
          )}
          <div className="text-xs text-gray-500">{lead.contact.phone}</div>
          <div className="text-xs text-gray-500 opacity-75">{lead.contact.email}</div>
        </div>
      ),
    },
    {
      header: 'Reitti',
      cell: (lead) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex gap-1">
            <span className="text-gray-400">Mistä:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {lead.fromAddress || '-'}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-400">Minne:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {lead.toAddress || '-'}
            </span>
          </div>
          {lead.requestedDate && (
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              📅 {new Date(lead.requestedDate).toLocaleDateString('fi-FI')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Tila',
      cell: (lead) => (
        <div className="flex flex-col items-start gap-1">
          <select
            disabled={updating === lead.id}
            value={lead.status}
            onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
            onClick={(e) => e.stopPropagation()} // Prevent row click
            aria-label="Liidin tila"
            className={`h-9 cursor-pointer rounded-full border-0 px-3 py-0 text-xs font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50 sm:h-7 sm:px-2.5 ${LEAD_STATUS_PILL_CLASSES[lead.status]}`}
          >
            {statusOptionsFor(lead.status).map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {lead.status === 'COMPLETED' && lead.finalPrice != null && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{formatEuro(lead.finalPrice)} €</span>
          )}
        </div>
      ),
    },
    {
      header: 'Lisätiedot',
      className: 'max-w-xs',
      cell: (lead) => (
        <div className="truncate text-gray-500 dark:text-gray-400" title={lead.notes || ''}>
          {lead.notes || '-'}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <UniversalTable
        data={leads}
        columns={columns}
        onRowClick={(lead) => router.push(`/hallinta/liidit/${lead.id}`)}
        pagination={pagination}
        emptyMessage="Ei liidejä näillä suodattimilla."
      />
      {completing && (
        <CompleteLeadDialog
          target={completing}
          onClose={() => setCompleting(null)}
          onSaved={() => {
            setCompleting(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
