import { describe, expect, it } from 'vitest';
import { isTodoStillRelevant, leadTimeTodos } from './ai-todo-rules';

const now = new Date('2026-10-20T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const lead = (status: Parameters<typeof leadTimeTodos>[0]['status'], updated: number, completed: number | null = null) => ({
  id: 'l1',
  status,
  updatedAt: daysAgo(updated),
  completedAt: completed == null ? null : daysAgo(completed),
});

const baseline = new Date('2026-10-01T00:00:00Z');

describe('leadTimeTodos', () => {
  it('seuraa tarjousta vasta kun on kulunut tarpeeksi aikaa, eikä jahtaa vanhoja', () => {
    expect(leadTimeTodos(lead('PROPOSAL_SENT', 2), 'Matti', now)).toEqual([]);
    const todos = leadTimeTodos(lead('PROPOSAL_SENT', 5), 'Matti', now);
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ type: 'follow_up', dedupeKey: 'follow_up:l1' });
    expect(leadTimeTodos(lead('PROPOSAL_SENT', 45), 'Matti', now)).toEqual([]);
  });
  it('tehty mutta laskuttamaton käyttää completedAt-päivää', () => {
    expect(leadTimeTodos(lead('COMPLETED', 0, 1), 'Matti', now, baseline)).toEqual([]);
    expect(leadTimeTodos(lead('COMPLETED', 0, 4), 'Matti', now, baseline)[0]).toMatchObject({ type: 'not_invoiced' });
  });
  it('maksamaton nousee kiireelliseksi ja korvaa laskutusmuistutuksen', () => {
    const todos = leadTimeTodos(lead('INVOICED', 0, 15), 'Matti', now, baseline);
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ type: 'unpaid', priority: 1 });
    expect(leadTimeTodos(lead('COMPLETED', 0, 15), 'Matti', now, baseline)[0]).toMatchObject({ type: 'unpaid' });
    expect(leadTimeTodos(lead('INVOICED', 0, 13), 'Matti', now, baseline)).toEqual([]);
  });
  it('ennen baselinea tehdyistä keikoista ei tule laskutus- tai maksuhuomioita', () => {
    // tehty 40 päivää ennen "nyt"-hetkeä = 10.9., baseline 1.10. -> vanha, oletettavasti jo maksettu
    expect(leadTimeTodos(lead('COMPLETED', 0, 40), 'Matti', now, baseline)).toEqual([]);
    expect(leadTimeTodos(lead('INVOICED', 40), 'Matti', now, baseline)).toEqual([]);
  });
  it('ilman baselinea laskutus- ja maksusääntöjä ei ajeta', () => {
    expect(leadTimeTodos(lead('COMPLETED', 0, 20), 'Matti', now, null)).toEqual([]);
  });
  it('maksetusta ja hävitystä ei tule huomioita', () => {
    expect(leadTimeTodos(lead('PAID', 99), 'Matti', now, baseline)).toEqual([]);
    expect(leadTimeTodos(lead('LOST', 99), 'Matti', now, baseline)).toEqual([]);
  });
});

describe('isTodoStillRelevant', () => {
  it('ehdotus vanhenee kun tila on jo saavutettu tai ohitettu', () => {
    const todo = { type: 'status_suggestion', suggestedStatus: 'WON' as const };
    expect(isTodoStillRelevant(todo, 'PROPOSAL_SENT')).toBe(true);
    expect(isTodoStillRelevant(todo, 'WON')).toBe(false);
    expect(isTodoStillRelevant(todo, 'COMPLETED')).toBe(false);
  });
  it('aikapohjaiset huomiot sulkeutuvat kun tila vaihtuu', () => {
    expect(isTodoStillRelevant({ type: 'follow_up', suggestedStatus: null }, 'WON')).toBe(false);
    expect(isTodoStillRelevant({ type: 'unpaid', suggestedStatus: null }, 'PAID')).toBe(false);
    expect(isTodoStillRelevant({ type: 'unpaid', suggestedStatus: null }, 'COMPLETED')).toBe(true);
    expect(isTodoStillRelevant({ type: 'needs_reply', suggestedStatus: null }, 'WON')).toBe(true);
  });
});
