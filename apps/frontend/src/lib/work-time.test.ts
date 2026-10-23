import { describe, expect, it } from 'vitest';
import {
  clampInt,
  entriesToCsv,
  formatClock,
  formatDuration,
  formatEntryDate,
  formatStopwatch,
  monthLabel,
  monthParam,
  parseHelsinkiDateTimeInput,
  parseMonthParam,
  periodRanges,
  personHours,
  revenuePerPersonHour,
  shiftMonth,
  summarizePeriod,
  toHelsinkiDateTimeInput,
  validateEntryTimes,
  workedMinutes,
} from './work-time';

const at = (iso: string) => new Date(iso);

describe('workedMinutes ja personHours', () => {
  it('vähentää tauot ja laskee henkilötunnit', () => {
    const entry = { startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T10:30:00Z'), breakMinutes: 30, crewSize: 3 };
    expect(workedMinutes(entry)).toBe(240); // 4 h 30 min − 30 min tauko
    expect(personHours(entry)).toBe(12);
  });

  it('käynnissä oleva työ lasketaan nykyhetkeen asti', () => {
    const entry = { startedAt: at('2026-10-22T06:00:00Z'), endedAt: null, breakMinutes: 0, crewSize: 2 };
    expect(workedMinutes(entry, at('2026-10-22T07:30:00Z'))).toBe(90);
    expect(personHours(entry, at('2026-10-22T07:30:00Z'))).toBe(3);
  });

  it('ei koskaan negatiivinen (tauko pidempi kuin työ)', () => {
    const entry = { startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T06:20:00Z'), breakMinutes: 45, crewSize: 3 };
    expect(workedMinutes(entry)).toBe(0);
  });
});

describe('muotoilut', () => {
  it('formatDuration', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(180)).toBe('3 h');
    expect(formatDuration(135)).toBe('2 h 15 min');
    expect(formatDuration(-5)).toBe('0 min');
  });

  it('formatStopwatch', () => {
    expect(formatStopwatch(0)).toBe('0:00:00');
    expect(formatStopwatch(65_000)).toBe('0:01:05');
    expect(formatStopwatch(3_725_000)).toBe('1:02:05');
    expect(formatStopwatch(-1000)).toBe('0:00:00');
  });

  it('formatEntryDate näyttää viikonpäivän ja päivän Suomen ajassa', () => {
    expect(formatEntryDate(at('2026-10-22T12:00:00Z'))).toBe('to 22.10.');
    expect(formatEntryDate(at('2026-10-22T21:30:00Z'))).toBe('pe 23.10.'); // 00.30 Suomen aikaa
  });

  it('formatClock käyttää Suomen aikaa (talvi +2, kesä +3)', () => {
    expect(formatClock(at('2026-12-01T07:30:00Z'))).toMatch(/^09[.:]30$/);
    expect(formatClock(at('2026-07-01T07:30:00Z'))).toMatch(/^10[.:]30$/);
  });
});

describe('datetime-local-kentän muunnokset', () => {
  it('muuntaa edestakaisin Suomen ajassa', () => {
    const date = parseHelsinkiDateTimeInput('2026-10-22T09:30');
    expect(date?.toISOString()).toBe('2026-10-22T06:30:00.000Z'); // lokakuussa vielä kesäaika (+3)
    expect(toHelsinkiDateTimeInput(date!)).toBe('2026-10-22T09:30');
    expect(parseHelsinkiDateTimeInput('2026-12-01T09:30')?.toISOString()).toBe('2026-12-01T07:30:00.000Z');
  });

  it('hylkää virheelliset arvot', () => {
    expect(parseHelsinkiDateTimeInput('')).toBeNull();
    expect(parseHelsinkiDateTimeInput('22.10.2026 09:30')).toBeNull();
    expect(parseHelsinkiDateTimeInput('2026-13-01T09:30')).toBeNull();
    expect(parseHelsinkiDateTimeInput('2026-02-31T09:30')).toBeNull(); // ei 31. helmikuuta
    expect(parseHelsinkiDateTimeInput('2026-10-22T25:00')).toBeNull();
  });
});

