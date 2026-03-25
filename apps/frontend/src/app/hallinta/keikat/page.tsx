import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function KeikatPage() {
  let dbUnavailable = false;
  let jobs: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];

  try {
    jobs = await prisma.lead.findMany({
      include: {
        contact: true,
      },
      where: {
        status: {
          notIn: ['LOST', 'ARCHIVED'],
        },
      },
      orderBy: [{ requestedDate: 'asc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/keikat] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keikat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktiiviset ja tulevat muutot.</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          {jobs.length} aktiivista
        </span>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta keikkadata ei päivity.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Asiakas</th>
                <th className="px-4 py-3">Muuttopäivä</th>
                <th className="px-4 py-3">Reitti</th>
                <th className="px-4 py-3">Tila</th>
                <th className="px-4 py-3">Yhteys</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {jobs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500 dark:text-gray-400" colSpan={5}>
                    Ei aktiivisia keikkoja.
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {job.contact.firstName || '-'} {job.contact.lastName || ''}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {job.requestedDate ? new Date(job.requestedDate).toLocaleDateString('fi-FI') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div className="max-w-md truncate">
                      {job.fromAddress || '-'} {'->'} {job.toAddress || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {job.contact.phone || job.contact.email || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
