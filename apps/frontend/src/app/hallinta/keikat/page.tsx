import { prisma } from '@/server/db';
import { Lead, Contact, LeadStatus } from '@prisma/client';
import KeikatTable from './KeikatTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const INACTIVE_STATUSES: LeadStatus[] = ['LOST', 'ARCHIVED'];
const ACTIVE_WHERE = {
  status: {
    notIn: INACTIVE_STATUSES,
  },
};

export default async function KeikatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  let dbUnavailable = false;
  let jobs: (Lead & { contact: Contact })[] = [];
  let total = 0;

  try {
    [jobs, total] = await Promise.all([
      prisma.lead.findMany({
        include: {
          contact: true,
        },
        where: ACTIVE_WHERE,
        orderBy: [{ requestedDate: 'asc' }, { createdAt: 'desc' }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.lead.count({ where: ACTIVE_WHERE }),
    ]);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/keikat] Database unavailable, showing fallback view', error);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keikat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktiiviset ja tulevat muutot.</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          {total} aktiivista
        </span>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta keikkadata ei päivity.
        </div>
      )}

      <KeikatTable
        jobs={jobs}
        pagination={
          dbUnavailable
            ? undefined
            : { page, totalPages, total, pageSize: PAGE_SIZE, basePath: '/hallinta/keikat' }
        }
      />
    </div>
  );
}
