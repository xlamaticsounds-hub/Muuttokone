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
/**
 * Tarkistaa rajan JA kirjaa tämän pyynnön lokiin, jotta seuraava tarkistus näkee sen.
 * Pelkkä rateLimit() ei kirjaa mitään: jos samannimistä actionia ei kirjata muualla, raja ei
 * koskaan laukea (näin kävi /api/submit- ja /api/quote-photos-reiteillä). Lokikirjauksen
 * epäonnistuminen ei estä pyyntöä.
 */
export async function rateLimitAndRecord(ip: string, action: string, limit: number, windowMinutes: number) {
  await rateLimit(ip, action, limit, windowMinutes);
  await logAction(ip, action, 'Rajoitettu julkinen pyyntö').catch((error) => {
    console.error(`[rate-limit] Pyynnön kirjaus epäonnistui (${action})`, error);
  });
}
