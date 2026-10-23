import { describe, expect, it } from 'vitest';
import { categoryLabel, filterNotes, isNoteCategory, normalizeNoteInput, sortNotes, MAX_NOTE_BODY, MAX_NOTE_TITLE } from './notes';

const note = (over: Partial<Parameters<typeof filterNotes>[0][number]> & { id?: string } = {}) => ({
  id: 'n',
  title: null as string | null,
  body: 'teksti',
  category: 'yleinen',
  pinned: false,
  archived: false,
  updatedAt: new Date('2026-10-20T10:00:00Z'),
  ...over,
});

describe('normalizeNoteInput', () => {
  it('siistii kentät ja täyttää oletukset', () => {
    expect(normalizeNoteInput({ title: '  Avainkoodi  ', body: '  Rappu B: 1234  ', category: 'asiakas', leadId: ' L1 ' })).toEqual({
      ok: true,
      value: { title: 'Avainkoodi', body: 'Rappu B: 1234', category: 'asiakas', leadId: 'L1' },
    });
    expect(normalizeNoteInput({ body: 'vain teksti' })).toEqual({
      ok: true,
      value: { title: null, body: 'vain teksti', category: 'yleinen', leadId: null },
    });
    // Tuntematon luokka -> oletus
    expect(normalizeNoteInput({ body: 'x', category: 'outo' })).toMatchObject({ ok: true, value: { category: 'yleinen' } });
  });

  it('vaatii tekstin ja rajaa pituuden', () => {
    expect(normalizeNoteInput({ title: 'Otsikko', body: '   ' })).toMatchObject({ ok: false });
    expect(normalizeNoteInput({})).toMatchObject({ ok: false });
    expect(normalizeNoteInput({ body: 'x'.repeat(MAX_NOTE_BODY + 1) })).toMatchObject({ ok: false });
    expect(normalizeNoteInput({ body: 'x'.repeat(MAX_NOTE_BODY) })).toMatchObject({ ok: true });
    expect(normalizeNoteInput({ title: 'x'.repeat(MAX_NOTE_TITLE + 1), body: 'y' })).toMatchObject({ ok: false });
  });
});

describe('luokat', () => {
  it('tunnistaa luokat ja nimeää ne', () => {
    expect(isNoteCategory('tehtava')).toBe(true);
    expect(isNoteCategory('muu')).toBe(false);
    expect(categoryLabel('tehtava')).toBe('Tehtävä');
    expect(categoryLabel('tuntematon')).toBe('tuntematon');
  });
});

describe('filterNotes ja sortNotes', () => {
  const notes = [
    note({ id: 'a', title: 'Avainkoodi', body: 'Rappu B: 1234', category: 'asiakas' }),
    note({ id: 'b', body: 'Osta pakkausteippiä', category: 'tehtava' }),
    note({ id: 'c', body: 'Vanha asia', archived: true }),
  ];

  it('suodattaa haulla (otsikko ja teksti, kirjainkoosta riippumatta)', () => {
    expect(filterNotes(notes, { query: 'AVAIN' }).map((n) => n.id)).toEqual(['a']);
    expect(filterNotes(notes, { query: 'teippi' }).map((n) => n.id)).toEqual(['b']);
    expect(filterNotes(notes, { query: '' }).map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('rajaa luokalla ja piilottaa arkistoidut oletuksena', () => {
    expect(filterNotes(notes, { category: 'tehtava' }).map((n) => n.id)).toEqual(['b']);
    expect(filterNotes(notes, { category: 'all' }).map((n) => n.id)).toEqual(['a', 'b']);
    expect(filterNotes(notes, { showArchived: true }).map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('järjestää kiinnitetyt ensin ja uusimmin muokatut ennen vanhempia', () => {
    const sorted = sortNotes([
      note({ id: 'old', updatedAt: new Date('2026-10-01T10:00:00Z') }),
      note({ id: 'new', updatedAt: new Date('2026-10-21T10:00:00Z') }),
      note({ id: 'pin', pinned: true, updatedAt: new Date('2026-09-01T10:00:00Z') }),
    ]);
    expect(sorted.map((n) => n.id)).toEqual(['pin', 'new', 'old']);
  });
});
