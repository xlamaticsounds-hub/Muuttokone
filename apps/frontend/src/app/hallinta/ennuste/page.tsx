import Link from 'next/link';
import { AlertTriangle, Lightbulb, X } from 'lucide-react';
import { getAppState } from '@/server/app-state';
import { loadBookedJobs } from '@/server/forecast-data';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import {
  FORECAST_SORTS,
  formatJobDay,
  isForecastSort,
  sortUpcoming,
  summarizeBookedJobs,
  type BookedJob,
  type ForecastSort,
} from '@/lib/forecast';
import { forecastTips, type ForecastTip } from '@/lib/forecast-tips';
import { FORECAST_AI_STATE_KEY, forecastFingerprint, formatGeneratedAt, parseForecastAiResult } from '@/lib/forecast-ai';
import {
  LEAD_ORIGINS,
  LEAD_ORIGIN_BAR_CLASSES,
  LEAD_ORIGIN_LABELS,
  LEAD_ORIGIN_PILL_CLASSES,
  isLeadOrigin,
  type LeadOrigin,
} from '@/lib/lead-origin';
import { formatEuros } from '@/lib/pipeline';
import AiTips from './AiTips';

export const dynamic = 'force-dynamic';

const card = 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800';
const pill = 'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset';

const jobCount = (n: number) => `${n} ${n === 1 ? 'keikka' : 'keikkaa'}`;
const missingNote = (missing: number) => `${missing} keikalta puuttuu hinta, summa on vähintään tämä`;

