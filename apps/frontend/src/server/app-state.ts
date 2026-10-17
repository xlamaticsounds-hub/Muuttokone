import { prisma } from '@/server/db';

// Avain–arvo-tila (AppState-taulu). Lukeminen ei koskaan heitä: puuttuva taulu (migraatiota ei
// ole ajettu) tai tietokantavirhe palauttaa null, jotta etusivu ja cron-ajot eivät kaadu siihen.
export async function getAppState<T>(key: string): Promise<T | null> {
  try {
    const row = await prisma.appState.findUnique({ where: { key } });
    return (row?.value as T | undefined) ?? null;
  } catch (error) {
    console.warn(`[app-state] ${key} lukeminen epäonnistui`, error);
    return null;
  }
}

export async function setAppState(key: string, value: unknown): Promise<void> {
  try {
    await prisma.appState.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  } catch (error) {
    console.warn(`[app-state] ${key} tallennus epäonnistui`, error);
  }
}
