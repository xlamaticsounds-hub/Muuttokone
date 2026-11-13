import type { BoxRental, Contact, Lead, LeadStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { getAppState } from '@/server/app-state';
import { parseLeadFormData } from '@/server/lead-format';
import { createLog } from '@/server/repo/logs';
import {
  BACKFILL_LOOKBACK_DAYS,
  BOX_STOCK_KEY,
  addDaysToKey,
  checkOverbooking,
  dateToKey,
  extractBoxRentalRequest,
  isPastRental,
  keyToDate,
  overbookingMessage,
  rentalCommitment,
  type BoxRentalRequest,
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

const todayKey = () => toHelsinkiDateInput(new Date());

/** Lomakkeen laatikkovuokra, jos se on vielä ajankohtainen (nouto tänään tai myöhemmin). */
function currentRequestOf(lead: { formData: unknown; requestedDate: Date | null }): BoxRentalRequest | null {
  const request = extractBoxRentalRequest(parseLeadFormData(lead.formData), lead.requestedDate);
  return request && !isPastRental(request, todayKey()) ? request : null;
}

async function createRentalFromRequest(leadId: string, request: BoxRentalRequest): Promise<BoxRental> {
  const row = await prisma.boxRental.create({
    data: {
      leadId,
      quantity: request.quantity,
      deliveryDate: keyToDate(request.deliveryKey),
      pickupDate: keyToDate(request.pickupKey),
      datesEstimated: true,
      status: 'RESERVED',
    },
  });
  // Jo vahvistettu keikka (esim. ennen inventaariota tullut) saa toimitus- ja noutomerkinnät heti
  await syncBoxRentalCalendar(row.id);
  return row;
}

/**
 * Luo liidille vuokrausrivin lomaketiedoista, jos sitä ei vielä ole. Palauttaa rivin tai null.
 * Vanhoille liideille (nouto mennyt) riviä ei luoda, ks. isPastRental.
 */
export async function ensureBoxRentalForLead(leadId: string): Promise<BoxRental | null> {
  try {
    const existing = await prisma.boxRental.findUnique({ where: { leadId } });
    if (existing) return existing;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { formData: true, requestedDate: true } });
    if (!lead) return null;
    const request = currentRequestOf(lead);
    if (!request) return null;
    return await createRentalFromRequest(leadId, request);
  } catch (error) {
    if (isUniqueViolation(error)) return prisma.boxRental.findUnique({ where: { leadId } }).catch(() => null);
    console.warn('[box-rentals] vuokrausrivin luonti epäonnistui', leadId, error);
    return null;
  }
}

/**
 * Luo puuttuvat vuokrausrivit liideille, joilla on laatikkovuokra lomaketiedoissa (myös ennen
 * inventaarion käyttöönottoa tulleet). Idempotentti: liidi, jolla on jo rivi (myös peruttu), ohitetaan.
 * Luetaan vain liidit, joista voi vielä tulla ajankohtainen vuokraus (BACKFILL_LOOKBACK_DAYS).
 */
export async function syncMissingBoxRentals(): Promise<number> {
  const cutoff = keyToDate(addDaysToKey(todayKey(), -BACKFILL_LOOKBACK_DAYS));
  const [leads, existing] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        boxRental: { is: null },
        OR: [{ requestedDate: { gte: cutoff } }, { requestedDate: null, createdAt: { gte: cutoff } }],
      },
      select: { id: true, formData: true, requestedDate: true },
    }),
    prisma.boxRental.findMany({ select: { leadId: true } }),
  ]);
  const hasRental = new Set(existing.map((r) => r.leadId));
  let created = 0;
  for (const lead of leads) {
    if (hasRental.has(lead.id)) continue;
    const request = currentRequestOf(lead);
    if (!request) continue;
    try {
      await createRentalFromRequest(lead.id, request);
      created += 1;
    } catch (error) {
      if (!isUniqueViolation(error)) console.warn('[box-rentals] synkronointi ohitti liidin', lead.id, error);
    }
  }
  return created;
}

/**
 * Liidin päivä tai lomaketiedot muuttuivat hallinnassa: arvioidut vuokrauspäivät (ja määrä) seuraavat
 * uutta muuttopäivää, ja kalenterimerkinnät siirtyvät. Käsin vahvistettuihin päiviin ei kosketa.
 */
