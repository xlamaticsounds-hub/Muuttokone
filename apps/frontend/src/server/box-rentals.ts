import type { BoxRental, Contact, Lead, LeadStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { getAppState } from '@/server/app-state';
import { parseLeadFormData } from '@/server/lead-format';
import { createLog } from '@/server/repo/logs';
import {
  BOX_STOCK_KEY,
  checkOverbooking,
  dateToKey,
  extractBoxRentalRequest,
  keyToDate,
  overbookingMessage,
  rentalCommitment,
  type InventoryRental,
} from '@/lib/box-inventory';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';

// Laatikkovuokraukset tietokannassa: rivin luonti liidistä, inventaarion lataus, ylivarausvaroitus ja
// Google-kalenterin toimitus- ja noutomerkinnät. Laskenta on lib/box-inventory.ts:ssä.
// Mikään tässä ei heitä kutsujalle liidin luonnin tai tilamuutoksen yhteydessä.

type RentalWithLead = BoxRental & { lead: Lead & { contact: Contact } };

export function customerNameOf(contact: Pick<Contact, 'firstName' | 'lastName' | 'companyName'>): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.companyName || 'Asiakas';
}

export function toInventoryRental(row: RentalWithLead): InventoryRental {
  return {
    id: row.id,
    leadId: row.leadId,
    customer: customerNameOf(row.lead.contact),
    quantity: row.quantity,
    deliveryKey: dateToKey(row.deliveryDate),
    pickupKey: dateToKey(row.pickupDate),
    datesEstimated: row.datesEstimated,
    status: row.status,
    commitment: rentalCommitment(row.lead.status),
    returnedQty: row.returnedQty,
    lostQty: row.lostQty,
    notes: row.notes,
  };
}

/** Varaston koko (Inventaario-sivulla asetettu). null = ei vielä asetettu. */
export async function getBoxStockTotal(): Promise<number | null> {
  const value = await getAppState<{ total?: unknown }>(BOX_STOCK_KEY);
  return typeof value?.total === 'number' && Number.isFinite(value.total) ? value.total : null;
}

export async function loadInventoryRentals(): Promise<InventoryRental[]> {
  const rows = await prisma.boxRental.findMany({
    where: { lead: { deletedAt: null } },
    include: { lead: { include: { contact: true } } },
  });
  return rows.map(toInventoryRental);
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === 'P2002';
}

