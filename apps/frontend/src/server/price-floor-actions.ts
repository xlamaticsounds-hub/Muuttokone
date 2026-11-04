'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { getAppState, setAppState } from '@/server/app-state';
import { createLog } from '@/server/repo/logs';
import { PRICE_FLOOR_COSTS_KEY, parsePriceFloorCosts, type PriceFloorCosts } from '@/lib/price-floor';

export type PriceFloorSaveResult = { ok: true } | { ok: false; message: string };

/** Hintalattian kululuvut tietokannasta (ei koodista). null, jos niitä ei ole vielä tallennettu. */
export async function getPriceFloorCosts(): Promise<PriceFloorCosts | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return parsePriceFloorCosts(await getAppState<unknown>(PRICE_FLOOR_COSTS_KEY));
}

export async function savePriceFloorCosts(input: Record<string, unknown>): Promise<PriceFloorSaveResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, message: 'Kirjaudu sisään.' };
  const costs = parsePriceFloorCosts(input);
  if (!costs) return { ok: false, message: 'Tarkista luvut: kaikki kentät ovat pakollisia ja vähintään 0.' };
  await setAppState(PRICE_FLOOR_COSTS_KEY, costs);
  await createLog({
    entityType: 'System',
    entityId: PRICE_FLOOR_COSTS_KEY,
    action: 'price_floor.costs_updated',
    message: 'Hintalattian kululuvut päivitetty',
    actorId: session.user?.email ?? null,
  });
  return { ok: true };
}
