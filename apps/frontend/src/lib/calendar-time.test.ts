import { describe, expect, it } from 'vitest';
import { calendarEventStart, formatCalendarStart, formatClockTime, parsePreferredTime } from './calendar-time';

const at = (hour: number, minute = 0) => ({ hour, minute });

describe('parsePreferredTime', () => {
  it.each([
    ['09:00', at(9)],
    ['9.30', at(9, 30)],
    ['klo 10', at(10)],
    ['Klo 10.30', at(10, 30)],
    ['kello 7:45', at(7, 45)],
    ['13', at(13)],
    ['klo 8–12', at(8)],
    ['8-12', at(8)],
    ['08:00-10:00', at(8)],
    ['n. klo 14', at(14)],
    ['ti 4.11. klo 10', at(10)],
  ])('%j → kellonaika', (text, expected) => {
    expect(parsePreferredTime(text)).toEqual(expected);
  });

  it.each([
    ['aamupäivä', at(8)],
    ['Iltapäivällä', at(12)],
    ['aamulla', at(8)],
    ['illalla', at(17)],
    ['keskipäivällä', at(12)],
  ])('sanallinen aika %j → aikaikkunan alku', (text, expected) => {
    expect(parsePreferredTime(text)).toEqual(expected);
  });

  it.each([null, undefined, '', 'sovitaan myöhemmin', '4.11.', 'kesto 3 h', '2 henkilöä', '450 €', 'klo 25', '24:00'])('%j → ei tunnistettua aikaa', (text) => {
    expect(parsePreferredTime(text)).toBeNull();
  });
});

describe('calendarEventStart', () => {
  const day = new Date('2026-11-04T00:00:00Z'); // talviaika, UTC+2
  const summerDay = new Date('2026-06-10T00:00:00Z'); // kesäaika, UTC+3

  it('yhdistää päivän ja suomalaisen kellonajan Suomen aikaan', () => {
    expect(calendarEventStart(day, 'klo 10').toISOString()).toBe('2026-11-04T08:00:00.000Z');
    expect(calendarEventStart(day, '10.30').toISOString()).toBe('2026-11-04T08:30:00.000Z');
    expect(calendarEventStart(summerDay, '13').toISOString()).toBe('2026-06-10T10:00:00.000Z');
  });

  it('käyttää klo 9.00, kun aikaa ei ole tai sitä ei tunnisteta', () => {
    expect(calendarEventStart(day, null).toISOString()).toBe('2026-11-04T07:00:00.000Z');
    expect(calendarEventStart(day, 'sovitaan').toISOString()).toBe('2026-11-04T07:00:00.000Z');
  });

  it('jättää valmiin kellonajan ennalleen', () => {
    const exact = new Date('2026-11-04T11:15:00Z');
    expect(calendarEventStart(exact, 'klo 8')).toEqual(exact);
  });
});

describe('muotoilu', () => {
  it('näyttää ajan suomalaisittain', () => {
    expect(formatClockTime(at(9))).toBe('9.00');
    expect(formatCalendarStart(new Date('2026-11-04T08:00:00Z'))).toBe('ke 4.11. klo 10.00');
  });
});
