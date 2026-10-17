import { describe, expect, it } from 'vitest';
import { buildDraftPrompt, mailtoHref, normalizeDraftBody } from './reply-draft';

const base = {
  customerName: 'Matti Meikäläinen',
  statusLabel: 'Tarjous lähetetty',
  moveDate: '18.10.2026',
  route: 'A → B',
  priceLabel: '650 € sis. alv',
  threadSummary: null,
  customerMessage: null,
  daysSinceQuote: null,
};

describe('buildDraftPrompt', () => {
  it('vastaus sisältää asiakkaan viestin', () => {
    const p = buildDraftPrompt({ ...base, kind: 'needs_reply', customerMessage: 'Mahtuuko sohva?' });
    expect(p).toContain('Mahtuuko sohva?');
    expect(p).toContain('Muuttopäivä: 18.10.2026');
    expect(p).toContain('650 € sis. alv');
  });
  it('kertoo mallille jos viestiä ei saatu haettua', () => {
    expect(buildDraftPrompt({ ...base, kind: 'needs_reply' })).toContain('viestin sisältöä ei saatu haettua');
  });
  it('muistutus mainitsee päivät ja jättää tyhjät tiedot pois', () => {
    const p = buildDraftPrompt({ ...base, kind: 'follow_up', daysSinceQuote: 6, route: null, moveDate: null });
    expect(p).toContain('6 päivää sitten');
    expect(p).not.toContain('Reitti:');
    expect(p).not.toContain('Muuttopäivä:');
  });
});

describe('normalizeDraftBody', () => {
  it('lisää allekirjoituksen jos se puuttuu ja poistaa lainausmerkit', () => {
    expect(normalizeDraftBody('"Hei Matti,\n\nKiitos."')).toBe('Hei Matti,\n\nKiitos.\n\nYstävällisin terveisin,\nMuuttokone.fi');
  });
  it('säilyttää valmiin allekirjoituksen', () => {
    const text = 'Hei,\n\nOk.\n\nYstävällisin terveisin,\nMuuttokone.fi';
    expect(normalizeDraftBody(text)).toBe(text);
  });
});

describe('mailtoHref', () => {
  it('koodaa aiheen ja rivinvaihdot', () => {
    const href = mailtoHref('a@b.fi', 'Re: Tarjous', 'Hei\n\nMoi');
    expect(href).toBe('mailto:a%40b.fi?subject=Re%3A%20Tarjous&body=Hei%0A%0AMoi');
  });
});