/** Luo liidille vuokrausrivin lomaketiedoista, jos sitä ei vielä ole. Palauttaa rivin tai null. */
export async function ensureBoxRentalForLead(leadId: string): Promise<BoxRental | null> {
  try {
    const existing = await prisma.boxRental.findUnique({ where: { leadId } });
    if (existing) return existing;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { formData: true, requestedDate: true } });
    if (!lead) return null;
    const request = extractBoxRentalRequest(parseLeadFormData(lead.formData), lead.requestedDate);
    if (!request) return null;
    return await prisma.boxRental.create({
      data: {
        leadId,
        quantity: request.quantity,
        deliveryDate: keyToDate(request.deliveryKey),
        pickupDate: keyToDate(request.pickupKey),
        datesEstimated: true,
        status: 'RESERVED',
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return prisma.boxRental.findUnique({ where: { leadId } }).catch(() => null);
    console.warn('[box-rentals] vuokrausrivin luonti epäonnistui', leadId, error);
    return null;
  }
}

/**
 * Luo puuttuvat vuokrausrivit liideille, joilla on laatikkovuokra lomaketiedoissa (myös ennen
 * inventaarion käyttöönottoa tulleet). Idempotentti: liidi, jolla on jo rivi (myös peruttu), ohitetaan.
 */
export async function syncMissingBoxRentals(): Promise<number> {
  const [leads, existing] = await Promise.all([
    prisma.lead.findMany({
      where: { deletedAt: null, boxRental: { is: null } },
      select: { id: true, formData: true, requestedDate: true },
    }),
    prisma.boxRental.findMany({ select: { leadId: true } }),
  ]);
  const hasRental = new Set(existing.map((r) => r.leadId));
  let created = 0;
  for (const lead of leads) {
    if (hasRental.has(lead.id)) continue;
    const request = extractBoxRentalRequest(parseLeadFormData(lead.formData), lead.requestedDate);
    if (!request) continue;
    try {
      await prisma.boxRental.create({
        data: {
          leadId: lead.id,
          quantity: request.quantity,
          deliveryDate: keyToDate(request.deliveryKey),
          pickupDate: keyToDate(request.pickupKey),
          datesEstimated: true,
          status: 'RESERVED',
        },
      });
      created += 1;
    } catch (error) {
      if (!isUniqueViolation(error)) console.warn('[box-rentals] synkronointi ohitti liidin', lead.id, error);
    }
  }
  return created;
}

/** Ylivarausvaroitus liidin vuokraukselle, tai null jos laatikot riittävät (tai varastoa ei ole asetettu). */
export async function boxRentalWarning(rental: Pick<BoxRental, 'id' | 'quantity' | 'deliveryDate' | 'pickupDate' | 'status'>): Promise<string | null> {
  if (rental.status !== 'RESERVED') return null;
  const [total, rentals] = await Promise.all([getBoxStockTotal(), loadInventoryRentals()]);
  if (total === null) return null;
  const candidate = {
    id: rental.id,
    quantity: rental.quantity,
    deliveryKey: dateToKey(rental.deliveryDate),
    pickupKey: dateToKey(rental.pickupDate),
  };
  return overbookingMessage(checkOverbooking(total, rentals, candidate, toHelsinkiDateInput(new Date())), rental.quantity);
}

/** Uuden liidin yhteydessä: luo vuokrausrivin ja palauttaa varoituksen Discordiin, jos laatikot eivät riitä. */
export async function boxRentalWarningForNewLead(leadId: string): Promise<string | null> {
  try {
    const rental = await ensureBoxRentalForLead(leadId);
    if (!rental) return null;
    await syncBoxRentalCalendar(rental.id);
    return await boxRentalWarning(rental);
  } catch (error) {
    console.warn('[box-rentals] ylivarauksen tarkistus epäonnistui', leadId, error);
    return null;
  }
}

// --- Google-kalenteri ---------------------------------------------------------------------------

function isRentalOrderLead(formData: unknown): boolean {
  const pfd = parseLeadFormData(formData);
  const payload = pfd.kind === 'api-lead' && pfd.payload && typeof pfd.payload === 'object' ? (pfd.payload as Record<string, unknown>) : null;
  return payload?.service_type === 'vuokraus';
}

/**
 * Pitää vuokrauksen toimitus- ja noutomerkinnät kalenterissa. Merkinnät luodaan vahvistetuille
 * (kalenterissa oleville) liideille, poistetaan kun vuokraus perutaan tai liidi hävitään/perutaan.
 * Muuttolaatikot-sivun tilauksella liidin oma merkintä on jo toimitus, joten siitä tehdään vain nouto.
 */
export async function syncBoxRentalCalendar(rentalId: string, leadStatus?: LeadStatus): Promise<void> {
  try {
    const rental = await prisma.boxRental.findUnique({ where: { id: rentalId }, include: { lead: { include: { contact: true } } } });
    if (!rental) return;
    const { upsertAllDayEvent, cancelCalendarEvent, isCalendarConfigured } = await import('@/server/google-calendar');
    if (!isCalendarConfigured()) return;

    const { lead } = rental;
    const commitment = rentalCommitment(leadStatus ?? lead.status);
    const keep = rental.status !== 'CANCELLED' && commitment !== 'inactive';
    const create = keep && commitment === 'confirmed';
    const rentalOrder = isRentalOrderLead(lead.formData);
    const updates: { deliveryEventId?: string | null; pickupEventId?: string | null } = {};

    if (!keep) {
      if (rental.deliveryEventId) await cancelCalendarEvent(lead.id, rental.deliveryEventId);
      if (rental.pickupEventId) await cancelCalendarEvent(lead.id, rental.pickupEventId);
      if (rental.deliveryEventId) updates.deliveryEventId = null;
      if (rental.pickupEventId) updates.pickupEventId = null;
    } else if (create || rental.deliveryEventId || rental.pickupEventId) {
      const name = customerNameOf(lead.contact);
      const hallintaUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muuttokone.fi'}/hallinta/liidit/${lead.id}`;
      const estimated = rental.datesEstimated ? 'Päivä on arvio lomakkeelta, vahvista asiakkaan kanssa.' : null;
      const describe = (address: string | null, label: string) =>
        [`Asiakas: ${name}`, `Laatikoita: ${rental.quantity} kpl`, address ? `${label}: ${address}` : null, rental.notes ? `Lisätiedot: ${rental.notes}` : null, estimated, '', `Liidi: ${hallintaUrl}`]
          .filter((line): line is string => line !== null)
          .join('\n');
      const confirmed = commitment === 'confirmed';

      if (!rentalOrder && rental.status === 'RESERVED') {
        const id = await upsertAllDayEvent(lead.id, rental.deliveryEventId, {
          summary: `📦 Laatikkotoimitus – ${name} (${rental.quantity} kpl)`,
          description: describe(lead.fromAddress, 'Toimitusosoite'),
          dateKey: dateToKey(rental.deliveryDate),
          confirmed,
        });
        if (id !== rental.deliveryEventId) updates.deliveryEventId = id;
      }
      if (rental.status === 'RESERVED' || rental.status === 'DELIVERED') {
        // Muutossa laatikot haetaan uudesta osoitteesta, vuokraustilauksessa samasta kuin toimitus
        const pickupAddress = rentalOrder ? lead.fromAddress : (lead.toAddress ?? lead.fromAddress);
        const id = await upsertAllDayEvent(lead.id, rental.pickupEventId, {
          summary: `📦 Laatikkonouto – ${name} (${rental.quantity} kpl)`,
          description: describe(pickupAddress, 'Nouto-osoite'),
          dateKey: dateToKey(rental.pickupDate),
          confirmed,
        });
        if (id !== rental.pickupEventId) updates.pickupEventId = id;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.boxRental.update({ where: { id: rental.id }, data: updates });
    }
  } catch (error) {
    console.warn('[box-rentals] kalenterisynkronointi epäonnistui', rentalId, error);
    await createLog({
      entityType: 'System',
      entityId: rentalId,
      action: 'calendar.box_rental.failed',
      message: error instanceof Error ? error.message : String(error),
      data: { boxRentalId: rentalId },
    }).catch(() => {});
  }
}

export async function syncBoxRentalCalendarForLead(leadId: string, leadStatus?: LeadStatus): Promise<void> {
  const rental = await prisma.boxRental.findUnique({ where: { leadId }, select: { id: true } }).catch(() => null);
  if (rental) await syncBoxRentalCalendar(rental.id, leadStatus);
}
