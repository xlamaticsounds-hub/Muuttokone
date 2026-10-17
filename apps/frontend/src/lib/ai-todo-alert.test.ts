import { describe, expect, it } from 'vitest';
import { formatUrgentAlert } from './ai-todo-alert';

describe('formatUrgentAlert', () => {
  it('ei lähetä mitään kun ei ole huomioita', () => {
    expect(formatUrgentAlert([])).toBeNull();
  });
  it('yksikkö- ja monikkomuoto', () => {
    expect(formatUrgentAlert([{ title: 'A', reason: 'x' }])!.title).toBe('🔔 Uusi kiireellinen huomio');
    expect(formatUrgentAlert([{ title: 'A', reason: 'x' }, { title: 'B', reason: 'y' }])!.title).toBe('🔔 2 uutta kiireellistä huomiota');
  });
  it('rajaa rivit ja kertoo loppujen määrän, linkki mukaan', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ title: `Huomio ${i}`, reason: 'syy' }));
    const msg = formatUrgentAlert(many, 'https://example.test/hallinta/dashboard')!;
    expect(msg.description).toContain('Huomio 7');
    expect(msg.description).not.toContain('Huomio 8');
    expect(msg.description).toContain('…ja 4 muuta');
    expect(msg.description).toContain('https://example.test/hallinta/dashboard');
  });
  it('lyhentää pitkät tekstit', () => {
    const msg = formatUrgentAlert([{ title: 'x'.repeat(300), reason: 'y'.repeat(300) }])!;
    expect(msg.description.length).toBeLessThan(400);
  });
});
