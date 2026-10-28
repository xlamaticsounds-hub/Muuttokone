import type { LeadStatus } from '@prisma/client';
import { sumValues } from '@/lib/pipeline';
import { LEAD_ORIGINS, type LeadOrigin } from '@/lib/lead-origin';

// Ennuste-näkymän säännöt: paljonko tulevilla vahvistetuilla keikoilla on yhteensä rahaa, kuukausittain ja
// lähteittäin. Puhtaita funktioita, jotta ne voi testata ilman tietokantaa.

/**
 * Vahvistettu keikka = kaikki mikä on kalenterissa: laskurin varaus (Uusi varaus) ja voitettu. Omistajien sääntö
 * on, että kalenterissa oleva keikka on sovittu, joten näitä ei eritellä. Tarjousvaiheen keikat (NEW,
 * PROPOSAL_SENT) eivät ole vielä varmoja, joten ne eivät kuulu ennusteeseen.
 */
export const BOOKED_STATUSES: LeadStatus[] = ['SCHEDULED', 'WON'];

export type BookedJob = {
  id: string;
  status: LeadStatus;
  /** Tallennettu UTC-keskiyönä, joten päivä luetaan UTC:nä. */
  requestedDate: Date | null;
  /** Keikan hinta (sovittu hinta tai laskurin arvio), null jos hintaa ei tiedetä. */
  value: number | null;
  origin: LeadOrigin;
  name: string;
  route: string;
  /** Laskurivaraus, jonka Google-kalenterimerkintä on vielä alustava (vahvistuu kun tila on Voitettu). */
  tentativeCalendar: boolean;
};

export type DatedJob = BookedJob & { requestedDate: Date };

export type ForecastTotal = { count: number; sum: number; missing: number };
/** share = osuus kaikkien tulevien keikkojen summasta, 0–1 */
export type ForecastOriginTotal = ForecastTotal & { share: number };
export type ForecastMonth = ForecastTotal & { key: string; label: string; byOrigin: Record<LeadOrigin, number> };

export type Forecast = {
  /** Tulevat keikat lähimmästä päivästä alkaen. */
  upcoming: DatedJob[];
  total: ForecastTotal;
  byOrigin: Record<LeadOrigin, ForecastOriginTotal>;
  months: ForecastMonth[];
  /** Muuttopäivä on mennyt, mutta keikkaa ei ole merkitty tehdyksi — ei mukana summassa. */
  pastCount: number;
  /** Ei muuttopäivää — ei mukana summassa. */
  undatedCount: number;
};

export const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** "ti 3.11." (requestedDate on UTC-keskiyö, joten päivä luetaan UTC:nä) */
export function formatJobDay(date: Date): string {
  return date.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
}

/** "2026-11" -> "Marraskuu 2026" */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('fi-FI', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function totalOf(jobs: BookedJob[]): ForecastTotal {
  const { sum, missing } = sumValues(jobs.map((job) => job.value));
  return { count: jobs.length, sum, missing };
}

function originSums(jobs: BookedJob[]): Record<LeadOrigin, number> {
  const sums = Object.fromEntries(LEAD_ORIGINS.map((origin) => [origin, 0])) as Record<LeadOrigin, number>;
  for (const job of jobs) sums[job.origin] += job.value ?? 0;
  return sums;
}

const byDate = (a: DatedJob, b: DatedJob) => a.requestedDate.getTime() - b.requestedDate.getTime();

/** `todayKey` on Suomen päivä muodossa YYYY-MM-DD (toHelsinkiDateInput). Tämä päivä lasketaan vielä tulevaksi. */
export function summarizeBookedJobs(jobs: BookedJob[], todayKey: string): Forecast {
  const booked = jobs.filter((job) => BOOKED_STATUSES.includes(job.status));
  const dated = booked.filter((job): job is DatedJob => job.requestedDate !== null);
  const upcoming = dated.filter((job) => dayKey(job.requestedDate) >= todayKey).sort(byDate);
  const total = totalOf(upcoming);

  const byOrigin = Object.fromEntries(
    LEAD_ORIGINS.map((origin) => {
      const originTotal = totalOf(upcoming.filter((job) => job.origin === origin));
      return [origin, { ...originTotal, share: total.sum > 0 ? originTotal.sum / total.sum : 0 }];
    }),
  ) as Record<LeadOrigin, ForecastOriginTotal>;

  const monthKeys = [...new Set(upcoming.map((job) => dayKey(job.requestedDate).slice(0, 7)))];
  const months = monthKeys.map((key) => {
    const inMonth = upcoming.filter((job) => dayKey(job.requestedDate).startsWith(key));
    return { key, label: monthLabel(key), ...totalOf(inMonth), byOrigin: originSums(inMonth) };
  });

  return {
    upcoming,
    total,
    byOrigin,
    months,
    pastCount: dated.length - upcoming.length,
    undatedCount: booked.length - dated.length,
  };
}

// ---------- Lajittelu (URL-parametri ?jarjesta=) ----------

export type ForecastSort = 'paiva' | 'summa' | 'lahde';

export const FORECAST_SORTS: { id: ForecastSort; label: string }[] = [
  { id: 'paiva', label: 'Päivä' },
  { id: 'summa', label: 'Summa' },
  { id: 'lahde', label: 'Lähde' },
];

export function isForecastSort(value: unknown): value is ForecastSort {
  return FORECAST_SORTS.some((sort) => sort.id === value);
}

/** Päivä: lähin ensin. Summa: suurin ensin, hinnattomat viimeisinä. Lähde: lähteittäin, sen sisällä päivän mukaan. */
export function sortUpcoming(jobs: DatedJob[], sort: ForecastSort): DatedJob[] {
  const copy = [...jobs];
  switch (sort) {
    case 'summa':
      return copy.sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || byDate(a, b));
    case 'lahde':
      return copy.sort((a, b) => LEAD_ORIGINS.indexOf(a.origin) - LEAD_ORIGINS.indexOf(b.origin) || byDate(a, b));
    default:
      return copy.sort(byDate);
  }
}
