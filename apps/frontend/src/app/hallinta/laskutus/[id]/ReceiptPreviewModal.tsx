'use client';

import { useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import { renderInvoiceReceiptEmailHtml } from '@/lib/receipt-invoice-email';
import { computeInvoiceTotals, type InvoiceLineItem } from '@/lib/invoice';
import { sendReceiptForInvoice } from '@/server/send-invoice-receipt';

export default function ReceiptPreviewModal({
  invoiceId,
  invoiceNumber,
  customerName,
  items,
  email,
  onClose,
  onSent,
}: {
  invoiceId: string;
  invoiceNumber: number;
  customerName: string;
  items: InvoiceLineItem[];
  email: string;
  onClose: () => void;
  onSent: (sentTo: string) => void;
}) {
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Sama kaava kuin send-invoice-receipt.ts:ssä — esikatselunumero on likimääräinen
  // (vuosi lasketaan uudelleen lähetyshetkellä palvelimella), mutta täsmää käytännössä aina.
  const receiptNumber = useMemo(() => `${new Date().getFullYear()}-L${invoiceNumber}`, [invoiceNumber]);
  const totals = useMemo(() => computeInvoiceTotals(items), [items]);

  const previewHtml = useMemo(() => {
    const body = renderInvoiceReceiptEmailHtml({
      customerName,
      receiptNumber,
      invoiceNumber,
      items: items.map((item, i) => ({ id: String(i), label: item.description, amount: item.amount, vatRate: item.vatRate })),
      totalAmount: totals.gross,
    });
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#f9fafb;">${body}</body></html>`;
  }, [customerName, receiptNumber, invoiceNumber, items, totals.gross]);

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const result = await sendReceiptForInvoice(invoiceId, email);
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kuitin esikatselu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="flex max-h-[50vh] w-full flex-col gap-3 overflow-y-auto border-b border-gray-200 p-6 sm:max-h-none sm:w-80 sm:border-b-0 sm:border-r dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kuitti muodostetaan laskun nro {invoiceNumber} riveistä ja summasta ({totals.gross.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €).
            </p>

            <div className="sticky bottom-0 -mx-6 mt-auto flex flex-col gap-2 bg-white px-6 pt-4 pb-2 dark:bg-gray-800">
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
            <iframe title="Kuitin esikatselu" srcDoc={previewHtml} className="h-full w-full border-0" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
