import Link from 'next/link';
import { prisma } from '@/server/db';
import { formatDateFi, formatEuro } from '@/lib/format';
import { computeInvoiceTotals, parseInvoiceItems } from '@/lib/invoice';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LaskutusPage() {
  let dbUnavailable = false;
  let invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];

  try {
    invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/laskutus] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laskutus</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Luodut laskut ja niiden viitenumerot.</p>
        </div>
        <Link
          href="/hallinta/laskutus/uusi"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Uusi lasku
        </Link>
      </div>

      {dbUnavailable ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Tietokantaan ei saatu yhteyttä.</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Ei vielä laskuja.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3">Nro</th>
                <th className="px-4 py-3">Asiakas</th>
                <th className="px-4 py-3">Selite</th>
                <th className="px-4 py-3">Luotu</th>
                <th className="px-4 py-3 text-right">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invoices.map((invoice) => {
                const items = parseInvoiceItems(invoice.items);
                const totals = computeInvoiceTotals(items);
                const description = items.map((i) => i.description).join(', ');
                return (
                  <tr key={invoice.id} className="relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/hallinta/laskutus/${invoice.id}`}
                        className="absolute inset-0"
                        aria-label={`Avaa lasku #${invoice.invoiceNumber} — ${invoice.customerName}`}
                      />
                      <span className="font-medium text-blue-600 dark:text-blue-400">#{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{invoice.customerName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{description}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDateFi(invoice.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatEuro(totals.gross)} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
