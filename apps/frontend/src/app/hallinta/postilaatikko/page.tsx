import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function PostilaatikkoPage() {
  let messages: Array<{
    id: string;
    message: string | null;
    createdAt: Date;
    data: unknown;
  }> = [];

  try {
    messages = await prisma.log.findMany({
      where: {
        action: 'inbox.message',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        message: true,
        createdAt: true,
        data: true,
      },
    });
  } catch (error) {
    console.warn('[hallinta/postilaatikko] Could not load inbox messages', error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Postilaatikko</h1>
      <p className="text-gray-600 dark:text-gray-400">Viestit ja ilmoitukset.</p>
      
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {messages.length === 0 && (
          <div className="p-4">
            <p className="font-medium text-gray-900 dark:text-white">Ei viestejä</p>
            <p className="text-sm text-gray-500">Yhteydenottolomakkeen viestit näkyvät täällä.</p>
          </div>
        )}

        {messages.map((entry) => {
          const payload = (entry.data ?? {}) as {
            name?: string;
            email?: string;
            phone?: string;
            message?: string;
          };

          return (
            <div key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{payload.name || 'Yhteydenotto'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {payload.email || '-'} {payload.phone ? `• ${payload.phone}` : ''}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.createdAt).toLocaleString('fi-FI')}
                </p>
              </div>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {payload.message || entry.message || '-'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
