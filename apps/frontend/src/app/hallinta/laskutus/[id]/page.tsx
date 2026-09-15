import { prisma } from '@/server/db';
import { notFound } from 'next/navigation';
import { formatAddress, parseInvoiceItems } from '@/lib/invoice';
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

  const customerAddress = formatAddress({
    street: invoice.customerStreet ?? invoice.contact?.street,
    postalCode: invoice.customerPostalCode ?? invoice.contact?.postalCode,
    city: invoice.customerCity ?? invoice.contact?.city,
  });

  return (
    <InvoiceClient
      id={invoice.id}
      invoiceNumber={invoice.invoiceNumber}
      customerName={invoice.customerName}
      customerAddress={customerAddress}
      customerEmail={invoice.customerEmail ?? invoice.contact?.email ?? null}
      recipientEmail={invoice.recipientEmail}
      items={parseInvoiceItems(invoice.items)}
      createdAt={invoice.createdAt.toISOString()}
      dueDate={invoice.dueDate ? invoice.dueDate.toISOString() : null}
      serviceDate={invoice.serviceDate ? invoice.serviceDate.toISOString() : null}
      sentAt={invoice.sentAt ? invoice.sentAt.toISOString() : null}
      status={invoice.status}
    />
  );
}
