import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function AsiakkaatPage() {
  let dbUnavailable = false;
  let customers: Awaited<
    ReturnType<
      typeof prisma.contact.findMany<{
        include: {
          _count: { select: { leads: true } };
          leads: {
            take: 1;
            orderBy: { createdAt: 'desc' };
            select: { status: true; requestedDate: true; createdAt: true };
          };
        };
      }>
    >
  > = [];

  try {
    customers = await prisma.contact.findMany({
      include: {
        _count: { select: { leads: true } },
        leads: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { status: true, requestedDate: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/asiakkaat] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asiakkaat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Asiakastiedot ja viimeisin keikkatilanne.</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          {customers.length} asiakasta
        </span>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta asiakasdata ei päivity.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Nimi</th>
                <th className="px-4 py-3">Yhteystiedot</th>
                <th className="px-4 py-3">Yritys</th>
                <th className="px-4 py-3">Keikkoja</th>
                <th className="px-4 py-3">Viimeisin status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500 dark:text-gray-400" colSpan={5}>
                    Ei asiakkaita vielä.
                  </td>
                </tr>
              )}
              {customers.map((customer) => {
                const latestLead = customer.leads[0];
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {customer.firstName || '-'} {customer.lastName || ''}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div>{customer.phone || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{customer.companyName || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{customer._count.leads}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {latestLead ? latestLead.status : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