export async function refreshBoxRentalFromLead(leadId: string): Promise<void> {
  try {
    const rental = await prisma.boxRental.findUnique({ where: { leadId } });
    if (!rental) {
      await ensureBoxRentalForLead(leadId);
      return;
    }
    if (rental.status !== 'RESERVED' || !rental.datesEstimated) return;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { formData: true, requestedDate: true } });
    const request = lead ? extractBoxRentalRequest(parseLeadFormData(lead.formData), lead.requestedDate) : null;
    if (!request) return;
    const unchanged =
      request.quantity === rental.quantity &&
      request.deliveryKey === dateToKey(rental.deliveryDate) &&
      request.pickupKey === dateToKey(rental.pickupDate);
    if (unchanged) return;
    await prisma.boxRental.update({
      where: { id: rental.id },
      data: { quantity: request.quantity, deliveryDate: keyToDate(request.deliveryKey), pickupDate: keyToDate(request.pickupKey) },
    });
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'box_rental.dates_followed_lead',
      message: `Laatikkovuokra siirtyi liidin mukana: ${request.quantity} kpl, ${request.deliveryKey} – ${request.pickupKey}`,
    }).catch(() => {});
    await syncBoxRentalCalendar(rental.id);
  } catch (error) {
    console.warn('[box-rentals] vuokrauksen päivitys liidistä epäonnistui', leadId, error);
  }
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
  return overbookingMessage(checkOverbooking(total, rentals, candidate, todayKey()), rental.quantity);
}

/** Uuden liidin yhteydessä: luo vuokrausrivin ja palauttaa varoituksen Discordiin, jos laatikot eivät riitä. */
export async function boxRentalWarningForNewLead(leadId: string): Promise<string | null> {
  try {
    const rental = await ensureBoxRentalForLead(leadId);
    if (!rental) return null;
    return await boxRentalWarning(rental);
  } catch (error) {
    console.warn('[box-rentals] ylivarauksen tarkistus epäonnistui', leadId, error);
    return null;
  }
}

// --- Google-kalenteri ---------------------------------------------------------------------------

/** Muuttolaatikot-sivun tilaus: liidin päivä on laatikoiden toimituspäivä (ei muuttopäivä). */
export function isRentalOrderLead(formData: unknown): boolean {
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

    // Noudettu vuokraus on valmis: sen merkinnät jäävät kalenteriin historiaksi. Käsin kalenteriin
    // merkityille (esim. inventaarion lähtötilanne kalenterista) ei luoda päällekkäisiä merkintöjä.
    if (rental.status === 'RETURNED' || rental.manualCalendar) return;

    const { lead } = rental;
    const commitment = rentalCommitment(leadStatus ?? lead.status);
    // Toimitetut laatikot ovat asiakkaalla, vaikka muutto peruttaisiin: nouto pysyy kalenterissa
    const physicallyOut = rental.status === 'DELIVERED';
    const keep = physicallyOut || (rental.status !== 'CANCELLED' && commitment !== 'inactive');
    const confirmed = physicallyOut || commitment === 'confirmed';
    const create = keep && confirmed;
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

// Tilat, joissa keikka vahvistetaan: alustava varaus muuttuu oikeaksi, joten laatikoiden riittävyys
// tarkistetaan uudelleen (uuden liidin varoitus ei huomaa kahta alustavaa, jotka vahvistuvat päällekkäin).
const CONFIRMING_STATUSES: LeadStatus[] = ['SCHEDULED', 'WON'];

/** Liidin tila vaihtui: kalenterimerkinnät seuraavat tilaa, ja vahvistettaessa varoitetaan Discordissa, jos laatikot eivät riitä. */
export async function syncBoxRentalCalendarForLead(leadId: string, leadStatus?: LeadStatus): Promise<void> {
  const rental = await prisma.boxRental.findUnique({ where: { leadId } }).catch(() => null);
  if (!rental) return;
  await syncBoxRentalCalendar(rental.id, leadStatus);
  if (!leadStatus || !CONFIRMING_STATUSES.includes(leadStatus)) return;
  try {
    const warning = await boxRentalWarning(rental);
    if (!warning) return;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muuttokone.fi';
    const { sendDiscordEmbed } = await import('@/server/discord-webhook');
    await sendDiscordEmbed({
      title: `📦 Laatikot eivät riitä – ${lead ? customerNameOf(lead.contact) : 'vahvistettu keikka'}`,
      description: `${warning}\nToimitus ${dateToKey(rental.deliveryDate)}, nouto ${dateToKey(rental.pickupDate)}.`,
      color: 0xdc2626,
      url: `${base}/hallinta/liidit/${leadId}`,
    });
  } catch (error) {
    console.warn('[box-rentals] vahvistuksen laatikkotarkistus epäonnistui', leadId, error);
  }
}
