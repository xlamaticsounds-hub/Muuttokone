'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { parseDiscountCodeInput, type DiscountCodeFormValues } from '@/lib/discount-code-input';

export type DiscountCodeActionResult = { success: true; id: string } | { success: false; message: string };

/**
 * Lisää uuden (id = null) tai tallentaa muokatun alennuskoodin hallinnasta. Koodin teksti
 * normalisoidaan isoiksi kirjaimiksi, joten "km-mankkaa" ja "KM-MANKKAA" ovat sama koodi.
 * Liideille on tallennettu käytetty koodi ja prosentit varaushetkellä, joten muokkaus ei
 * muuta jo tehtyjä kauppoja.
 */
export async function saveDiscountCode(id: string | null, values: DiscountCodeFormValues): Promise<DiscountCodeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  const parsed = parseDiscountCodeInput(values);
  if (!parsed.ok) return { success: false, message: parsed.message };
  const data = parsed.data;

  try {
    const sameCode = await prisma.discountCode.findUnique({ where: { code: data.code } });
    if (sameCode && sameCode.id !== id) {
      return { success: false, message: `Koodi ${data.code} on jo olemassa.` };
    }

    const saved = id
      ? await prisma.discountCode.update({ where: { id }, data })
      : await prisma.discountCode.create({ data });

    await createLog({
      entityType: 'DiscountCode',
      entityId: saved.id,
      action: id ? 'discount_code.updated' : 'discount_code.created',
      message: `${id ? 'Muokattu' : 'Lisätty'} alennuskoodi ${data.code} (${data.partner}, -${data.discountPercent} %, palkkio ${data.commissionPercent} %)`,
      data: { ...data, validFrom: data.validFrom?.toISOString() ?? null, validUntil: data.validUntil?.toISOString() ?? null },
      actorId: session.user?.email ?? null,
    });

    return { success: true, id: saved.id };
  } catch (error) {
    console.error('[saveDiscountCode] Tallennus epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/** Ota käyttöön / poista käytöstä. Koodeja ei poisteta, jotta vanhat liidit säilyttävät viitteensä. */
export async function setDiscountCodeActive(id: string, active: boolean): Promise<DiscountCodeActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  try {
    const saved = await prisma.discountCode.update({ where: { id }, data: { active } });
    await createLog({
      entityType: 'DiscountCode',
      entityId: id,
      action: active ? 'discount_code.activated' : 'discount_code.deactivated',
      message: `Alennuskoodi ${saved.code} ${active ? 'otettu käyttöön' : 'poistettu käytöstä'}`,
      actorId: session.user?.email ?? null,
    });
    return { success: true, id };
  } catch (error) {
    console.error('[setDiscountCodeActive] Tallennus epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}
