// Työaikanäkymien palvelimella muodostettavat tietorakenteet. Päivämäärät kulkevat ISO-merkkijonoina,
// jotta ne voi välittää client-komponenteille. Client-komponentit tuovat täältä vain tyyppejä.

import { defaultFinalPrice } from '@/server/lead-format';

export type TimeEntryDto = {
  id: string;
  leadId: string | null;
  title: string | null; // vapaa työn nimi (kun keikkaa ei ole liitetty) — muokkauslomakkeen oletus
  jobLabel: string; // näytettävä nimi: asiakas + päivä tai vapaa nimi
  startedAt: string;
  endedAt: string | null;
  crewSize: number;
  breakMinutes: number;
  notes: string | null;
  price: number | null; // liidin hinta (vahvistettu tai laskurin arvio), jos tiedossa
};

export type LeadOption = { id: string; label: string; today: boolean };

type LeadForLabel = {
  requestedDate: Date | null;
  fromAddress: string | null;
  contact?: { firstName: string | null; lastName: string | null; companyName: string | null } | null;
};

type LeadForPrice = {
  status: string;
  finalPrice: number | null;
  priceAfterDiscount: number | null;
  formData: unknown;
};

export function leadDisplayName(lead: Pick<LeadForLabel, 'contact'>): string {
  const c = lead.contact;
  if (!c) return 'Nimetön';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Nimetön';
}

/** "22.10." — muuttopäivä on tallennettu UTC-keskiyönä, joten päivä luetaan UTC:nä. */
function shortDate(date: Date | null): string {
  return date ? date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }) : 'ei päivää';
}

/** "22.10. Matti Meikäläinen" — keikan tunniste listoissa. */
export function leadJobLabel(lead: LeadForLabel): string {
  return `${shortDate(lead.requestedDate)} ${leadDisplayName(lead)}`;
}

/** Valintalistan rivi: päivä, asiakas ja lähtöosoitteen katuosa. */
export function leadOptionLabel(lead: LeadForLabel): string {
  const street = lead.fromAddress?.split(',')[0]?.trim();
  return street ? `${leadJobLabel(lead)} · ${street}` : leadJobLabel(lead);
}

export function toTimeEntryDto(
  entry: {
    id: string;
    leadId: string | null;
    title: string | null;
    startedAt: Date;
    endedAt: Date | null;
    crewSize: number;
    breakMinutes: number;
    notes: string | null;
  },
  lead?: (LeadForLabel & LeadForPrice) | null,
): TimeEntryDto {
  return {
    id: entry.id,
    leadId: entry.leadId,
    title: entry.title,
    jobLabel: lead ? leadJobLabel(lead) : entry.title || (entry.leadId ? 'Poistettu keikka' : 'Työ'),
    startedAt: entry.startedAt.toISOString(),
    endedAt: entry.endedAt ? entry.endedAt.toISOString() : null,
    crewSize: entry.crewSize,
    breakMinutes: entry.breakMinutes,
    notes: entry.notes,
    price: lead ? defaultFinalPrice(lead) : null,
  };
}
