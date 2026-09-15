import { prisma } from '@/server/db';
import LeadsTable from '../LeadsTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function LiiditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.lead.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liidit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hallinnoi saapuneita tarjouspyyntöjä.</p>
        </div>
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
          {total} yhteensä
        </span>
      </div>

      <LeadsTable
        leads={leads}
        pagination={{ page, totalPages, total, pageSize: PAGE_SIZE, basePath: '/hallinta/liidit' }}
      />
    </div>
  );
}
