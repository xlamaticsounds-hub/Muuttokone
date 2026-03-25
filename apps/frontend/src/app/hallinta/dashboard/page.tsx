import { prisma } from '@/server/db';
import LeadsTable from '../LeadsTable';

export const dynamic = 'force-dynamic'; // Ensure we always get fresh data

export default async function DashboardPage() {
  let dbUnavailable = false;
  let leads: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];
  let contacts: Awaited<
    ReturnType<
      typeof prisma.contact.findMany<{
        include: { _count: { select: { leads: true } } };
      }>
    >
  > = [];

  try {
    [leads, contacts] = await Promise.all([
      prisma.lead.findMany({
        include: {
          contact: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contact.findMany({
        include: {
          _count: { select: { leads: true } },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 8,
      }),
    ]);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/dashboard] Database unavailable, showing fallback view', error);
  }

  const activeJobs = leads.filter((lead) => lead.status !== 'LOST' && lead.status !== 'ARCHIVED');
  const upcomingJobs = activeJobs
    .filter((lead) => lead.requestedDate)
    .sort((a, b) => new Date(a.requestedDate as Date).getTime() - new Date(b.requestedDate as Date).getTime())
    .slice(0, 5);
  const wonDeals = leads.filter((lead) => lead.status === 'WON').length;

  return (
    <div className="space-y-6">
      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Hallintapaneeli on silti käytettävissä, mutta data ei päivity.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Keikat aktiivisena</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{activeJobs.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Asiakkaat</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Liidejä yhteensä</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{leads.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Voitetut diilit</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{wonDeals}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tulevat keikat</h2>
            <a href="/hallinta/keikat" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Näytä kaikki
            </a>
          </div>
          <div className="space-y-3">
            {upcomingJobs.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei tulevia keikkoja.</p>
            )}
            {upcomingJobs.map((lead) => (
              <div key={lead.id} className="rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lead.contact.firstName || '-'} {lead.contact.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lead.fromAddress || '-'} {'->'} {lead.toAddress || '-'}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {lead.requestedDate ? new Date(lead.requestedDate).toLocaleDateString('fi-FI') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asiakasjutut</h2>
            <a href="/hallinta/asiakkaat" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Näytä kaikki
            </a>
          </div>
          <div className="space-y-3">
            {contacts.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei asiakastietoja.</p>
            )}
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {contact.firstName || '-'} {contact.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email || contact.phone || '-'}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {contact._count.leads} keikkaa
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Viimeisimmät liidit</h2>
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
            Yhteensä: {leads.length}
          </span>
        </div>
        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}
