'use client';

import { Lead, Contact, LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '@/server/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalTable, Column } from '@/components/ui/UniversalTable';

type LeadWithContact = Lead & { contact: Contact };

export default function LeadsTable({ leads }: { leads: LeadWithContact[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdating(leadId);
    try {
      await updateLeadStatus(leadId, newStatus as LeadStatus);
      router.refresh();
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Virhe päivitettäessä tilaa');
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
        <select
          disabled={updating === lead.id}
          value={lead.status}
          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
          onClick={(e) => e.stopPropagation()} // Prevent row click
          className={`h-7 cursor-pointer rounded-full border-0 px-2.5 py-0 text-xs font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50
            ${
              lead.status === 'NEW'
                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30'
                : lead.status === 'CONTACTED'
                ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30'
                : lead.status === 'WON'
                ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-500/30'
                : lead.status === 'LOST'
                ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30'
                : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
            }`}
        >
          <option value="NEW">Uusi</option>
          <option value="CONTACTED">Oltu yhteydessä</option>
          <option value="PROPOSAL_SENT">Tarjous lähetetty</option>
          <option value="WON">Voitettu</option>
          <option value="LOST">Hävitty</option>
          <option value="ARCHIVED">Arkistoitu</option>
        </select>
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
      />
    </div>
  );
}
