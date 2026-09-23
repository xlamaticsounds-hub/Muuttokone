'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createLateFeeInvoice } from '@/server/invoice-actions';
import { computeInvoiceTotals, type InvoiceLineItem } from '@/lib/invoice';
import { formatEuro } from '@/lib/format';

export default function LateFeeModal({
  invoiceId,
  invoiceNumber,
  dueDate,
  items,
  onClose,
}: {
  invoiceId: string;
  invoiceNumber: number;
  dueDate: string; // ISO — kutsuva komponentti varmistaa ettei tämä ole null
  items: InvoiceLineItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const ms = Date.now() - new Date(dueDate).getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }, [dueDate]);

  const principal = useMemo(() => computeInvoiceTotals(items).gross, [items]);
  const ratePercent = parseFloat(rate.replace(',', '.'));
  const previewAmount = Number.isFinite(ratePercent) && ratePercent > 0
    ? Math.round(principal * (ratePercent / 100) * (days / 365) * 100) / 100
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(ratePercent) || ratePercent <= 0) {
      setError('Anna kelvollinen vuosikorko (%).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { id } = await createLateFeeInvoice(invoiceId, ratePercent);
      router.push(`/hallinta/laskutus/${id}/muokkaa`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Maksumuistutuksen luonti epäonnistui.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Maksumuistutus viivästyskorolla</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Lasku #{invoiceNumber} on ollut erääntyneenä <strong>{days} päivää</strong>. Luodaan uusi, muokattava lasku,
            jolla on alkuperäiset rivit ({formatEuro(principal)} €) sekä viivästyskorkorivi.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Vuosikorko (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Esim. 11,5"
                autoFocus
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Korkolain (633/1982) mukainen vähimmäiskorko on Suomen Pankin kulloinkin voimassa oleva viitekorko + 7
                prosenttiyksikköä (kuluttaja-asiakkaat) tai + 8 (yritysasiakkaat). Tarkista ajantasainen viitekorko
                Suomen Pankin sivuilta ennen lähettämistä.
              </p>
            </div>

            {previewAmount !== null && (
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50">
                <span className="text-gray-500 dark:text-gray-400">Viivästyskorko: </span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatEuro(previewAmount)} €</span>
                <span className="text-gray-500 dark:text-gray-400"> ({days} pv × {rate.replace(',', '.')} % p.a.)</span>
              </div>
            )}

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Luodaan...' : 'Luo maksumuistutus'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
