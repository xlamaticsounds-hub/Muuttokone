import { prisma } from '@/server/db';

/**
 * Basic rate limiting using the Database (Logs table).
 * This is suitable for low-traffic sites like Muuttokone.
 * For high traffic, Redis would be preferred.
 */
export async function rateLimit(ip: string, action: string, limit: number = 5, windowMinutes: number = 15) {
  if (!ip) return;

  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await prisma.log.count({
    where: {
      ip,
      action,
      createdAt: { gte: cutoff },
    },
  });

  if (count >= limit) {
    throw new Error('Liian monta pyyntöä. Yritä myöhemmin uudelleen.');
  }
}

export async function logAction(ip: string, action: string, message: string, entityType: string = 'System', entityId: string = 'global', data?: any) {
  await prisma.log.create({
    data: {
      ip,
      action,
      message,
      entityType,
      entityId,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}