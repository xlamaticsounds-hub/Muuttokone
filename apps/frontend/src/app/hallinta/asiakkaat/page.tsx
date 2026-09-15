import { prisma } from '@/server/db';
import AsiakkaatTable, { CustomerWithLeads } from './AsiakkaatTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function AsiakkaatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  let dbUnavailable = false;
  let customers: CustomerWithLeads[] = [];
  let total = 0;

  try {
    [customers, total] = await Promise.all([
      prisma.contact.findMany({
        include: {
          _count: { select: { leads: true } },
          leads: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { status: true, requestedDate: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.contact.count(),
    ]);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/asiakkaat] Database unavailable, showing fallback view', error);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asiakkaat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Asiakastiedot ja viimeisin keikkatilanne.</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          {total} asiakasta
        </span>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta asiakasdata ei päivity.
        </div>
      )}

      <AsiakkaatTable
        customers={customers}
        pagination={
          dbUnavailable
            ? undefined
            : { page, totalPages, total, pageSize: PAGE_SIZE, basePath: '/hallinta/asiakkaat' }
        }
      />
    </div>
  );
}
