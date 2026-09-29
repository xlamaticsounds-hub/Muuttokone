'use client';

import { useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import { renderInvoiceEmailHtml } from '@/lib/invoice-email';
import { computeInvoiceTotals, type InvoiceLineItem } from '@/lib/invoice';
import { generateViitenumero } from '@/lib/reference-number';
import { sendInvoiceEmail } from '@/server/send-invoice';

export default function InvoiceSendPreviewModal({
  invoiceId,
  invoiceNumber,
  customerName,
  items,
  dueDate,
  email,
  resend,
  reminder,
  onClose,
  onSent,
}: {
  invoiceId: string;
  invoiceNumber: number;
  customerName: string;
  items: InvoiceLineItem[];
  dueDate: string | null;
  email: string;
  resend: boolean;
  reminder: boolean; // maksumuistutus — sama tunnistus kuin send-invoice.ts:ssä (sourceInvoiceId)
  onClose: () => void;
  onSent: (sentTo: string) => void;
}) {
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    const body = renderInvoiceEmailHtml({
      customerName,
      invoiceNumber,
      items,
      totalAmount: computeInvoiceTotals(items).gross,
      dueDate: dueDate ? new Date(dueDate) : null,
      viitenumero: generateViitenumero(invoiceNumber),
      customMessage,
      reminder,
    });
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#f9fafb;">${body}</body></html>`;
  }, [customerName, invoiceNumber, items, dueDate, customMessage, reminder]);

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const result = await sendInvoiceEmail(invoiceId, email, { customMessage });
      if (result.success) {
        onSent(result.sentTo);
      } else {
        setSendError(result.message);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Lähetys epäonnistui.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{reminder ? 'Maksumuistutuksen esikatselu' : 'Laskun esikatselu'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="flex max-h-[50vh] w-full flex-col gap-3 overflow-y-auto border-b border-gray-200 p-6 sm:max-h-none sm:w-80 sm:border-b-0 sm:border-r dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Lisäteksti asiakkaalle (valinnainen)
              </label>
              <p className="mb-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                Näkyy summalaatikon alla. Lasku liitetään viestiin PDF-tiedostona.
              </p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="sticky bottom-0 -mx-6 mt-auto flex flex-col gap-2 bg-white px-6 pt-4 pb-2 dark:bg-gray-800">
              {resend && (
                <p className="text-xs text-amber-700 dark:text-amber-400">Lasku on jo lähetetty kerran — tämä lähettää sen uudelleen.</p>
              )}
              {sendError && <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>}
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Lähetetään...' : `Lähetä osoitteeseen ${email}`}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
            <iframe title="Laskun esikatselu" srcDoc={previewHtml} className="h-full w-full border-0" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
