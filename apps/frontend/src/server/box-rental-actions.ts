'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { setAppState } from '@/server/app-state';
import { createLog } from '@/server/repo/logs';
import { BOX_STOCK_KEY, MAX_RENTAL_QTY, isDateKey, keyToDate, lostOnReturn } from '@/lib/box-inventory';
import { boxRentalWarning, getBoxStockTotal, syncBoxRentalCalendar } from '@/server/box-rentals';

// Laatikkovuokrausten muokkaus hallinnassa (liidin kortti ja Inventaario-sivu). Palauttaa aina tuloksen
// eikä heitä, koska Next.js piilottaa server actionin virheviestit tuotannossa.

export type BoxRentalActionResult = { success: true; warning?: string | null } | { success: false; message: string };

const noSession: BoxRentalActionResult = { success: false, message: 'Kirjaudu sisään.' };
const MAX_STOCK = 100_000;
const MAX_NOTES = 1000;

function refresh(leadId: string) {
  revalidatePath('/hallinta/inventaario');
  revalidatePath(`/hallinta/liidit/${leadId}`);
}

const quantityOf = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= MAX_RENTAL_QTY ? n : null;
};

/** Luo tai päivittää liidin vuokrauksen (määrä, toimitus- ja noutopäivä, lisätiedot). Päivät merkitään vahvistetuiksi. */
export async function saveBoxRental(input: {
  leadId: string;
  quantity: number;
  deliveryKey: string;
  pickupKey: string;
  notes?: string | null;
}): Promise<BoxRentalActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  const quantity = quantityOf(input.quantity);
  if (!quantity) return { success: false, message: `Määrän pitää olla 1–${MAX_RENTAL_QTY}.` };
  if (!isDateKey(input.deliveryKey) || !isDateKey(input.pickupKey)) return { success: false, message: 'Anna toimitus- ja noutopäivä.' };
  if (input.pickupKey < input.deliveryKey) return { success: false, message: 'Nouto ei voi olla ennen toimitusta.' };
  const notes = typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim().slice(0, MAX_NOTES) : null;

  try {
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId }, select: { id: true } });
    if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    const data = {
      quantity,
      deliveryDate: keyToDate(input.deliveryKey),
      pickupDate: keyToDate(input.pickupKey),
      datesEstimated: false,
      notes,
    };
    const rental = await prisma.boxRental.upsert({
      where: { leadId: input.leadId },
      update: data,
      create: { leadId: input.leadId, status: 'RESERVED', ...data },
    });
    await createLog({
      entityType: 'Lead',
      entityId: input.leadId,
      action: 'box_rental.saved',
      message: `Laatikkovuokra: ${quantity} kpl, ${input.deliveryKey} – ${input.pickupKey}`,
      actorId: session.user?.email ?? null,
    });
    await syncBoxRentalCalendar(rental.id);
    refresh(input.leadId);
    return { success: true, warning: await boxRentalWarning(rental) };
  } catch (error) {
    console.error('[box-rental-actions] saveBoxRental', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/**
 * Vaihtaa vuokrauksen tilan. Noudettaessa kirjataan palautunut määrä: puuttuvat laatikot vähennetään
 * varastosta (ja palautetaan, jos nouto kumotaan), jotta varaston koko vastaa aina hyllyssä olevia.
 */
export async function setBoxRentalStatus(input: {
  id: string;
  status: 'RESERVED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  returnedQty?: number;
}): Promise<BoxRentalActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  if (!['RESERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(input.status)) return { success: false, message: 'Tuntematon tila.' };

  try {
    const rental = await prisma.boxRental.findUnique({ where: { id: input.id } });
    if (!rental) return { success: false, message: 'Vuokrausta ei löytynyt.' };

    let returnedQty: number | null = null;
    let lostQty = 0;
    if (input.status === 'RETURNED') {
      const n = Number(input.returnedQty ?? rental.quantity);
      if (!Number.isInteger(n) || n < 0 || n > MAX_RENTAL_QTY) return { success: false, message: 'Anna palautunut määrä.' };
      returnedQty = n;
      lostQty = lostOnReturn(rental.quantity, n);
    }

    // Varaston koko: aiempi hävikki palautetaan, uusi vähennetään
    const stockDelta = rental.lostQty - lostQty;
    const total = await getBoxStockTotal();

    await prisma.boxRental.update({ where: { id: rental.id }, data: { status: input.status, returnedQty, lostQty } });
    if (stockDelta !== 0 && total !== null) {
      await setAppState(BOX_STOCK_KEY, { total: Math.max(0, total + stockDelta) });
    }
    await createLog({
      entityType: 'Lead',
      entityId: rental.leadId,
      action: 'box_rental.status_changed',
      message:
        input.status === 'RETURNED'
          ? `Laatikot noudettu: palautui ${returnedQty}/${rental.quantity}${lostQty ? `, puuttuu ${lostQty}` : ''}`
          : `Laatikkovuokran tila: ${rental.status} -> ${input.status}`,
      data: { from: rental.status, to: input.status, returnedQty, lostQty },
      actorId: session.user?.email ?? null,
    });
    await syncBoxRentalCalendar(rental.id);
    refresh(rental.leadId);
    return { success: true };
  } catch (error) {
    console.error('[box-rental-actions] setBoxRentalStatus', error);
    return { success: false, message: 'Tilan vaihto epäonnistui. Yritä uudelleen.' };
  }
}

/** Varaston koko (laatikoita yhteensä, myös vuokralla olevat). */
export async function saveBoxStock(total: number): Promise<BoxRentalActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  const n = Number(total);
  if (!Number.isInteger(n) || n < 0 || n > MAX_STOCK) return { success: false, message: 'Anna laatikoiden määrä kokonaislukuna.' };
  try {
    const previous = await getBoxStockTotal();
    await setAppState(BOX_STOCK_KEY, { total: n });
    await createLog({
      entityType: 'System',
      entityId: BOX_STOCK_KEY,
      action: 'box_stock.saved',
      message: `Laatikkovarasto: ${previous ?? '–'} -> ${n}`,
      actorId: session.user?.email ?? null,
    });
    revalidatePath('/hallinta/inventaario');
    return { success: true };
  } catch (error) {
    console.error('[box-rental-actions] saveBoxStock', error);
    return { success: false, message: 'Tallennus epäonnistui.' };
  }
}
