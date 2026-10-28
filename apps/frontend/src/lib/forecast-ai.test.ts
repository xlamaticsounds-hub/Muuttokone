import { describe, expect, it } from 'vitest';
import { summarizeBookedJobs, type BookedJob } from './forecast';
import { forecastTips } from './forecast-tips';
import { buildForecastAiPrompt, forecastFingerprint, formatGeneratedAt, parseForecastAiResult } from './forecast-ai';

const TODAY = '2026-10-28';
const job = (id: string, date: string, value: number | null, origin: BookedJob['origin']): BookedJob => ({
  id,
  status: 'WON',
  requestedDate: new Date(`${date}T00:00:00Z`),
  value,
  origin,
  name: `Salainen Asiakas ${id}`,
  route: 'Salakatu 1, Helsinki → Piilotie 2, Espoo',
  tentativeCalendar: false,
});

const jobs = [job('a', '2026-11-03', 450, 'muuttomaailma'), job('b', '2026-11-12', null, 'oma'), job('c', '2026-12-01', 780, 'oma')];
const forecast = summarizeBookedJobs(jobs, TODAY);

describe('buildForecastAiPrompt', () => {
  const prompt = buildForecastAiPrompt(forecast, forecastTips(forecast, TODAY), TODAY);

  it('sisältää summat, lähteet, viikot ja sääntöjen havainnot', () => {
    expect(prompt).toContain('Tulevat vahvistetut keikat: 3 kpl');
    expect(prompt).toContain('(1 keikalta puuttuu hinta)');
    expect(prompt).toContain('Muuttomaailma 1 kpl');
    expect(prompt).toContain('vk 45 (alkaa 2026-11-02): 1 kpl');
    expect(prompt).toContain('- 2026-11-12 to, Oma sivu, hinta puuttuu');
    expect(prompt).toContain('Sääntöjen havainnot: 1 keikalta puuttuu hinta');
  });

  it('ei paljasta asiakkaiden nimiä eikä osoitteita', () => {
    expect(prompt).not.toContain('Salainen');
    expect(prompt).not.toContain('Salakatu');
    expect(prompt).not.toContain('Piilotie');
  });
});

describe('forecastFingerprint', () => {
  it('muuttuu, kun hinta, päivä tai keikkamäärä muuttuu, ja pysyy samana samalla datalla', () => {
    const base = forecastFingerprint(forecast);
    expect(forecastFingerprint(summarizeBookedJobs(jobs, TODAY))).toBe(base);
    expect(forecastFingerprint(summarizeBookedJobs([...jobs.slice(0, 2), { ...jobs[2], value: 800 }], TODAY))).not.toBe(base);
    expect(forecastFingerprint(summarizeBookedJobs([...jobs.slice(0, 2), { ...jobs[2], requestedDate: new Date('2026-12-02T00:00:00Z') }], TODAY))).not.toBe(base);
    expect(forecastFingerprint(summarizeBookedJobs(jobs.slice(0, 2), TODAY))).not.toBe(base);
  });
});

describe('parseForecastAiResult', () => {
  it('hyväksyy ehjän tuloksen ja suodattaa rikkinäiset vinkit', () => {
    const parsed = parseForecastAiResult({
      generatedAt: '2026-10-28T18:15:00.000Z',
      fingerprint: '3-abc',
      summary: 'Hyvä tilanne.',
      tips: [{ title: 'T', detail: 'D' }, { title: 1 }, null],
    });
    expect(parsed?.tips).toEqual([{ title: 'T', detail: 'D' }]);
  });
  it('hylkää väärän muodon', () => {
    expect(parseForecastAiResult(null)).toBeNull();
    expect(parseForecastAiResult({ summary: 'x' })).toBeNull();
    expect(parseForecastAiResult('teksti')).toBeNull();
  });
});

describe('formatGeneratedAt', () => {
  it('näyttää ajan Suomen aikaa', () => {
    expect(formatGeneratedAt('2026-10-28T18:15:00.000Z')).toBe('28.10. klo 20.15');
  });
});
