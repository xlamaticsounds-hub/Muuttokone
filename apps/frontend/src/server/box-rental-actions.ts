'use server';

import { revalidatePath } from 'next/cache';
import { getLeadSession, getOwnerSession } from '@/server/access';
import { CREW_HOME } from '@/lib/access';
import { prisma } from '@/server/db';
import { setAppState } from '@/server/app-state';
import { createLog } from '@/server/repo/logs';
import { BOX_STOCK_KEY, MAX_RENTAL_QTY, dateToKey, isDateKey, keyToDate, lostOnReturn, type BoxRentalStatusKey } from '@/lib/box-inventory';
import { leadPreferredTime } from '@/lib/calendar-time';
import { parseLeadFormData } from '@/server/lead-format';
import { boxRentalWarning, getBoxStockTotal, isRentalOrderLead, loadInventoryRentals, syncBoxRentalCalendar } from '@/server/box-rentals';

// Laatikkovuokrausten muokkaus hallinnassa (liidin kortti ja Inventaario-sivu). Palauttaa aina tuloksen
// eikä heitä, koska Next.js piilottaa server actionin virheviestit tuotannossa.

export type BoxRentalActionResult = { success: true; warning?: string | null } | { success: false; message: string };

const noSession: BoxRentalActionResult = { success: false, message: 'Kirjaudu sisään.' };
const ALLOWED_TRANSITIONS: Record<BoxRentalStatusKey, BoxRentalStatusKey[]> = {
  RESERVED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RETURNED', 'RESERVED'],
  RETURNED: ['DELIVERED'],
  CANCELLED: ['RESERVED'],
};
const MAX_STOCK = 100_000;
const MAX_NOTES = 1000;

function refresh(leadId: string) {
  revalidatePath('/hallinta/inventaario');
  revalidatePath(CREW_HOME);
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
  const session = await getLeadSession(input.leadId);
  if (!session) return noSession;

  const quantity = quantityOf(input.quantity);
  if (!quantity) return { success: false, message: `Määrän pitää olla 1–${MAX_RENTAL_QTY}.` };
  if (!isDateKey(input.deliveryKey) || !isDateKey(input.pickupKey)) return { success: false, message: 'Anna toimitus- ja noutopäivä.' };
  if (input.pickupKey < input.deliveryKey) return { success: false, message: 'Nouto ei voi olla ennen toimitusta.' };
  const notes = typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim().slice(0, MAX_NOTES) : null;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, formData: true, requestedDate: true, calendarEventId: true },
    });
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
    // Muuttolaatikot-tilauksessa liidin oma päivä ja kalenterimerkintä ovat toimitus: siirretään mukana
    if (isRentalOrderLead(lead.formData) && (!lead.requestedDate || dateToKey(lead.requestedDate) !== input.deliveryKey)) {
      const deliveryDate = keyToDate(input.deliveryKey);
      await prisma.lead.update({ where: { id: lead.id }, data: { requestedDate: deliveryDate } });
      if (lead.calendarEventId) {
        const { updateCalendarEventTime } = await import('@/server/google-calendar');
        await updateCalendarEventTime(lead.id, lead.calendarEventId, deliveryDate, leadPreferredTime(parseLeadFormData(lead.formData)));
      }
    }
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
  if (!['RESERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(input.status)) return { success: false, message: 'Tuntematon tila.' };

  try {
    const rental = await prisma.boxRental.findUnique({ where: { id: input.id } });
    if (!rental) return { success: false, message: 'Vuokrausta ei löytynyt.' };
    // Partionjohtaja kuittaa oman tiiminsä toimitukset ja noudot (partiosivu), muttei peru vuokrauksia
    const session = await getLeadSession(rental.leadId, { allowCrew: true });
    if (!session) return noSession;
    if (session.actor.role === 'CREW_LEAD' && (input.status === 'CANCELLED' || rental.status === 'CANCELLED')) {
      return { success: false, message: 'Vuokrauksen perumisen tekee toimisto.' };
    }
    // Samat siirtymät kuin napeissa (InventoryActions): esim. noudetun peruminen palauttaisi hävikin varastoon
    if (!ALLOWED_TRANSITIONS[rental.status].includes(input.status)) {
      return { success: false, message: 'Tila on jo muuttunut. Päivitä sivu.' };
    }

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

async function writeBoxStock(total: number, message: string, actorId: string | null): Promise<BoxRentalActionResult> {
  await setAppState(BOX_STOCK_KEY, { total });
  await createLog({ entityType: 'System', entityId: BOX_STOCK_KEY, action: 'box_stock.saved', message, actorId });
  revalidatePath('/hallinta/inventaario');
  return { success: true };
}

/**
 * Hyllyssä nyt olevat laatikot (laskettu varastossa). Varaston koko = hyllyssä + asiakkailla olevat,
 * joten asiakkailla olevia ei tarvitse laskea käsin.
 */
export async function saveBoxShelfCount(shelf: number): Promise<BoxRentalActionResult> {
  // Varasto on yhteinen: vain omistajat muuttavat sen kokoa
  const session = await getOwnerSession();
  if (!session) return noSession;
  const n = Number(shelf);
  if (!Number.isInteger(n) || n < 0 || n > MAX_STOCK) return { success: false, message: 'Anna hyllyssä olevien laatikoiden määrä kokonaislukuna.' };
  try {
    const [previous, rentals] = await Promise.all([getBoxStockTotal(), loadInventoryRentals()]);
    const out = rentals.filter((r) => r.status === 'DELIVERED').reduce((sum, r) => sum + r.quantity, 0);
    const total = n + out;
    return await writeBoxStock(total, `Laatikkovarasto: ${previous ?? '–'} -> ${total} (hyllyssä ${n} + asiakkailla ${out})`, session.user?.email ?? null);
  } catch (error) {
    console.error('[box-rental-actions] saveBoxShelfCount', error);
    return { success: false, message: 'Tallennus epäonnistui.' };
  }
}

/** Uudet laatikot varastoon (+) tai rikkinäiset pois (−). */
export async function adjustBoxStock(delta: number): Promise<BoxRentalActionResult> {
  // Varasto on yhteinen: vain omistajat muuttavat sen kokoa
  const session = await getOwnerSession();
  if (!session) return noSession;
  const n = Number(delta);
  if (!Number.isInteger(n) || n === 0 || Math.abs(n) > MAX_STOCK) return { success: false, message: 'Anna lisättävä (+) tai poistettava (−) määrä.' };
  try {
    const previous = (await getBoxStockTotal()) ?? 0;
    const total = Math.max(0, Math.min(MAX_STOCK, previous + n));
    return await writeBoxStock(total, `Laatikkovarasto: ${previous} -> ${total} (${n > 0 ? `lisätty ${n}` : `poistettu ${-n}`})`, session.user?.email ?? null);
  } catch (error) {
    console.error('[box-rental-actions] adjustBoxStock', error);
    return { success: false, message: 'Tallennus epäonnistui.' };
  }
}
