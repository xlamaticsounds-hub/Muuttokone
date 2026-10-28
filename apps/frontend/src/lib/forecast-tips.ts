import { MAX_JOBS_PER_DAY, overloadedDays } from '@/lib/calendar-load';
import { dayKey, formatJobDay, type DatedJob, type Forecast } from '@/lib/forecast';

// Ennuste-sivun vinkit: säännöt nostavat esiin asiat, jotka kannattaa hoitaa (alustavat kalenterimerkinnät,
// puuttuvat hinnat, ruuhkapäivät, tyhjät viikot, kanavien tasapaino, käsittelemättömät keikat). Puhtaita
// funktioita, jotta ne voi testata. Tekoälyn yhteenveto (server/forecast-actions.ts) saa samat havainnot syötteeksi.

export type TipLink = { label: string; href: string };
export type ForecastTip = { key: string; tone: 'warning' | 'info'; title: string; detail: string; links: TipLink[] };

const MAX_LINKS = 3;
const WEEKS_AHEAD = 4;
/** Muuttomaailman osuus tulevasta myynnistä, josta alkaen siitä vinkataan. */
const MUUTTOMAAILMA_SHARE_LIMIT = 0.6;
const MIN_JOBS_FOR_SHARE = 3;
const DAY_MS = 86_400_000;

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const shortDate = (date: Date) => `${date.getUTCDate()}.${date.getUTCMonth() + 1}.`;
const listFi = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ja ${items[items.length - 1]}`);

const jobLinks = (jobs: DatedJob[]): TipLink[] =>
  jobs.slice(0, MAX_LINKS).map((job) => ({ label: `${formatJobDay(job.requestedDate)} ${job.name}`, href: `/hallinta/liidit/${job.id}` }));

/** ISO-viikkonumero (ma–su), kuten suomalaisissa kalentereissa. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // viikon torstai ratkaisee vuoden
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
}

/** Seuraavat `n` kokonaista viikkoa (ma–su) kuluvan viikon jälkeen. */
export function upcomingWeeks(todayKey: string, n: number): { week: number; start: Date; end: Date }[] {
  const today = new Date(`${todayKey}T00:00:00Z`);
  const daysToNextMonday = 8 - (today.getUTCDay() || 7);
  return Array.from({ length: n }, (_, i) => {
    const start = new Date(today.getTime() + (daysToNextMonday + 7 * i) * DAY_MS);
    return { week: isoWeek(start), start, end: new Date(start.getTime() + 6 * DAY_MS) };
  });
}

/** Varoitukset ensin, sitten muut vinkit. `todayKey` on Suomen päivä (YYYY-MM-DD). */
export function forecastTips(forecast: Forecast, todayKey: string): ForecastTip[] {
  const tips: ForecastTip[] = [];
  const { upcoming } = forecast;

  const tentative = upcoming.filter((job) => job.tentativeCalendar);
  if (tentative.length > 0) {
    tips.push({
      key: 'tentative-calendar',
      tone: 'warning',
      title: `${count(tentative.length, 'laskurivaraus', 'laskurivarausta')} on Google-kalenterissa vielä alustavana`,
      detail: 'Merkitse ne liidin sivulla voitetuiksi, niin kalenterimerkintä muuttuu alustavasta vahvistetuksi.',
      links: jobLinks(tentative),
    });
  }

  const unpriced = upcoming.filter((job) => job.value === null);
  if (unpriced.length > 0) {
    tips.push({
      key: 'missing-price',
      tone: 'warning',
      title: `${unpriced.length} keikalta puuttuu hinta`,
      detail: 'Ennuste on siksi todellista pienempi. Lisää sovittu hinta liidin sivulla.',
      links: jobLinks(unpriced),
    });
  }

  const overloaded = [...overloadedDays(upcoming.map((job) => ({ date: dayKey(job.requestedDate), status: job.status })), MAX_JOBS_PER_DAY)].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  if (overloaded.length > 0) {
    const days = overloaded.map(([day, n]) => `${formatJobDay(new Date(`${day}T00:00:00Z`))} (${n} keikkaa)`);
    tips.push({
      key: 'overloaded',
      tone: 'warning',
      title: `${count(overloaded.length, 'päivälle', 'päivälle')} on yli ${MAX_JOBS_PER_DAY} keikkaa`,
      detail: `${listFi(days)}. Tarkista, riittävätkö tekijät ja autot, tai siirrä keikka toiselle päivälle.`,
      links: [],
    });
  }

  if (forecast.pastCount > 0) {
    tips.push({
      key: 'past-unprocessed',
      tone: 'warning',
      title: `${count(forecast.pastCount, 'mennyt keikka odottaa', 'mennyttä keikkaa odottaa')} merkintää tehdyksi`,
      detail: 'Muuttopäivä on mennyt, mutta keikkaa ei ole merkitty tehdyksi. Ne eivät näy ennusteessa eivätkä raporteissa ennen merkintää.',
      links: [{ label: 'Avaa Keikat', href: '/hallinta/keikat#menneet' }],
    });
  }

  const emptyWeeks = upcomingWeeks(todayKey, WEEKS_AHEAD).filter(
    (week) => !upcoming.some((job) => job.requestedDate >= week.start && job.requestedDate <= week.end),
  );
  if (emptyWeeks.length > 0) {
    const numbers = emptyWeeks.map((week) => String(week.week));
    tips.push({
      key: 'empty-weeks',
      tone: 'info',
      title: emptyWeeks.length === 1 ? `Viikolla ${numbers[0]} ei ole vielä keikkoja` : `Viikoilla ${listFi(numbers)} ei ole vielä keikkoja`,
      detail: `${emptyWeeks.map((week) => `vk ${week.week} (${shortDate(week.start)}–${shortDate(week.end)})`).join(', ')}. Näille viikoille mahtuu vielä töitä — vastaa Muuttomaailman pyyntöihin näille päiville.`,
      links: [],
    });
  }

  const muuttomaailmaShare = forecast.byOrigin.muuttomaailma.share;
  if (upcoming.length >= MIN_JOBS_FOR_SHARE && muuttomaailmaShare >= MUUTTOMAAILMA_SHARE_LIMIT) {
    const percent = Math.round(muuttomaailmaShare * 100);
    tips.push({
      key: 'origin-share',
      tone: 'info',
      title: `${percent} % tulevasta myynnistä tulee Muuttomaailmasta`,
      detail: `Oman sivun osuus on ${100 - percent} %. Kun oma sivu tuo enemmän keikkoja, myynti ei ole yhden kanavan varassa.`,
      links: [],
    });
  }

  if (forecast.undatedCount > 0) {
    tips.push({
      key: 'undated',
      tone: 'info',
      title: `${count(forecast.undatedCount, 'keikka', 'keikkaa')} ilman muuttopäivää`,
      detail: 'Ne eivät näy kalenterissa eivätkä ennusteessa ennen kuin päivä on sovittu.',
      links: [{ label: 'Avaa Keikat', href: '/hallinta/keikat#ilman-paivaa' }],
    });
  }

  return [...tips.filter((tip) => tip.tone === 'warning'), ...tips.filter((tip) => tip.tone === 'info')];
}