function TipItem({ tip }: { tip: ForecastTip }) {
  const Icon = tip.tone === 'warning' ? AlertTriangle : Lightbulb;
  return (
    <li className="flex gap-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tip.tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white">{tip.title}</p>
        <p className="text-gray-600 dark:text-gray-300">{tip.detail}</p>
        {tip.links.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tip.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export default async function EnnustePage({ searchParams }: { searchParams: Promise<{ lahde?: string; jarjesta?: string }> }) {
  const { lahde, jarjesta } = await searchParams;
  const origin = isLeadOrigin(lahde) ? lahde : null;
  const sort: ForecastSort = isForecastSort(jarjesta) ? jarjesta : 'paiva';
  const todayKey = toHelsinkiDateInput(new Date());

  let dbUnavailable = false;
  let jobs: BookedJob[] = [];
  try {
    jobs = await loadBookedJobs();
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/ennuste] Database unavailable, showing fallback view', error);
  }

  // Lähdekortit ja vinkit katsovat aina kaikkia keikkoja, summa, kuukaudet ja lista valittua lähdettä
  const all = summarizeBookedJobs(jobs, todayKey);
  const view = origin ? summarizeBookedJobs(jobs.filter((job) => job.origin === origin), todayKey) : all;
  const tips = forecastTips(all, todayKey);
  const aiResult = parseForecastAiResult(await getAppState(FORECAST_AI_STATE_KEY));
  const listed = sortUpcoming(view.upcoming, sort);
  const maxMonthSum = Math.max(1, ...view.months.map((month) => month.sum));

  const href = (next: { lahde?: LeadOrigin | null; jarjesta?: ForecastSort }) => {
    const params = new URLSearchParams();
    const nextOrigin = next.lahde === undefined ? origin : next.lahde;
    const nextSort = next.jarjesta ?? sort;
    if (nextOrigin) params.set('lahde', nextOrigin);
    if (nextSort !== 'paiva') params.set('jarjesta', nextSort);
    const query = params.toString();
    return `/hallinta/ennuste${query ? `?${query}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Puhelimella otsikko on jo yläpalkissa, joten tämä näytetään vain isommalla näytöllä */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ennuste</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Paljonko tulevilla vahvistetuilla keikoilla on rahaa, mistä ne tulevat ja mitä voisi tehdä paremmin.</p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta tiedot eivät päivity.
        </div>
      )}

      {!dbUnavailable && (
        <>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={`${card} col-span-2 border-blue-200 bg-blue-50 sm:col-span-1 dark:border-blue-900/40 dark:bg-blue-900/20`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Vahvistetut keikat{origin && <span className="font-semibold"> · {LEAD_ORIGIN_LABELS[origin]}</span>}
                </p>
                <p className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">{formatEuros(view.total.sum)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{jobCount(view.total.count)}</p>
                {view.total.missing > 0 && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{missingNote(view.total.missing)}</p>}
              </div>
              {LEAD_ORIGINS.map((o) => {
                const total = all.byOrigin[o];
                const active = origin === o;
                return (
                  <Link
                    key={o}
                    href={href({ lahde: active ? null : o })}
                    className={`${card} block hover:border-gray-300 dark:hover:border-gray-500 ${active ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`${pill} ${LEAD_ORIGIN_PILL_CLASSES[o]}`}>{LEAD_ORIGIN_LABELS[o]}</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{Math.round(total.share * 100)} %</span>
                    </div>
                    <p className="mt-2 text-xl font-bold leading-tight text-gray-900 sm:text-2xl dark:text-white">{formatEuros(total.sum)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{jobCount(total.count)}</p>
                    <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">{active ? 'Näytä kaikki' : 'Näytä vain nämä'}</p>
                  </Link>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mukana kaikki tulevat keikat, jotka ovat kalenterissa (laskurin varaukset ja vahvistetut). Hinta on sovittu hinta tai laskurin arvio.
              Tarjousvaiheen keikat eivät ole mukana.
            </p>
          </div>

          <section className={card}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Vinkit</h2>
            {tips.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei huomautettavaa juuri nyt.</p>
            ) : (
              <ul className="space-y-3">
                {tips.map((tip) => (
                  <TipItem key={tip.key} tip={tip} />
                ))}
              </ul>
            )}
            <AiTips
              initial={aiResult}
              initialLabel={aiResult ? formatGeneratedAt(aiResult.generatedAt) : null}
              stale={aiResult ? aiResult.fingerprint !== forecastFingerprint(all) : false}
            />
          </section>

          {view.months.length > 0 && (
            <section className={card}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kuukausittain</h2>
                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {LEAD_ORIGINS.filter((o) => !origin || o === origin).map((o) => (
                    <span key={o} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${LEAD_ORIGIN_BAR_CLASSES[o]}`} />
                      {LEAD_ORIGIN_LABELS[o]}
                    </span>
                  ))}
                </div>
              </div>
              <ul className="space-y-3">
                {view.months.map((month) => (
                  <li key={month.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{month.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {jobCount(month.count)} · <span className="font-bold text-gray-900 dark:text-white">{formatEuros(month.sum)}</span>
                      </span>
                    </div>
                    <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      {LEAD_ORIGINS.map((o) =>
                        month.byOrigin[o] > 0 ? (
                          <div key={o} className={`h-full ${LEAD_ORIGIN_BAR_CLASSES[o]}`} style={{ width: `${(month.byOrigin[o] / maxMonthSum) * 100}%` }} />
                        ) : null,
                      )}
                    </div>
                    {month.missing > 0 && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{missingNote(month.missing)}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keikat</h2>
                {origin && (
                  <Link
                    href={href({ lahde: null })}
                    className={`${pill} ${LEAD_ORIGIN_PILL_CLASSES[origin]} flex items-center gap-1`}
                    aria-label={`Poista suodatin ${LEAD_ORIGIN_LABELS[origin]}`}
                  >
                    {LEAD_ORIGIN_LABELS[origin]} <X className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <nav aria-label="Lajittele" className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-sm dark:bg-gray-800">
                {FORECAST_SORTS.map((option) => (
                  <Link
                    key={option.id}
                    href={href({ jarjesta: option.id })}
                    aria-current={sort === option.id ? 'true' : undefined}
                    className={`rounded-md px-2.5 py-1 font-medium ${
                      sort === option.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </nav>
            </div>
            {listed.length === 0 ? (
              <p className={`${card} text-sm text-gray-500 dark:text-gray-400`}>Ei tulevia vahvistettuja keikkoja.</p>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
                {listed.map((job) => (
                  <li key={job.id}>
                    <Link href={`/hallinta/liidit/${job.id}`} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="mr-2 font-semibold text-blue-600 dark:text-blue-400">{formatJobDay(job.requestedDate)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{job.name}</span>
                        </p>
                        {job.route && <p className="truncate text-sm text-gray-500 dark:text-gray-400">{job.route}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{job.value != null ? formatEuros(job.value) : '–'}</p>
                        <span className={`mt-1 ${pill} ${LEAD_ORIGIN_PILL_CLASSES[job.origin]}`}>{LEAD_ORIGIN_LABELS[job.origin]}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
