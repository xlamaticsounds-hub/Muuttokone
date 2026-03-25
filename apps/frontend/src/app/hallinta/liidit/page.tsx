import { prisma } from '@/server/db';
import LeadsTable from '../LeadsTable';

export const dynamic = 'force-dynamic';

export default async function LiiditPage() {
  const leads = await prisma.lead.findMany({
    include: {
      contact: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liidit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hallinnoi saapuneita tarjouspyyntöjä.</p>
        </div>
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
          {leads.length} yhteensä
        </span>
      </div>
      
      <LeadsTable leads={leads} />
    </div>
  );
}
