import { prisma } from '@/server/db';
import NewInvoiceForm from './NewInvoiceForm';

export const dynamic = 'force-dynamic';

export default async function UusiLaskuPage() {
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
    console.warn('[hallinta/laskutus/uusi] Database unavailable, showing empty contact list', error);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Uusi lasku</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Valitse asiakas, syötä summa ja selite — viitenumero luodaan automaattisesti.</p>
      </div>
      <NewInvoiceForm contacts={contacts} />
    </div>
  );
}
