import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { parseInvoiceItems } from '@/lib/invoice';
import NewInvoiceForm from '../../uusi/NewInvoiceForm';

export const dynamic = 'force-dynamic';

export default async function MuokkaaLaskuaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    notFound();
  }
  // Lähetettyä laskua ei saa enää muokata — asiakas on jo saanut sen kyseisillä tiedoilla.
  if (invoice.sentAt) {
    redirect(`/hallinta/laskutus/${id}`);
  }

  let contacts: { id: string; name: string; email: string | null }[] = [];
  try {
    const rows = await prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true, companyName: true, email: true },
      orderBy: { updatedAt: 'desc' },
    });
    contacts = rows.map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Nimetön asiakas',
      email: c.email,
    }));
  } catch (error) {
    console.warn('[hallinta/laskutus/muokkaa] Database unavailable, showing empty contact list', error);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Muokkaa laskua #{invoice.invoiceNumber}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Muuta tietoja ja tallenna — laskua ei ole vielä lähetetty.</p>
      </div>
      <NewInvoiceForm
        contacts={contacts}
        invoice={{
          id: invoice.id,
          contactId: invoice.contactId,
          customerName: invoice.customerName,
          items: parseInvoiceItems(invoice.items),
          dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
        }}
      />
    </div>
  );
}
