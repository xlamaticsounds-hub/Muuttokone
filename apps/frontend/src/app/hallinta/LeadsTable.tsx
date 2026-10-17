'use client';

import { LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '@/server/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalTable, Column, TablePagination } from '@/components/ui/UniversalTable';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES, statusOptionsFor, isCompletedStatus } from '@/lib/lead-status';
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

  const statusSelect = (lead: LeadWithContact) => (
    <select
      disabled={updating === lead.id}
      value={lead.status}
      onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
      onClick={(e) => e.stopPropagation()} // Prevent row click
      aria-label="Liidin tila"
      className={`h-10 max-w-full cursor-pointer rounded-full border-0 px-3 py-0 text-sm font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50 sm:h-7 sm:px-2.5 sm:text-xs ${LEAD_STATUS_PILL_CLASSES[lead.status]}`}
    >
      {statusOptionsFor(lead.status).map((s) => (
        <option key={s} value={s}>
          {LEAD_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );

  // Tiivis kortti puhelimelle: nimi + tila ensin, sitten päivä ja reitti, sitten soitto. Koko rivi
  // avaa liidin; tila ja puhelinlinkki ovat omia kosketuskohteitaan (UniversalTable ohittaa niiden klikkaukset).
  const renderMobileCard = (lead: LeadWithContact) => {
    const name = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas';
    const route = [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → ');
    const phone = lead.contact.phone;
    const partner = lead.discountCode ? lead.discountPartner ?? lead.discount?.partner ?? 'Kumppani' : null;
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 break-words text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">{name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Saapui{' '}
              {new Date(lead.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Helsinki' })}{' '}
              klo{' '}
              {new Date(lead.createdAt)
                .toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' })
                .replace(':', '.')}
            </p>
          </div>
          {statusSelect(lead)}
        </div>

        {(lead.requestedDate || route) && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {lead.requestedDate && (
              // requestedDate tallennetaan UTC-keskiyönä, joten päivä luetaan UTC:nä
              <span className="mr-2 font-semibold text-blue-600 dark:text-blue-400">
                {new Date(lead.requestedDate).toLocaleDateString('fi-FI', { timeZone: 'UTC' })}
              </span>
            )}
            {route && <span className="line-clamp-2">{route}</span>}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-blue-700 active:bg-blue-50 dark:border-gray-600 dark:text-blue-300"
            >
              📞 {phone}
            </a>
          )}
          {partner && (
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-800 dark:bg-green-900/20 dark:text-green-300">
              🏠 {partner}-koodi
            </span>
          )}
          {isCompletedStatus(lead.status) && lead.finalPrice != null && (
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatEuro(lead.finalPrice)} €</span>
          )}
        </div>

        {lead.notes && <p className="line-clamp-2 text-xs italic text-gray-500 dark:text-gray-400">{lead.notes}</p>}
      </div>
    );
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
          {statusSelect(lead)}
          {isCompletedStatus(lead.status) && lead.finalPrice != null && (
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
        renderMobileCard={renderMobileCard}
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
