import { describe, expect, it } from 'vitest';
import {
  formatHelsinkiDate,
  helsinkiDayEnd,
  helsinkiDayStart,
  helsinkiMonthRange,
  previousHelsinkiMonth,
  toHelsinkiDateInput,
} from './helsinki-time';

describe('helsinki-time', () => {
  it('päivän alku talviaikaan (UTC+2) ja kesäaikaan (UTC+3)', () => {
    expect(helsinkiDayStart('2026-01-15')?.toISOString()).toBe('2026-01-14T22:00:00.000Z');
    expect(helsinkiDayStart('2026-07-15')?.toISOString()).toBe('2026-07-14T21:00:00.000Z');
  });

  it('päivän loppu on viimeinen millisekunti Suomen aikaa', () => {
    expect(helsinkiDayEnd('2026-12-31')?.toISOString()).toBe('2026-12-31T21:59:59.999Z');
    expect(helsinkiDayEnd('2026-06-30')?.toISOString()).toBe('2026-06-30T20:59:59.999Z');
  });

  it('hylkää väärän muodon', () => {
    expect(helsinkiDayStart('31.12.2026')).toBeNull();
    expect(helsinkiDayEnd('')).toBeNull();
  });

  it('kesäaikasiirtymien päivät (29.3. ja 25.10.2026)', () => {
    expect(helsinkiDayStart('2026-03-29')?.toISOString()).toBe('2026-03-28T22:00:00.000Z');
    expect(helsinkiDayEnd('2026-03-29')?.toISOString()).toBe('2026-03-29T20:59:59.999Z');
    expect(helsinkiDayStart('2026-10-25')?.toISOString()).toBe('2026-10-24T21:00:00.000Z');
    expect(helsinkiDayEnd('2026-10-25')?.toISOString()).toBe('2026-10-25T21:59:59.999Z');
  });

  it('kuukauden rajat Suomen aikaa', () => {
    const oct = helsinkiMonthRange(2026, 10);
    expect(oct.start.toISOString()).toBe('2026-09-30T21:00:00.000Z');
    expect(oct.end.toISOString()).toBe('2026-10-31T22:00:00.000Z'); // kesäaika päättyy lokakuussa
    const dec = helsinkiMonthRange(2026, 12);
    expect(dec.end.toISOString()).toBe('2026-12-31T22:00:00.000Z');
  });

  it('1.10. klo 01 Suomen aikaa kuuluu lokakuuhun, vaikka UTC:ssä on vielä syyskuu', () => {
    const lateNight = new Date('2026-09-30T22:30:00.000Z'); // 1.10. klo 01.30 Helsinki
    const oct = helsinkiMonthRange(2026, 10);
    expect(lateNight >= oct.start && lateNight < oct.end).toBe(true);
    expect(toHelsinkiDateInput(lateNight)).toBe('2026-10-01');
    expect(formatHelsinkiDate(lateNight)).toBe('1.10.2026');
  });

  it('edellinen kuukausi Suomen aikaa', () => {
    expect(previousHelsinkiMonth(new Date('2026-11-01T03:00:00.000Z'))).toEqual({ year: 2026, month: 10 });
    expect(previousHelsinkiMonth(new Date('2027-01-01T00:30:00.000Z'))).toEqual({ year: 2026, month: 12 });
    // 31.10. klo 23.30 UTC = 1.11. klo 01.30 Helsinki -> edellinen kuukausi on lokakuu
    expect(previousHelsinkiMonth(new Date('2026-10-31T23:30:00.000Z'))).toEqual({ year: 2026, month: 10 });
  });
});
