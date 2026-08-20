import { prisma } from '@/server/db';
import { notFound } from 'next/navigation';
import { getStoredPrice, parseLeadFormData } from '@/server/lead-format';
import ReceiptClient from './ReceiptClient';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { contact: true },
  });

  if (!lead) {
    notFound();
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed, exact, low, high } = getStoredPrice(pfd);
  // Kuitille kelpaa vain yksittäinen luku (ei haarukkaa, esim. "99–129") — jos vahvistettu
  // hinta on haarukka, jätetään se esitäyttämättä ja pyydetään ihmistä syöttämään lopullinen summa.
  const confirmedNumeric = confirmed !== null && /^\d+(\.\d+)?$/.test(confirmed) ? Number(confirmed) : null;
  const prefillAmount = confirmedNumeric ?? exact ?? (low !== null && high !== null ? Math.round((low + high) / 2) : null);

  const customerName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ');
  const customerAddress = [lead.contact.street, lead.contact.postalCode, lead.contact.city]
    .filter(Boolean)
    .join(', ');

  return (
    <ReceiptClient
      leadId={lead.id}
      customerName={customerName || '-'}
      customerEmail={lead.contact.email}
      customerPhone={lead.contact.phone}
      customerAddress={customerAddress || null}
      fromAddress={lead.fromAddress}
      toAddress={lead.toAddress}
      requestedDate={lead.requestedDate ? lead.requestedDate.toISOString() : null}
      prefillAmount={prefillAmount}
    />
  );
}