describe('validateEntryTimes', () => {
  const now = at('2026-10-22T12:00:00Z');
  it('hyväksyy normaalin jakson', () => {
    expect(validateEntryTimes(at('2026-10-22T06:00:00Z'), at('2026-10-22T10:00:00Z'), now)).toBeNull();
    expect(validateEntryTimes(at('2026-10-22T06:00:00Z'), null, now)).toBeNull();
  });
  it('hylkää virheelliset', () => {
    expect(validateEntryTimes(at('2026-10-22T10:00:00Z'), at('2026-10-22T09:00:00Z'), now)).toMatch(/jälkeen/);
    expect(validateEntryTimes(at('2026-10-20T06:00:00Z'), at('2026-10-22T06:00:00Z'), now)).toMatch(/24 tuntia/);
    expect(validateEntryTimes(at('2026-10-23T12:00:00Z'), null, now)).toMatch(/tulevaisuudessa/);
    expect(validateEntryTimes(at('2026-10-22T06:00:00Z'), at('2026-10-23T06:00:00Z'), now)).toMatch(/tulevaisuudessa/);
    expect(validateEntryTimes(new Date(NaN), null, now)).toMatch(/Alkuaika/);
  });
});

describe('clampInt', () => {
  it('rajaa ja käyttää oletusta', () => {
    expect(clampInt(3, 1, 10, 3)).toBe(3);
    expect(clampInt('4', 1, 10, 3)).toBe(4);
    expect(clampInt(99, 1, 10, 3)).toBe(10);
    expect(clampInt(-4, 0, 600, 0)).toBe(0);
    expect(clampInt('abc', 1, 10, 3)).toBe(3);
    expect(clampInt(2.6, 1, 10, 3)).toBe(3);
  });
});

describe('periodRanges ja summarizePeriod', () => {
  // Torstai 22.10.2026 klo 12.00 UTC (klo 15.00 Suomen aikaa)
  const now = at('2026-10-22T12:00:00Z');

  it('laskee päivän, viikon ja kuukauden rajat Suomen aikaa', () => {
    const r = periodRanges(now);
    expect(r.today.start.toISOString()).toBe('2026-10-21T21:00:00.000Z'); // 22.10. 00.00 (+3)
    expect(r.today.end.toISOString()).toBe('2026-10-22T21:00:00.000Z');
    expect(r.week.start.toISOString()).toBe('2026-10-18T21:00:00.000Z'); // ma 19.10. 00.00
    expect(r.week.end.toISOString()).toBe('2026-10-25T22:00:00.000Z'); // ma 26.10. 00.00: kesäaika päättyi su 25.10., joten +2 h
    expect(r.month.start.toISOString()).toBe('2026-09-30T21:00:00.000Z');
  });

  it('viikko alkaa maanantaista myös sunnuntaina', () => {
    const sunday = at('2026-10-18T10:00:00Z'); // su 18.10.
    expect(periodRanges(sunday).week.start.toISOString()).toBe('2026-10-11T21:00:00.000Z'); // ma 12.10.
  });

  it('yhteenveto laskee työajan, henkilötunnit ja eri työt', () => {
    const entries = [
      { id: 'a', leadId: 'L1', startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T09:00:00Z'), breakMinutes: 0, crewSize: 3 }, // 3 h × 3
      { id: 'b', leadId: 'L1', startedAt: at('2026-10-22T10:00:00Z'), endedAt: at('2026-10-22T11:00:00Z'), breakMinutes: 0, crewSize: 3 }, // sama liidi
      { id: 'c', leadId: null, startedAt: at('2026-10-22T11:30:00Z'), endedAt: null, breakMinutes: 0, crewSize: 2 }, // käynnissä 0,5 h × 2
      { id: 'd', leadId: 'L2', startedAt: at('2026-10-20T06:00:00Z'), endedAt: at('2026-10-20T08:00:00Z'), breakMinutes: 0, crewSize: 3 }, // eri päivä
    ];
    const today = periodRanges(now).today;
    expect(summarizePeriod(entries, today, now)).toEqual({ entries: 3, jobs: 2, minutes: 3 * 60 + 60 + 30, personHours: 9 + 3 + 1 });
    const week = periodRanges(now).week;
    expect(summarizePeriod(entries, week, now).entries).toBe(4);
  });
});

describe('revenuePerPersonHour', () => {
  it('jakaa hinnan henkilötunneilla ja suojaa nollilta', () => {
    expect(revenuePerPersonHour(300, 10)).toBe(30);
    expect(revenuePerPersonHour(null, 10)).toBeNull();
    expect(revenuePerPersonHour(300, 0)).toBeNull();
    expect(revenuePerPersonHour(0, 5)).toBeNull();
  });
});

describe('entriesToCsv', () => {
  it('tuottaa suomalaisen CSV:n (puolipiste, desimaalipilkku, BOM) ja suojaa erikoismerkit', () => {
    const csv = entriesToCsv([
      { startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T10:00:00Z'), breakMinutes: 30, crewSize: 3, title: 'Muutto; "iso" koti', leadId: 'L1', price: 450, notes: 'rivi1\nrivi2' },
      { startedAt: at('2026-10-22T11:00:00Z'), endedAt: null, breakMinutes: 0, crewSize: 2, title: 'Purku', leadId: null, price: null, notes: null },
    ], at('2026-10-22T12:00:00Z'));
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Päivä;Alku;Loppu;Tauko (min);Työaika (h);Henkilöä;Henkilötunnit;Keikka tai työ;Liidin ID;Hinta (€);€ / henkilötunti;Muistiinpano');
    expect(csv).toContain('3,50;3;10,50;"Muutto; ""iso"" koti";L1;450,00;42,86;"rivi1\nrivi2"');
    expect(lines[lines.length - 1]).toContain('käynnissä');
  });
});

describe('kuukausiapurit', () => {
  const now = at('2026-10-22T12:00:00Z');

  it('lukee kuukauden osoiterivin arvosta ja putoaa nykyiseen kuukauteen', () => {
    expect(parseMonthParam('2026-03', now)).toEqual({ year: 2026, month: 3 });
    expect(parseMonthParam(undefined, now)).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam('2026-13', now)).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam('huomenna', now)).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam('1999-05', now)).toEqual({ year: 2026, month: 10 });
  });

  it('nykyinen kuukausi lasketaan Suomen ajassa', () => {
    // Kesäaika päättyi 25.10., joten 31.10. Suomi on UTC+2: 21.30 UTC = 23.30 (lokakuu), 22.00 UTC = 1.11. klo 00.00
    expect(parseMonthParam(null, at('2026-10-31T21:30:00Z'))).toEqual({ year: 2026, month: 10 });
    expect(parseMonthParam(null, at('2026-10-31T22:00:00Z'))).toEqual({ year: 2026, month: 11 });
  });

  it('muotoilee ja siirtää kuukausia vuodenvaihteen yli', () => {
    expect(monthParam(2026, 3)).toBe('2026-03');
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 10, 0)).toEqual({ year: 2026, month: 10 });
    expect(monthLabel(2026, 10)).toBe('lokakuu 2026');
  });
});

