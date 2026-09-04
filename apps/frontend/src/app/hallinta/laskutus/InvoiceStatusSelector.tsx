'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoiceStatus } from '@/server/invoice-actions';
import { InvoiceStatus } from '@prisma/client';

export default function InvoiceStatusSelector({
  invoiceId,
  initialStatus,
}: {
  invoiceId: string;
  initialStatus: InvoiceStatus;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const previous = status;
    // Optimistic update
    setStatus(newStatus as InvoiceStatus);
    try {
      await updateInvoiceStatus(invoiceId, newStatus as InvoiceStatus);
      router.refresh();
    } catch (e) {
      console.error('Failed to update invoice status', e);
      alert('Virhe päivitettäessä laskun tilaa');
      setStatus(previous);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-400';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PAID':
        return 'bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="relative inline-block print:hidden" onClick={(e) => e.stopPropagation()}>
      <select
        disabled={updating}
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`h-8 cursor-pointer appearance-none rounded-full border-0 pl-3 pr-7 text-xs font-semibold shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusColor(status)}`}
      >
        <option value="DRAFT">Luonnos</option>
        <option value="SENT">Lähetetty</option>
        <option value="PAID">Maksettu</option>
        <option value="OVERDUE">Maksu myöhässä</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
        <svg className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
