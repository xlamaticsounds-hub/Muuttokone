'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/server/actions';
import { LeadStatus } from '@prisma/client';

export default function StatusSelector({ 
  leadId, 
  initialStatus 
}: { 
  leadId: string, 
  initialStatus: LeadStatus 
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    // Optimistic update
    setStatus(newStatus as LeadStatus);
    try {
      await updateLeadStatus(leadId, newStatus as LeadStatus);
      router.refresh();
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Virhe päivitettäessä tilaa');
      // Revert on error
      setStatus(initialStatus);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'NEW': return 'bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PROPOSAL_SENT': return 'bg-orange-100 text-orange-800 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400';
      case 'WON': return 'bg-purple-100 text-purple-800 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400';
      case 'LOST': return 'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="relative inline-block">
      <select
        disabled={updating}
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`h-9 cursor-pointer appearance-none rounded-full border-0 pl-4 pr-8 text-sm font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusColor(status)}`}
      >
        <option value="NEW">Uusi</option>
        <option value="CONTACTED">Oltu yhteydessä</option>
        <option value="PROPOSAL_SENT">Tarjous lähetetty</option>
        <option value="WON">Voitettu</option>
        <option value="LOST">Hävitty</option>
        <option value="ARCHIVED">Arkistoitu</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
