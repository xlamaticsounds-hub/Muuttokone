'use client';

import Link from 'next/link';
import { Invoice } from '@prisma/client';
import { formatDateFi, formatEuro } from '@/lib/format';
import { computeInvoiceTotals, parseInvoiceItems } from '@/lib/invoice';
import { UniversalTable, Column } from '@/components/ui/UniversalTable';
import InvoiceStatusSelector from './InvoiceStatusSelector';
import DeleteInvoiceButton from './DeleteInvoiceButton';

type InvoiceRow = Invoice & { description: string; totalGross: number };

export default function LaskutusTable({ invoices }: { invoices: Invoice[] }) {
  const rows: InvoiceRow[] = invoices.map((invoice) => {
    const items = parseInvoiceItems(invoice.items);
    const totals = computeInvoiceTotals(items);
    return {
      ...invoice,
      description: items.map((i) => i.description).join(', '),
      totalGross: totals.gross,
    };
  });

  const columns: Column<InvoiceRow>[] = [
    {
      header: 'Nro',
      cell: (invoice) => (
        <Link href={`/hallinta/laskutus/${invoice.id}`} className="font-medium text-blue-600 dark:text-blue-400">
          #{invoice.invoiceNumber}
        </Link>
      ),
    },
    {
      header: 'Asiakas',
      cell: (invoice) => (
        <Link href={`/hallinta/laskutus/${invoice.id}`} className="text-gray-900 dark:text-white">
          {invoice.customerName}
        </Link>
      ),
    },
    {
      header: 'Selite',
      cell: (invoice) => (
        <Link href={`/hallinta/laskutus/${invoice.id}`} className="text-gray-600 dark:text-gray-300">
          {invoice.description}
        </Link>
      ),
    },
    {
      header: 'Luotu',
      cell: (invoice) => (
        <Link href={`/hallinta/laskutus/${invoice.id}`} className="text-gray-500 dark:text-gray-400">
          {formatDateFi(invoice.createdAt)}
        </Link>
      ),
    },
    {
      header: 'Tila',
      cell: (invoice) => (
        <InvoiceStatusSelector invoiceId={invoice.id} initialStatus={invoice.status} />
      ),
    },
    {
      header: 'Summa',
      className: 'text-right',
      cell: (invoice) => (
        <Link href={`/hallinta/laskutus/${invoice.id}`} className="font-semibold text-gray-900 dark:text-white">
          {formatEuro(invoice.totalGross)} €
        </Link>
      ),
    },
    {
      header: 'Toiminnot',
      className: 'text-right',
      cell: (invoice) => (
        <DeleteInvoiceButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} compact />
      ),
    },
  ];

  return <UniversalTable data={rows} columns={columns} emptyMessage="Ei vielä laskuja." />;
}
