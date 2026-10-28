import { describe, expect, it } from 'vitest';
import { monthLabel, sortUpcoming, summarizeBookedJobs, type BookedJob } from './forecast';

const job = (id: string, status: BookedJob['status'], date: string | null, value: number | null, origin: BookedJob['origin'] = 'oma'): BookedJob => ({
  id,
  status,
  requestedDate: date ? new Date(`${date}T00:00:00Z`) : null,
  value,
  origin,
  name: `Asiakas ${id}`,
  route: 'A → B',
  tentativeCalendar: false,
});

const TODAY = '2026-10-28';

describe('summarizeBookedJobs', () => {
  it('laskee yhteen kaikki tulevat kalenterin keikat (Uusi varaus + Voitettu) yhtenä lukuna', () => {
    const forecast = summarizeBookedJobs(
      [
        job('a', 'WON', '2026-11-03', 400),
        job('b', 'SCHEDULED', '2026-11-10', 250),
        job('c', 'PROPOSAL_SENT', '2026-11-12', 900), // ei vielä varma
        job('d', 'NEW', '2026-11-15', 300), // ei vielä varma
        job('e', 'COMPLETED', '2026-11-20', 500), // jo tehty
        job('f', 'CANCELLED', '2026-11-21', 500),
      ],
      TODAY,
    );
    expect(forecast.upcoming.map((j) => j.id)).toEqual(['a', 'b']);
    expect(forecast.total).toEqual({ count: 2, sum: 650, missing: 0 });
  });

  it('jakaa summan lähteittäin ja laskee osuuden', () => {
    const forecast = summarizeBookedJobs(
      [job('a', 'WON', '2026-11-03', 600, 'muuttomaailma'), job('b', 'SCHEDULED', '2026-11-04', 200, 'oma'), job('c', 'WON', '2026-11-05', 200, 'muuttomaailma')],
      TODAY,
    );
    expect(forecast.byOrigin.muuttomaailma).toEqual({ count: 2, sum: 800, missing: 0, share: 0.8 });
    expect(forecast.byOrigin.oma).toEqual({ count: 1, sum: 200, missing: 0, share: 0.2 });
  });

  it('osuus on nolla, kun summaa ei ole', () => {
    const forecast = summarizeBookedJobs([job('a', 'WON', '2026-11-03', null, 'muuttomaailma')], TODAY);
    expect(forecast.byOrigin.muuttomaailma.share).toBe(0);
  });

  it('tämä päivä on vielä tuleva, eilinen ei', () => {
    const forecast = summarizeBookedJobs([job('today', 'WON', TODAY, 100), job('yesterday', 'WON', '2026-10-27', 100)], TODAY);
    expect(forecast.upcoming.map((j) => j.id)).toEqual(['today']);
    expect(forecast.pastCount).toBe(1);
  });

  it('kertoo montako keikkaa on ilman hintaa, summa on vähintään tämä', () => {
    const forecast = summarizeBookedJobs([job('a', 'WON', '2026-11-03', 400), job('b', 'SCHEDULED', '2026-11-04', null)], TODAY);
    expect(forecast.total).toEqual({ count: 2, sum: 400, missing: 1 });
  });

  it('jättää menneet ja päivättömät pois summasta mutta laskee ne erikseen', () => {
    const forecast = summarizeBookedJobs([job('past', 'WON', '2026-09-01', 800), job('undated', 'SCHEDULED', null, 600), job('next', 'WON', '2026-11-02', 200)], TODAY);
    expect(forecast.total.sum).toBe(200);
    expect(forecast.pastCount).toBe(1);
    expect(forecast.undatedCount).toBe(1);
  });

  it('ryhmittelee kuukausittain ajan mukaan lähteiden osuuksineen, vuodenvaihde mukaan lukien', () => {
    const forecast = summarizeBookedJobs(
      [
        job('a', 'WON', '2026-10-31', 100),
        job('b', 'WON', '2026-11-01', 200, 'muuttomaailma'),
        job('c', 'SCHEDULED', '2026-11-30', 300),
        job('d', 'WON', '2027-01-05', 400),
      ],
      TODAY,
    );
    expect(forecast.months.map((m) => [m.key, m.count, m.sum])).toEqual([
      ['2026-10', 1, 100],
      ['2026-11', 2, 500],
      ['2027-01', 1, 400],
    ]);
    expect(forecast.months[1].byOrigin).toEqual({ muuttomaailma: 200, oma: 300 });
  });

  it('tyhjällä listalla kaikki on nollaa', () => {
    const forecast = summarizeBookedJobs([], TODAY);
    expect(forecast.total).toEqual({ count: 0, sum: 0, missing: 0 });
    expect(forecast.months).toEqual([]);
    expect(forecast.pastCount).toBe(0);
    expect(forecast.undatedCount).toBe(0);
  });
});

describe('sortUpcoming', () => {
  const { upcoming } = summarizeBookedJobs(
    [
      job('late', 'WON', '2026-12-01', 900, 'oma'),
      job('soon', 'WON', '2026-10-30', 100, 'muuttomaailma'),
      job('mid', 'SCHEDULED', '2026-11-05', null, 'oma'),
      job('mid2', 'WON', '2026-11-06', 500, 'muuttomaailma'),
    ],
    TODAY,
  );

  it('päivä: lähin ensin', () => {
    expect(sortUpcoming(upcoming, 'paiva').map((j) => j.id)).toEqual(['soon', 'mid', 'mid2', 'late']);
  });
  it('summa: suurin ensin, hinnattomat viimeisinä', () => {
    expect(sortUpcoming(upcoming, 'summa').map((j) => j.id)).toEqual(['late', 'mid2', 'soon', 'mid']);
  });
  it('lähde: Muuttomaailma ensin, sen sisällä päivän mukaan', () => {
    expect(sortUpcoming(upcoming, 'lahde').map((j) => j.id)).toEqual(['soon', 'mid2', 'mid', 'late']);
  });
});

describe('monthLabel', () => {
  it('antaa suomenkielisen kuukauden isolla alkukirjaimella', () => {
    expect(monthLabel('2026-11')).toBe('Marraskuu 2026');
    expect(monthLabel('2027-01')).toBe('Tammikuu 2027');
  });
});
