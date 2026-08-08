import { prisma } from '@/server/db';
import { notFound } from 'next/navigation';
import { parseInvoiceItems } from '@/lib/invoice';
import InvoiceClient from './InvoiceClient';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { contact: true },
  });

  if (!invoice) {
    notFound();
  }

  const customerAddress = invoice.contact
    ? [invoice.contact.street, invoice.contact.postalCode, invoice.contact.city].filter(Boolean).join(', ')
    : null;

  return (
    <InvoiceClient
      id={invoice.id}
      invoiceNumber={invoice.invoiceNumber}
      customerName={invoice.customerName}
      customerAddress={customerAddress || null}
      customerEmail={invoice.contact?.email ?? null}
      recipientEmail={invoice.recipientEmail}
      items={parseInvoiceItems(invoice.items)}
      createdAt={invoice.createdAt.toISOString()}
      dueDate={invoice.dueDate ? invoice.dueDate.toISOString() : null}
      sentAt={invoice.sentAt ? invoice.sentAt.toISOString() : null}
    />
  );
}
