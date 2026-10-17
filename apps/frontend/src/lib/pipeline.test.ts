import { describe, expect, it } from 'vitest';
import { formatDaysAgo, formatEuros, nextStage, sortStageCards, stageAgeWarning, stageFor, sumValues, summarizeMail, todoBadge } from './pipeline';

const now = new Date('2026-10-20T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe('stageFor / nextStage', () => {
  it('vanhat tilat sijoittuvat sarakkeisiin eivätkä häviä, arkistoidut piiloon', () => {
    expect(stageFor('QUALIFIED')).toBe('NEW');
    expect(stageFor('CONTACTED')).toBe('PROPOSAL_SENT');
    expect(stageFor('ARCHIVED')).toBeNull();
    expect(stageFor('WON')).toBe('WON');
  });
  it('seuraava vaihe etenee putkessa ja loppuu suljettuihin', () => {
    expect(nextStage('NEW')).toBe('PROPOSAL_SENT');
    expect(nextStage('SCHEDULED')).toBe('WON');
    expect(nextStage('PROPOSAL_SENT')).toBe('WON');
    expect(nextStage('WON')).toBe('COMPLETED');
    expect(nextStage('COMPLETED')).toBe('INVOICED');
    expect(nextStage('INVOICED')).toBe('PAID');
    for (const closed of ['PAID', 'LOST', 'CANCELLED', 'ARCHIVED'] as const) expect(nextStage(closed)).toBeNull();
  });
});

describe('stageAgeWarning', () => {
  it('käyttää Huomio-listan rajoja', () => {
    expect(stageAgeWarning('NEW', 0)).toBe(false);
    expect(stageAgeWarning('NEW', 1)).toBe(true);
    expect(stageAgeWarning('PROPOSAL_SENT', 3)).toBe(false);
    expect(stageAgeWarning('PROPOSAL_SENT', 4)).toBe(true);
    expect(stageAgeWarning('COMPLETED', 3)).toBe(true);
    expect(stageAgeWarning('INVOICED', 13)).toBe(false);
    expect(stageAgeWarning('INVOICED', 14)).toBe(true);
  });
  it('voitettu ja suljetut eivät vanhene', () => {
    expect(stageAgeWarning('WON', 99)).toBe(false);
    expect(stageAgeWarning('PAID', 99)).toBe(false);
    expect(stageAgeWarning('LOST', 99)).toBe(false);
  });
});

describe('sortStageCards', () => {
  const card = (id: string, createdTs: number, updatedTs: number, moveTs: number | null = null) => ({ id, createdTs, updatedTs, moveTs });
  const ids = (cards: { id: string }[]) => cards.map((c) => c.id);

  it('uudet: tuorein ensin', () => {
    expect(ids(sortStageCards('NEW', [card('a', 1, 0), card('b', 3, 0), card('c', 2, 0)]))).toEqual(['b', 'c', 'a']);
  });
  it('tarjous: pisimpään odottanut ensin', () => {
    expect(ids(sortStageCards('PROPOSAL_SENT', [card('a', 0, 30), card('b', 0, 10), card('c', 0, 20)]))).toEqual(['b', 'c', 'a']);
  });
  it('voitettu: lähin muuttopäivä ensin, päivättömät viimeisinä', () => {
    expect(ids(sortStageCards('WON', [card('a', 0, 0, null), card('b', 0, 0, 200), card('c', 0, 0, 100)]))).toEqual(['c', 'b', 'a']);
  });
  it('suljetut: tuorein ensin eikä alkuperäistä listaa muuteta', () => {
    const input = [card('a', 0, 1), card('b', 0, 9)];
    expect(ids(sortStageCards('PAID', input))).toEqual(['b', 'a']);
    expect(ids(input)).toEqual(['a', 'b']);
  });
});

describe('summarizeMail', () => {
  const inbound = (n: number, intent: string, summary = 'Kysyy sohvasta') => ({ kind: 'customer_inbound', receivedAt: daysAgo(n), analysis: { intent, summary } });
  const outbound = (n: number) => ({ kind: 'customer_outbound', receivedAt: daysAgo(n), analysis: null });

  it('ei viestejä -> null', () => {
    expect(summarizeMail([], now)).toBeNull();
    expect(summarizeMail([{ kind: 'ukko_payment', receivedAt: daysAgo(1), analysis: null }], now)).toBeNull();
  });
  it('vastaamaton asiallinen asiakasviesti', () => {
    expect(summarizeMail([inbound(2, 'question')], now)).toEqual({ direction: 'in', daysAgo: 2, summary: 'Kysyy sohvasta', unanswered: true });
  });
  it('kun me olemme vastanneet myöhemmin, viesti ei ole vastaamaton', () => {
    const result = summarizeMail([inbound(3, 'question'), outbound(1)], now)!;
    expect(result.direction).toBe('out');
    expect(result.unanswered).toBe(false);
  });
  it('pelkkä kiitos (intent other) ei jää odottamaan vastausta', () => {
    expect(summarizeMail([inbound(1, 'other', 'Kiittää')], now)!.unanswered).toBe(false);
  });
  it('viestin ikä pyöristyy alas ja ei mene negatiiviseksi', () => {
    expect(summarizeMail([outbound(0)], now)!.daysAgo).toBe(0);
  });
});

describe('muotoilut', () => {
  it('päivien teksti', () => {
    expect(formatDaysAgo(0)).toBe('tänään');
    expect(formatDaysAgo(1)).toBe('eilen');
    expect(formatDaysAgo(5)).toBe('5 pv sitten');
  });
  it('eurot ja summat', () => {
    expect(formatEuros(1950).replace(/\s/g, ' ')).toBe('1 950 €');
    expect(formatEuros(649.6).replace(/\s/g, ' ')).toBe('650 €');
    expect(sumValues([100, null, 250.5])).toEqual({ sum: 350.5, missing: 1 });
  });
  it('huomiomerkit', () => {
    expect(todoBadge('needs_reply')).toContain('Vastaa');
    expect(todoBadge('status_suggestion')).toBeNull();
  });
});
