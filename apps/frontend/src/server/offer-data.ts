import type { Contact, Lead } from '@prisma/client';
import { buildDefaultOffer, parseStoredOffer, type OfferData } from '@/lib/offer';
import { defaultFinalPrice, parseLeadFormData } from '@/server/lead-format';

// Liidin tarjous-/vahvistusdokumentti: tallennettu (formData.offer) tai liidin tiedoista esitäytetty.

export function offerForLead(lead: Lead & { contact: Contact }, todayIso: string): { offer: OfferData; saved: boolean } {
  const pfd = parseLeadFormData(lead.formData);
  const stored = parseStoredOffer(pfd.offer, todayIso);
  if (stored) return { offer: stored, saved: true };

  const c = lead.contact;
  return {
    saved: false,
    offer: buildDefaultOffer(
      {
        customerName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Asiakas',
        customerEmail: c.email,
        customerPhone: c.phone,
        // requestedDate on tallennettu UTC-keskiyönä
        serviceDate: lead.requestedDate ? lead.requestedDate.toISOString().slice(0, 10) : null,
        serviceTime: typeof pfd.preferredTime === 'string' && pfd.preferredTime ? pfd.preferredTime : null,
        fromAddress: lead.fromAddress,
        toAddress: lead.toAddress,
        price: defaultFinalPrice(lead),
      },
      todayIso,
    ),
  };
}

/** Milloin ja minne dokumentti on viimeksi lähetetty (formData.offerSent). */
export function offerSentInfo(lead: Pick<Lead, 'formData'>): { at: string; to: string; type: string } | null {
  const sent = parseLeadFormData(lead.formData).offerSent;
  if (!sent || typeof sent !== 'object') return null;
  const s = sent as Record<string, unknown>;
  return typeof s.at === 'string' && typeof s.to === 'string' ? { at: s.at, to: s.to, type: typeof s.type === 'string' ? s.type : 'tarjous' } : null;
}
