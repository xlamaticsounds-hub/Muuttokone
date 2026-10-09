import type { DiscountCode } from '@prisma/client';
import { prisma } from '@/server/db';
import { checkDiscountCode, normalizeDiscountCode, type DiscountCodeCheck } from '@/features/calculator/discount';

export type DiscountCodeLookup = {
  code: string; // normalisoitu muoto
  record: DiscountCode | null;
  check: DiscountCodeCheck;
};

/**
 * Hakee alennuskoodin ja tarkistaa sen voimassaolon. Koodit tallennetaan isoilla kirjaimilla
 * (normalizeDiscountCode), joten haku ei välitä kirjainkoosta. Ainoa paikka jossa koodin
 * kelpoisuus ratkaistaan — sekä laskurin "Käytä"-tarkistus (api/discount-code) että varauksen
 * tallennus (api/submit) kulkevat tämän kautta.
 */
export async function lookupDiscountCode(raw: unknown, now: Date = new Date()): Promise<DiscountCodeLookup> {
  const code = normalizeDiscountCode(raw);
  if (!code) {
    return { code, record: null, check: { ok: false, reason: 'empty', message: 'Syötä alennuskoodi.' } };
  }
  const record = await prisma.discountCode.findUnique({ where: { code } });
  return { code, record, check: checkDiscountCode(record, now) };
}
