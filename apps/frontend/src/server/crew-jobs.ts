// Partiosivun keikkatiedot: vain se, mitä keikalla tarvitaan. Ei hintoja, alennuksia, palkkioita eikä
// toimiston sisäisiä muistiinpanoja (Lead.notes sisältää esim. "Hinta-arvio: 450€"), koska partionjohtaja
// ei näe hintoja. Toimisto kirjoittaa partiolle ohjeet erikseen (formData.crewNotes, liidin sivulla).

import type { Contact, Lead } from '@prisma/client';
import { applianceLines } from '@/features/calculator/pricing';
import { getInventoryEntries, getPackageLabel, getServiceLabel, parseLeadFormData } from '@/server/lead-format';
import { leadPreferredTime } from '@/lib/calendar-time';
import { dateToKey } from '@/lib/box-inventory';

export const CREW_NOTES_KEY = 'crewNotes';
export const MAX_CREW_NOTES = 2000;

export type CrewJob = {
  id: string;
  dateKey: string | null;
  time: string | null;
  confirmed: boolean;
  customer: string;
  phone: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  fromFloor: string | null;
  toFloor: string | null;
  service: string | null;
  size: string | null;
  items: { icon: string; label: string; qty: number }[];
  extras: string[];
  crewNotes: string | null;
  customerMessage: string | null;
};

const APARTMENT_SIZE_LABELS: Record<string, string> = {
  '1h': 'Yksiö',
  '2h': 'Kaksio',
  '3h': 'Kolmio',
  '4h+': '4h+ / iso',
  office: 'Toimisto',
};

function floorText(floor: unknown, elevator: unknown): string | null {
  if (typeof floor !== 'number' && typeof elevator !== 'boolean') return null;
  const f = typeof floor === 'number' ? (floor <= 0 ? 'katutaso' : `${floor}. krs`) : 'kerros ?';
  const e = elevator === true ? 'hissi' : elevator === false ? 'ei hissiä' : null;
  return e ? `${f}, ${e}` : f;
}

/** Lisäpalvelut ilman hintoja (lead-format.ts:n getExtraServices näyttää hinnat). */
export function crewExtras(pfd: Record<string, unknown>): string[] {
  const extras: string[] = [];
  if (Array.isArray(pfd.services) && pfd.services.includes('Purkupalvelu')) extras.push('Huonekalujen purku ja kasaus');
  if (pfd.needsPacking) extras.push('Pakkauspalvelu (me pakkaamme)');
  if (pfd.needsCleaning) extras.push('Muuttosiivous');
  if (pfd.needsBoxRental === true && Number(pfd.boxRentalCount) > 0) extras.push(`Muuttolaatikot ${Number(pfd.boxRentalCount)} kpl`);
  for (const line of applianceLines(pfd.applianceServices)) extras.push(line.qty > 1 ? `${line.label} × ${line.qty}` : line.label);
  if (Array.isArray(pfd.additionalStops)) {
    for (const stop of pfd.additionalStops) {
      if (typeof stop === 'string' && stop.trim()) extras.push(`Lisäkohde: ${stop.trim()}`);
    }
  }
  return extras;
}

export function crewNotesOf(pfd: Record<string, unknown>): string | null {
  const value = pfd[CREW_NOTES_KEY];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function toCrewJob(lead: Lead & { contact: Contact }): CrewJob {
  const pfd = parseLeadFormData(lead.formData);
  const payload = pfd.payload && typeof pfd.payload === 'object' ? (pfd.payload as Record<string, unknown>) : {};
  const sizeParts = [
    typeof pfd.apartmentSize === 'string' ? APARTMENT_SIZE_LABELS[pfd.apartmentSize] ?? pfd.apartmentSize : null,
    lead.squareMeters ? `${lead.squareMeters} m²` : null,
    lead.volumeM3 ? `noin ${lead.volumeM3} m³` : null,
  ].filter(Boolean);
  const service = [getServiceLabel(pfd), getPackageLabel(pfd)].filter(Boolean).join(' · ') || null;
  const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message.trim() : null;

  return {
    id: lead.id,
    dateKey: lead.requestedDate ? dateToKey(lead.requestedDate) : null,
    time: leadPreferredTime(pfd),
    confirmed: lead.status === 'WON', // WON = vahvistettu; muut aktiiviset näytetään alustavina
    customer: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas',
    phone: lead.contact.phone ?? null,
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    fromFloor: floorText(pfd.floorFrom ?? lead.floor ?? undefined, pfd.elevatorFrom ?? lead.hasElevator ?? undefined),
    toFloor: floorText(pfd.floorTo, pfd.elevatorTo),
    service,
    size: sizeParts.length ? sizeParts.join(' · ') : null,
    items: getInventoryEntries(pfd),
    extras: crewExtras(pfd),
    crewNotes: crewNotesOf(pfd),
    customerMessage: message,
  };
}
