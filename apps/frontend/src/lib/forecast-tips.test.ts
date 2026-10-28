import { describe, expect, it } from 'vitest';
import { summarizeBookedJobs, type BookedJob } from './forecast';
import { forecastTips, isoWeek, upcomingWeeks } from './forecast-tips';

const TODAY = '2026-10-28'; // keskiviikko, seuraava maanantai 2.11. (vk 45)

const job = (id: string, date: string | null, value: number | null, extra: Partial<BookedJob> = {}): BookedJob => ({
  id,
  status: 'WON',
  requestedDate: date ? new Date(`${date}T00:00:00Z`) : null,
  value,
  origin: 'oma',
  name: `Asiakas ${id}`,
  route: 'A → B',
  tentativeCalendar: false,
  ...extra,
});

// Yksi keikka jokaisella seuraavalla neljällä viikolla, jotta "tyhjä viikko" ei sotke muita testejä
const fullWeeks = [job('w45', '2026-11-03', 400), job('w46', '2026-11-10', 400), job('w47', '2026-11-17', 400), job('w48', '2026-11-24', 400)];
const tipsFor = (jobs: BookedJob[]) => forecastTips(summarizeBookedJobs(jobs, TODAY), TODAY);
const keys = (jobs: BookedJob[]) => tipsFor(jobs).map((tip) => tip.key);

describe('forecastTips', () => {
  it('ei vinkkejä, kun kaikki on kunnossa', () => {
    expect(tipsFor(fullWeeks)).toEqual([]);
  });

  it('alustava kalenterimerkintä: linkit liideihin', () => {
    const tips = tipsFor([...fullWeeks, job('t', '2026-11-05', 300, { status: 'SCHEDULED', tentativeCalendar: true })]);
    expect(tips[0].key).toBe('tentative-calendar');
    expect(tips[0].title).toBe('1 laskurivaraus on Google-kalenterissa vielä alustavana');
    expect(tips[0].links).toEqual([{ label: 'to 5.11. Asiakas t', href: '/hallinta/liidit/t' }]);
  });

  it('puuttuva hinta', () => {
    const tips = tipsFor([...fullWeeks, job('p', '2026-11-05', null)]);
    expect(tips.map((t) => t.key)).toEqual(['missing-price']);
    expect(tips[0].title).toBe('1 keikalta puuttuu hinta');
  });

  it('ruuhkapäivä: yli kaksi keikkaa samana päivänä', () => {
    const tips = tipsFor([...fullWeeks, job('x', '2026-11-03', 300), job('y', '2026-11-03', 300)]);
    expect(tips.map((t) => t.key)).toEqual(['overloaded']);
    expect(tips[0].detail).toContain('ti 3.11. (3 keikkaa)');
  });

  it('tyhjät viikot seuraavan neljän viikon ajalta', () => {
    const tips = tipsFor([job('a', '2026-11-03', 400), job('b', '2026-11-17', 400)]);
    expect(tips.map((t) => t.key)).toEqual(['empty-weeks']);
    expect(tips[0].title).toBe('Viikoilla 46 ja 48 ei ole vielä keikkoja');
    expect(tips[0].detail).toContain('vk 46 (9.11.–15.11.), vk 48 (23.11.–29.11.). Näille');
  });

  it('Muuttomaailman suuri osuus, mutta vain kun keikkoja on tarpeeksi', () => {
    const mm = (id: string, date: string) => job(id, date, 700, { origin: 'muuttomaailma' });
    expect(keys([mm('a', '2026-11-03'), mm('b', '2026-11-10'), job('c', '2026-11-17', 300), job('d', '2026-11-24', 300)])).toEqual(['origin-share']);
    expect(tipsFor([mm('a', '2026-11-03'), mm('b', '2026-11-10'), job('c', '2026-11-17', 300), job('d', '2026-11-24', 300)])[0].title).toBe(
      '70 % tulevasta myynnistä tulee Muuttomaailmasta',
    );
    // Vain kaksi keikkaa: osuudesta ei vielä vinkata (viikot 47–48 ovat tyhjiä)
    expect(keys([mm('a', '2026-11-03'), mm('b', '2026-11-10')])).toEqual(['empty-weeks']);
  });

  it('menneet ja päivättömät keikat', () => {
    const tips = tipsFor([...fullWeeks, job('old', '2026-10-01', 500), job('nodate', null, 500)]);
    expect(tips.map((t) => t.key)).toEqual(['past-unprocessed', 'undated']);
    expect(tips[0].title).toBe('1 mennyt keikka odottaa merkintää tehdyksi');
    expect(tips[1].title).toBe('1 keikka ilman muuttopäivää');
  });

  it('varoitukset ennen muita vinkkejä', () => {
    const tips = tipsFor([job('nodate', null, 500), job('p', '2026-11-03', null)]);
    expect(tips.map((t) => t.tone)).toEqual(['warning', 'info', 'info']);
  });
});

describe('isoWeek / upcomingWeeks', () => {
  it('ISO-viikot vuodenvaihteessa', () => {
    expect(isoWeek(new Date('2026-11-02T00:00:00Z'))).toBe(45);
    expect(isoWeek(new Date('2027-01-01T00:00:00Z'))).toBe(53);
    expect(isoWeek(new Date('2027-01-04T00:00:00Z'))).toBe(1);
  });

  it('seuraavat viikot alkavat seuraavasta maanantaista, myös sunnuntaina', () => {
    expect(upcomingWeeks(TODAY, 2).map((w) => [w.week, w.start.toISOString().slice(0, 10), w.end.toISOString().slice(0, 10)])).toEqual([
      [45, '2026-11-02', '2026-11-08'],
      [46, '2026-11-09', '2026-11-15'],
    ]);
    expect(upcomingWeeks('2026-11-01', 1)[0].start.toISOString().slice(0, 10)).toBe('2026-11-02');
    expect(upcomingWeeks('2026-11-02', 1)[0].start.toISOString().slice(0, 10)).toBe('2026-11-09');
  });
});
