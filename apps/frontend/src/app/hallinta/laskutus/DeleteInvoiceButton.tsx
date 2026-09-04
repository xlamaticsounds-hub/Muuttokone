'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteInvoice } from '@/server/invoice-actions';

export default function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
  compact = false,
  onDeleted,
}: {
  invoiceId: string;
  invoiceNumber: number;
  compact?: boolean;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Poistetaanko lasku #${invoiceNumber} pysyvästi? Tätä ei voi perua.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteInvoice(invoiceId);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/hallinta/laskutus');
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Laskun poisto epäonnistui.');
      setDeleting(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Poista lasku"
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-gray-800 dark:hover:bg-red-900/20"
    >
      <Trash2 className="h-4 w-4" /> {deleting ? 'Poistetaan...' : 'Poista lasku'}
    </button>
  );
}
