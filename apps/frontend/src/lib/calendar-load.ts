import type { LeadStatus } from '@prisma/client';

// Kuinka monta keikkaa samalle päivälle mahtuu ennen kuin kalenteri varoittaa. Yksi paikka muutettavaksi.
export const MAX_JOBS_PER_DAY = 2;

// Vain vielä tekemättömät keikat kuormittavat päivää (tarjousvaiheen keikka voi vielä vahvistua).
const PENDING: LeadStatus[] = ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'WON'];

/** Päivät (YYYY-MM-DD) joille on enemmän kuin `max` tekemätöntä keikkaa. Palauttaa päivä -> lukumäärä. */
export function overloadedDays(jobs: { date: string; status: LeadStatus }[], max = MAX_JOBS_PER_DAY): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (PENDING.includes(job.status)) counts.set(job.date, (counts.get(job.date) ?? 0) + 1);
  }
  for (const [day, count] of [...counts]) if (count <= max) counts.delete(day);
  return counts;
}
