'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatDateFi, formatEuro } from '@/lib/format';
import { generateViitenumero } from '@/lib/reference-number';
import { sendInvoiceEmail } from '@/server/send-invoice';

export default function InvoiceClient({
  id,
  invoiceNumber,
  customerName,
  customerAddress,
  customerEmail,
  description,
  amount,
  vatRate,
  createdAt,
  dueDate,
  sentAt,
}: {
  id: string;
  invoiceNumber: number;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  description: string;
  amount: number;
  vatRate: number;
  createdAt: string;
  dueDate: string | null;
  sentAt: string | null;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const net = amount / (1 + vatRate);
  const vat = amount - net;
  const viitenumero = generateViitenumero(invoiceNumber);

  const handleSend = async () => {
    if (!customerEmail) return;
    const confirmed = window.confirm(`Lähetetäänkö lasku sähköpostitse osoitteeseen ${customerEmail}?`);
    if (!confirmed) return;

    setSending(true);
    setFeedback(null);
    try {
      const result = await sendInvoiceEmail(id);
      if (result.success) {
        setFeedback({ ok: true, message: `Lasku lähetetty osoitteeseen ${result.sentTo}.` });
        router.refresh();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    } catch (err) {
      setFeedback({ ok: false, message: err instanceof Error ? err.message : 'Lähetys epäonnistui.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/hallinta/laskutus"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin laskuihin
        </Link>
        <div className="flex items-center gap-3">
          {feedback && (
            <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {feedback.message}
            </p>
          )}
          <button
            onClick={handleSend}
            disabled={sending || !customerEmail}
            title={!customerEmail ? 'Asiakkaalla ei ole sähköpostiosoitetta' : undefined}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Mail className="h-4 w-4" />
            {sending ? 'Lähetetään...' : sentAt ? 'Lähetä uudelleen' : 'Lähetä lasku sähköpostitse'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" /> Tulosta / Tallenna PDF
          </button>
        </div>
      </div>

      {sentAt && !feedback && (
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 print:hidden">
          Lähetetty sähköpostitse {formatDateFi(new Date(sentAt))}.
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none dark:border-gray-700 dark:bg-gray-800 print:dark:bg-white print:text-black">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">Muuttokone.fi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">+358 45 847 0755</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">info@muuttokone.fi</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">Y-tunnus: {siteConfig.businessId}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-black">Lasku</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">Nro {invoiceNumber}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">{formatDateFi(new Date(createdAt))}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8 rounded-md bg-gray-50 p-4 dark:bg-gray-900/50 print:bg-gray-50">
          <p className="text-xs font-medium uppercase text-gray-500">Laskutettava</p>
          <p className="font-medium text-gray-900 dark:text-white print:text-black">{customerName}</p>
          {customerAddress && <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{customerAddress}</p>}
          {customerEmail && <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{customerEmail}</p>}
        </div>

        {/* Line item */}
        <table className="mb-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700">
              <th className="py-2">Kuvaus</th>
              <th className="py-2 text-right">ALV</th>
              <th className="py-2 text-right">Hinta (sis. alv)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-2 text-gray-900 dark:text-white print:text-black">{description}</td>
              <td className="py-2 text-right text-gray-700 dark:text-gray-300 print:text-black">{vatRate === 0 ? '0 %' : '25,5 %'}</td>
              <td className="py-2 text-right font-medium text-gray-900 dark:text-white print:text-black">{formatEuro(amount)} €</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
          <div className="flex justify-between text-gray-600 dark:text-gray-400 print:text-gray-700">
            <span>Veroton hinta</span>
            <span>{formatEuro(net)} €</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400 print:text-gray-700">
            <span>ALV</span>
            <span>{formatEuro(vat)} €</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white print:text-black">
            <span>Yhteensä</span>
            <span>{formatEuro(amount)} €</span>
          </div>
        </div>

        {/* Payment details */}
        <div className="mt-8 rounded-md bg-gray-50 p-4 dark:bg-gray-900/50 print:bg-gray-50">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500">Maksutiedot</p>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Saaja</span>
            <span className="text-right font-medium text-gray-900 dark:text-white print:text-black">Muuttokone.fi</span>
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Tilinumero (IBAN)</span>
            <span className="text-right font-medium text-gray-900 dark:text-white print:text-black">{siteConfig.bankAccount}</span>
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Viitenumero</span>
            <span className="text-right font-bold text-gray-900 dark:text-white print:text-black">{viitenumero}</span>
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Eräpäivä</span>
            <span className="text-right font-medium text-gray-900 dark:text-white print:text-black">{dueDate ? formatDateFi(new Date(dueDate)) : 'Sovitaan erikseen'}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 print:text-gray-500">
          Kiitos, että valitsit Muuttokone.fi:n! Maksathan viitenumerolla, jotta maksu kohdistuu oikein.
        </p>
      </div>
    </div>
  );
}
