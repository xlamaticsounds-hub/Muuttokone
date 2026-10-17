import { describe, expect, it } from 'vitest';
import { overloadedDays } from './calendar-load';

const job = (date: string, status: Parameters<typeof overloadedDays>[0][number]['status'] = 'WON') => ({ date, status });

describe('overloadedDays', () => {
  it('varoittaa vasta kun raja ylittyy', () => {
    expect([...overloadedDays([job('2026-10-20'), job('2026-10-20')])]).toEqual([]);
    expect([...overloadedDays([job('2026-10-20'), job('2026-10-20'), job('2026-10-20', 'PROPOSAL_SENT')])]).toEqual([['2026-10-20', 3]]);
  });
  it('tehdyt keikat eivät kuormita päivää', () => {
    const jobs = [job('2026-10-20'), job('2026-10-20'), job('2026-10-20', 'COMPLETED'), job('2026-10-20', 'PAID')];
    expect(overloadedDays(jobs).size).toBe(0);
  });
  it('päivät lasketaan erikseen ja raja on parametri', () => {
    const jobs = [job('2026-10-20'), job('2026-10-21'), job('2026-10-21')];
    expect([...overloadedDays(jobs, 1)]).toEqual([['2026-10-21', 2]]);
  });
});
