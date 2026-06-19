import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function LokitPage() {
  let logs: Array<{
    id: string;
    entityType: string;
    action: string;
    message: string | null;
    createdAt: Date;
  }> = [];

  try {
    logs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        entityType: true,
        action: true,
        message: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.warn('[hallinta/lokit] Could not load logs', error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lokit</h1>
      <p className="text-gray-600 dark:text-gray-400">Järjestelmän tapahtumalokit ja historia.</p>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Ei tapahtumia.</p>
        ) : (
          <code className="block max-h-[70vh] overflow-y-auto whitespace-pre-wrap p-4 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {logs
              .map(
                (log) =>
                  `[${new Date(log.createdAt).toLocaleString('fi-FI')}] ${log.entityType}.${log.action}${
                    log.message ? ` — ${log.message}` : ''
                  }`
              )
              .join('\n')}
          </code>
        )}
      </div>
    </div>
  );
}
