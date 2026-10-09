import type { Contact, Lead } from '@prisma/client';
import { defaultFinalPrice } from '@/server/lead-format';

// "Merkitse toteutuneeksi" -ikkunan tiedot liidistä. Tavallinen moduuli (ei 'use client'),
// jotta sekä palvelinkomponentti (liidin sivu) että selainkomponentti (liidilista) voivat kutsua.

export type CompleteLeadTarget = {
  leadId: string;
  customerName: string;
  defaultPrice: number | null; // ks. lead-format.ts:defaultFinalPrice
  isEdit: boolean; // jo toteutunut -> vain hinnan korjaus, toteutumispäivä säilyy
  partnerName: string | null;
  commissionPercent: number | null;
};

export type LeadForCompletion = Lead & { contact: Contact; discount?: { partner: string } | null };

export function completeTargetFor(lead: LeadForCompletion): CompleteLeadTarget {
  return {
    leadId: lead.id,
    customerName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || 'Asiakas',
    defaultPrice: defaultFinalPrice(lead),
    isEdit: lead.status === 'COMPLETED',
    partnerName: lead.discountCode ? lead.discountPartner ?? lead.discount?.partner ?? 'Kumppani' : null,
    commissionPercent: lead.discountCode ? lead.commissionPercent ?? null : null,
  };
}
