import { MAX_JOBS_PER_DAY } from '@/lib/calendar-load';
import { dayKey, formatJobDay, type Forecast } from '@/lib/forecast';
import type { ForecastTip } from '@/lib/forecast-tips';
import { upcomingWeeks } from '@/lib/forecast-tips';
import { LEAD_ORIGINS, LEAD_ORIGIN_LABELS } from '@/lib/lead-origin';
import { formatEuros } from '@/lib/pipeline';

// Ennuste-sivun tekoälyvinkit: mallille annettava syöte ja tallennetun tuloksen muoto. Mallille annetaan vain
// summat ja päivät — ei asiakkaiden nimiä, osoitteita eikä yhteystietoja. Tulos tallennetaan AppState-tauluun
// (server/forecast-actions.ts), jottei mallia kutsuta joka sivulatauksella.

export const FORECAST_AI_STATE_KEY = 'forecast-ai-tips';
const AI_WEEKS_AHEAD = 8;
const MAX_JOB_LINES = 60;

export const FORECAST_AI_SYSTEM_PROMPT = [
  'Olet Muuttokone-muuttofirman (Helsinki ja Uusimaa) liiketoiminta-avustaja. Omistajat tekevät keikat itse.',
  'Saat yhteenvedon tulevista vahvistetuista keikoista: määrät ja summat lähteittäin, kuukausittain ja viikoittain.',
  'Keikkoja tulee kahdesta kanavasta: Muuttomaailma (muuttopalvelujen tarjouspyyntöalusta) ja oma sivu (muuttolaskuri).',
  `Yhdelle päivälle mahtuu enintään ${MAX_JOBS_PER_DAY} keikkaa.`,
  'Anna 3–5 lyhyttä ja konkreettista vinkkiä siitä, mitä omistajat voisivat tehdä paremmin seuraavien viikkojen aikana,',
  'esimerkiksi tyhjien päivien täyttäminen, kanavien tasapaino, keikkojen ajoitus ja hoitamatta olevat asiat.',
  'Käytä vain annettuja lukuja. Älä keksi lukuja, asiakkaita, hintoja tai tapahtumia. Älä ota kantaa arvonlisäveroon.',
  'Sääntöjen havainnot näytetään omistajille jo erikseen: älä toista niitä sellaisenaan, vaan lisää niihin uutta näkökulmaa.',
  'Jos dataa on vähän, sano se ja anna silti dataan perustuvia vinkkejä. Kirjoita suomeksi, selkeästi ja ilman jargonia.',
].join('\n');

export type ForecastAiTip = { title: string; detail: string };
export type ForecastAiResult = { generatedAt: string; fingerprint: string; summary: string; tips: ForecastAiTip[] };

export function buildForecastAiPrompt(forecast: Forecast, tips: ForecastTip[], todayKey: string): string {
  const { total, byOrigin, months, upcoming } = forecast;
  const lines: string[] = [];

  lines.push(`Tänään: ${formatJobDay(new Date(`${todayKey}T00:00:00Z`))} ${todayKey}`);
  lines.push(
    `Tulevat vahvistetut keikat: ${total.count} kpl, yhteensä ${formatEuros(total.sum)}${total.missing > 0 ? ` (${total.missing} keikalta puuttuu hinta)` : ''}`,
  );
  lines.push(
    `Lähteittäin: ${LEAD_ORIGINS.map((origin) => `${LEAD_ORIGIN_LABELS[origin]} ${byOrigin[origin].count} kpl, ${formatEuros(byOrigin[origin].sum)} (${Math.round(byOrigin[origin].share * 100)} %)`).join('; ')}`,
  );
  if (months.length > 0) {
    lines.push(`Kuukausittain: ${months.map((month) => `${month.label} ${month.count} kpl, ${formatEuros(month.sum)}`).join('; ')}`);
  }

  const weeks = upcomingWeeks(todayKey, AI_WEEKS_AHEAD).map((week) => {
    const inWeek = upcoming.filter((job) => job.requestedDate >= week.start && job.requestedDate <= week.end);
    const sum = inWeek.reduce((acc, job) => acc + (job.value ?? 0), 0);
    return `vk ${week.week} (alkaa ${dayKey(week.start)}): ${inWeek.length} kpl, ${formatEuros(sum)}`;
  });
  lines.push(`Viikoittain seuraavat ${AI_WEEKS_AHEAD} viikkoa (kuluva viikko ei mukana): ${weeks.join('; ')}`);

  lines.push('Keikat (päivä, lähde, hinta):');
  for (const job of upcoming.slice(0, MAX_JOB_LINES)) {
    lines.push(`- ${dayKey(job.requestedDate)} ${formatJobDay(job.requestedDate).split(' ')[0]}, ${LEAD_ORIGIN_LABELS[job.origin]}, ${job.value != null ? formatEuros(job.value) : 'hinta puuttuu'}`);
  }
  if (upcoming.length > MAX_JOB_LINES) lines.push(`- … ja ${upcoming.length - MAX_JOB_LINES} muuta`);

  lines.push(`Menneitä keikkoja merkitsemättä tehdyksi: ${forecast.pastCount}. Keikkoja ilman päivää: ${forecast.undatedCount}.`);
  lines.push(tips.length > 0 ? `Sääntöjen havainnot: ${tips.map((tip) => tip.title).join('; ')}` : 'Sääntöjen havainnot: ei huomautettavaa.');

  return lines.join('\n');
}

/** Muuttuuko keikkadata tallennetun vinkin jälkeen? Pieni tiiviste päivistä, lähteistä ja hinnoista. */
export function forecastFingerprint(forecast: Forecast): string {
  const text = forecast.upcoming.map((job) => `${job.id}:${dayKey(job.requestedDate)}:${job.origin}:${job.value ?? ''}`).join('|');
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${forecast.upcoming.length}-${hash.toString(36)}`;
}

/** AppStatesta luettu arvo voi olla mitä tahansa (vanha muoto, käsin muokattu) — palautetaan vain ehjä tulos. */
export function parseForecastAiResult(value: unknown): ForecastAiResult | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.generatedAt !== 'string' || typeof v.fingerprint !== 'string' || typeof v.summary !== 'string' || !Array.isArray(v.tips)) return null;
  const tips = v.tips.filter(
    (tip): tip is ForecastAiTip => Boolean(tip) && typeof (tip as ForecastAiTip).title === 'string' && typeof (tip as ForecastAiTip).detail === 'string',
  );
  return { generatedAt: v.generatedAt, fingerprint: v.fingerprint, summary: v.summary, tips };
}

/** "28.10. klo 20.15" Suomen aikaa */
export function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Helsinki' });
  const time = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' });
  return `${day} klo ${time}`;
}
