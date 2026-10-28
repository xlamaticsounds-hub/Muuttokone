import type { LeadSource } from '@prisma/client';

// Mistä keikka on tullut. Kanavia on kaksi: oma sivu (laskuri ja lomakkeet) ja Muuttomaailma. Kaikki muualta
// tulleet keikat ovat Muuttomaailmasta, vaikka "Keikka muualta" -lomakkeella olisi valittu esim. puhelu.
// Lead.source ei yksin riitä: muualta tulleet tallentuvat arvolla OTHER/PHONE/EMAIL/REFERRAL (leadSourceFor),
// ja /api/submit voi tallentaa lomakkeen oman lähdetekstin mukaan minkä tahansa arvon.

export type LeadOrigin = 'muuttomaailma' | 'oma';

export const LEAD_ORIGINS: LeadOrigin[] = ['muuttomaailma', 'oma'];

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  muuttomaailma: 'Muuttomaailma',
  oma: 'Oma sivu',
};

export const LEAD_ORIGIN_PILL_CLASSES: Record<LeadOrigin, string> = {
  muuttomaailma: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-500/30',
  oma: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-500/30',
};

/** Kuukausipylvään osuuden väri. */
export const LEAD_ORIGIN_BAR_CLASSES: Record<LeadOrigin, string> = {
  muuttomaailma: 'bg-orange-400',
  oma: 'bg-blue-500',
};

const OWN_SITE_SOURCES: LeadSource[] = ['STEP_FORM', 'WEBSITE', 'QUICK_QUOTE'];

export function isLeadOrigin(value: unknown): value is LeadOrigin {
  return typeof value === 'string' && (LEAD_ORIGINS as string[]).includes(value);
}

function parseFormData(formData: unknown): Record<string, unknown> {
  try {
    const parsed = typeof formData === 'string' ? JSON.parse(formData) : formData;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function leadOrigin(lead: { source: LeadSource; formData: unknown }): LeadOrigin {
  const data = parseFormData(lead.formData);
  // "Keikka muualta" -lomake (server/external-lead.ts) tallentaa kanavan tähän
  if (data.external) return 'muuttomaailma';
  // /api/submit-lomakkeet (yrityssivu, työapu, yhteydenotto) tallentavat kind: 'api-lead'
  if (OWN_SITE_SOURCES.includes(lead.source) || data.kind === 'api-lead') return 'oma';
  // Käsin kirjatut vanhat keikat (ennen "Keikka muualta" -lomaketta) ovat muualta eli Muuttomaailmasta
  return 'muuttomaailma';
}
