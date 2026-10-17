import { describe, expect, it } from 'vitest';
import { buildMorningBrief, type BriefInput } from './morning-brief';

const base: BriefInput = { todayKey: '2026-10-20', jobsToday: [], jobsTomorrow: 0, todos: [], todosTotal: 0, overdue: 0 };

describe('buildMorningBrief', () => {
  it('ei lähetä tyhjää viestiä', () => {
    expect(buildMorningBrief(base)).toBeNull();
  });
  it('otsikossa viikonpäivä ja päivämäärä', () => {
    const msg = buildMorningBrief({ ...base, jobsTomorrow: 1 })!;
    expect(msg.title).toBe('☀️ Huomenta! tiistai 20.10.');
    expect(msg.description).toContain('Tänään ei keikkoja.');
    expect(msg.description).toContain('Huomenna: 1 keikka.');
  });
  it('keikat kellonajan mukaan, ilman aikaa viimeisenä, ja tila näkyy', () => {
    const msg = buildMorningBrief({
      ...base,
      jobsToday: [
        { time: null, customer: 'Ei Aikaa', route: '', status: 'WON' },
        { time: '09:00', customer: 'Aamu Asiakas', route: 'A → B', status: 'PROPOSAL_SENT' },
      ],
    })!;
    expect(msg.description.indexOf('Aamu Asiakas')).toBeLessThan(msg.description.indexOf('Ei Aikaa'));
    expect(msg.description).toContain('09:00 Aamu Asiakas — A → B _(Tarjous lähetetty)_');
    expect(msg.description).toContain('Tämän päivän keikat (2)');
  });
  it('varoittaa ylikuormasta', () => {
    const job = { time: null, customer: 'X', route: '', status: 'WON' as const };
    expect(buildMorningBrief({ ...base, jobsToday: [job, job, job] })!.description).toContain('tarkista kuormitus');
    expect(buildMorningBrief({ ...base, jobsToday: [job, job] })!.description).not.toContain('tarkista kuormitus');
  });
  it('huomiot rajataan ja kiireelliset merkitään punaisella', () => {
    const todos = Array.from({ length: 7 }, (_, i) => ({ priority: i === 0 ? 1 : 2, title: `Huomio ${i}` }));
    const msg = buildMorningBrief({ ...base, todos, todosTotal: 7, overdue: 2, dashboardUrl: 'https://x.test' })!;
    expect(msg.description).toContain('🔴 Huomio 0');
    expect(msg.description).toContain('🟠 Huomio 1');
    expect(msg.description).not.toContain('Huomio 5');
    expect(msg.description).toContain('…ja 2 muuta');
    expect(msg.description).toContain('2 menneen päivän keikkaa');
    expect(msg.description).toContain('https://x.test');
  });
});
