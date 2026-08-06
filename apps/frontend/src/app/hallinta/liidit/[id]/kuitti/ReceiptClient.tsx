'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatDateFi, formatEuro } from '@/lib/format';

type LineItem = {
  id: string;
  label: string;
  amount: number; // sis. alv (bruttohinta)
  vatRate: number; // 0.255 tai 0
};

const VAT_RATE = 0.255;

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Antaa kuvausrivin textarean kasvaa sisällön mukana, jotta pitkät tekstit
// (esim. käsin kirjoitetut osoitteet) eivät leikkaudu näkymättömiin tulosteessa.
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export default function ReceiptClient({
  leadId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  fromAddress,
  toAddress,
  requestedDate,
  prefillAmount,
}: {
  leadId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: string | null;
  prefillAmount: number | null;
}) {
  const [paymentMethod, setPaymentMethod] = useState('Verkkomaksu');
  const [receiptDate] = useState(() => new Date());
  const [items, setItems] = useState<LineItem[]>(() => [
    {
      id: newId(),
      label: 'Muutto',
      amount: prefillAmount ?? 0,
      vatRate: VAT_RATE,
    },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: newId(), label: '', amount: 0, vatRate: VAT_RATE }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const totals = items.reduce(
    (acc, item) => {
      const net = item.amount / (1 + item.vatRate);
      const vat = item.amount - net;
      return { net: acc.net + net, vat: acc.vat + vat, gross: acc.gross + item.amount };
    },
    { net: 0, vat: 0, gross: 0 },
  );

  const receiptNumber = `${receiptDate.getFullYear()}-${leadId.slice(0, 6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/hallinta/liidit/${leadId}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin liidiin
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" /> Tulosta / Tallenna PDF
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none dark:border-gray-700 dark:bg-gray-800 print:dark:bg-white print:text-black">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo.webp" alt="Muuttokone.fi" className="mb-2 h-10 w-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">Muuttokone.fi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">+358 45 847 0755</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">info@muuttokone.fi</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">Y-tunnus: {siteConfig.businessId}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-black">Kuitti</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">Nro {receiptNumber}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">{formatDateFi(receiptDate)}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-8 rounded-md bg-gray-50 p-4 dark:bg-gray-900/50 print:bg-gray-50">
          <p className="text-xs font-medium uppercase text-gray-500">Asiakas</p>
          <p className="font-medium text-gray-900 dark:text-white print:text-black">{customerName}</p>
          {customerAddress && <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{customerAddress}</p>}
          {customerEmail && <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{customerEmail}</p>}
          {customerPhone && <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{customerPhone}</p>}
          {requestedDate && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">
              Palvelun ajankohta: {formatDateFi(new Date(requestedDate))}
            </p>
          )}
        </div>

        {/* Muuton osoitteet — omana rivittyvänä lohkona, jotta pitkät osoitteet näkyvät kokonaan */}
        {(fromAddress || toAddress) && (
          <div className="mb-8 rounded-md bg-gray-50 p-4 dark:bg-gray-900/50 print:bg-gray-50">
            <p className="text-xs font-medium uppercase text-gray-500">Muuton osoitteet</p>
            {fromAddress && (
              <p className="mt-1 text-sm break-words text-gray-700 dark:text-gray-300 print:text-gray-700">
                <span className="font-medium">Mistä:</span> {fromAddress}
              </p>
            )}
            {toAddress && (
              <p className="mt-1 text-sm break-words text-gray-700 dark:text-gray-300 print:text-gray-700">
                <span className="font-medium">Minne:</span> {toAddress}
              </p>
            )}
          </div>
        )}

        {/* Line items */}
        <table className="mb-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700">
              <th className="py-2">Kuvaus</th>
              <th className="py-2 text-right">ALV</th>
              <th className="py-2 text-right">Hinta (sis. alv)</th>
              <th className="w-8 py-2 print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-2">
                  <textarea
                    ref={autoGrow}
                    rows={1}
                    value={item.label}
                    onChange={(e) => {
                      autoGrow(e.target);
                      updateItem(item.id, { label: e.target.value });
                    }}
                    placeholder="Esim. Varastointi 3 kk"
                    className="w-full resize-none overflow-hidden bg-transparent text-gray-900 focus:outline-none dark:text-white print:text-black"
                  />
                </td>
                <td className="py-2 text-right">
                  <select
                    value={item.vatRate}
                    onChange={(e) => updateItem(item.id, { vatRate: Number(e.target.value) })}
                    className="bg-transparent text-right text-gray-700 focus:outline-none dark:text-gray-300 print:text-black"
                  >
                    <option value={VAT_RATE}>25,5 %</option>
                    <option value={0}>0 %</option>
                  </select>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, { amount: Number(e.target.value) })}
                      className="w-24 bg-transparent text-right font-medium text-gray-900 focus:outline-none dark:text-white print:text-black"
                    />
                    <span className="text-gray-500">€</span>
                  </div>
                </td>
                <td className="py-2 text-right print:hidden">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Poista rivi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addItem}
          className="mb-6 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 print:hidden"
        >
          <Plus className="h-4 w-4" /> Lisää rivi
        </button>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
          <div className="flex justify-between text-gray-600 dark:text-gray-400 print:text-gray-700">
            <span>Veroton hinta</span>
            <span>{formatEuro(totals.net)} €</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400 print:text-gray-700">
            <span>ALV</span>
            <span>{formatEuro(totals.vat)} €</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white print:text-black">
            <span>Yhteensä</span>
            <span>{formatEuro(totals.gross)} €</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
          <span>Maksutapa:</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border-b border-dashed border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none dark:border-gray-600 print:border-none"
          >
            <option>Verkkomaksu</option>
            <option>Käteinen</option>
            <option>Korttimaksu</option>
            <option>Lasku</option>
          </select>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 print:text-gray-500">
          Kiitos, että valitsit Muuttokone.fi:n! Säilytä tämä kuitti — asennustyön osalta se toimii
          tositteena mahdollista kotitalousvähennystä varten.
        </p>
      </div>
    </div>
  );
}