describe('entriesToCsv: kaavainjektio', () => {
  it('estää =, +, - ja @ -alkuiset solut muuttumasta Excel-kaavoiksi', () => {
    const row = { startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T08:00:00Z'), breakMinutes: 0, crewSize: 2, leadId: null, price: null };
    const csv = entriesToCsv(
      [
        { ...row, title: '=HYPERLINK("http://x")', notes: '+1 puhelu' },
        { ...row, title: '- siivous', notes: '@maili' },
        { ...row, title: 'Normaali työ', notes: 'ei erikoismerkkejä' },
      ],
      at('2026-10-22T12:00:00Z'),
    );
    expect(csv).toContain('"\'=HYPERLINK(""http://x"")"');
    expect(csv).toContain(";\'+1 puhelu");
    expect(csv).toContain(";\'- siivous;");
    expect(csv).toContain(";\'@maili");
    expect(csv).toContain(';Normaali työ;;;;ei erikoismerkkejä');
  });
});

describe('entriesToCsv usealla leimalla samaan keikkaan', () => {
  it('laskee €/h koko keikan henkilötunneista', () => {
    const csv = entriesToCsv(
      [{ startedAt: at('2026-10-22T06:00:00Z'), endedAt: at('2026-10-22T08:00:00Z'), breakMinutes: 0, crewSize: 2, title: 'Muutto', leadId: 'L1', price: 400, jobPersonHours: 10, notes: null }],
      at('2026-10-22T12:00:00Z'),
    );
    // Rivin omat henkilötunnit 4, mutta keikan yhteensä 10 -> 400 / 10 = 40
    expect(csv).toContain(';400,00;40,00;');
  });
});
