import type { LeadStatus } from '@prisma/client';

// Liidin tilojen nimet ja värit yhdessä paikassa (liidilista, liidin sivu, diilit). Ennen tätä
// jokainen valikko listasi tilat itse, ja laskurin varausten tila SCHEDULED puuttui niistä —
// selain näytti silloin valikon ensimmäisen vaihtoehdon ("Uusi").
//
// Kumppaniraportin kannalta: WON = vahvistettu, COMPLETED = toteutunut (palkkio maksetaan vain
// näistä), CANCELLED = peruttu vahvistuksen jälkeen, LOST = ei koskaan vahvistunut.

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Uusi',
  SCHEDULED: 'Uusi varaus',
  QUALIFIED: 'Kelpuutettu',
  CONTACTED: 'Oltu yhteydessä',
  PROPOSAL_SENT: 'Tarjous lähetetty',
  WON: 'Vahvistettu',
  COMPLETED: 'Toteutunut',
  CANCELLED: 'Peruttu',
  LOST: 'Hävitty',
  ARCHIVED: 'Arkistoitu',
};

/** Valikoissa näytettävät tilat tässä järjestyksessä (QUALIFIED ei ole käytössä). */
export const SELECTABLE_LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'SCHEDULED',
  'CONTACTED',
  'PROPOSAL_SENT',
  'WON',
  'COMPLETED',
  'CANCELLED',
  'LOST',
  'ARCHIVED',
];

export function statusOptionsFor(current: LeadStatus): LeadStatus[] {
  return SELECTABLE_LEAD_STATUSES.includes(current) ? SELECTABLE_LEAD_STATUSES : [current, ...SELECTABLE_LEAD_STATUSES];
}

/** Pillerimäinen tila (valikot, merkit). */
export const LEAD_STATUS_PILL_CLASSES: Record<LeadStatus, string> = {
  NEW: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30',
  SCHEDULED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 dark:ring-indigo-500/30',
  QUALIFIED: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-500/30',
  CONTACTED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30',
  PROPOSAL_SENT: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30',
  WON: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-500/30',
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-500/30',
  CANCELLED: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/30',
  LOST: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30',
  ARCHIVED: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
};

/** Tilat joissa keikka ei ole enää tulossa (keikat-lista, dashboardin tulevat keikat). */
export const INACTIVE_JOB_STATUSES: LeadStatus[] = ['LOST', 'ARCHIVED', 'CANCELLED', 'COMPLETED'];
