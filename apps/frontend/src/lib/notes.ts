// Muistiinpanojen puhtaat säännöt (luokat, syötteen tarkistus, suodatus ja järjestys).
// Käyttäjät: server/note-actions.ts, hallinta/muistiinpanot ja liidin sivun muistiinpanokortti.

export const NOTE_CATEGORIES = [
  { id: 'yleinen', label: 'Yleinen' },
  { id: 'tehtava', label: 'Tehtävä' },
  { id: 'asiakas', label: 'Asiakas' },
  { id: 'kalusto', label: 'Kalusto' },
  { id: 'talous', label: 'Talous' },
  { id: 'idea', label: 'Idea' },
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number]['id'];

export const DEFAULT_NOTE_CATEGORY: NoteCategory = 'yleinen';
export const MAX_NOTE_TITLE = 120;
export const MAX_NOTE_BODY = 10_000;

export function isNoteCategory(value: unknown): value is NoteCategory {
  return NOTE_CATEGORIES.some((c) => c.id === value);
}

export function categoryLabel(id: string): string {
  return NOTE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export type NoteInput = { title: string | null; body: string; category: NoteCategory; leadId: string | null };

/** Tarkistaa ja siistii muistiinpanon kentät. Otsikko on valinnainen, teksti pakollinen. */
export function normalizeNoteInput(input: {
  title?: unknown;
  body?: unknown;
  category?: unknown;
  leadId?: unknown;
}): { ok: true; value: NoteInput } | { ok: false; message: string } {
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!body) return { ok: false, message: 'Kirjoita muistiinpanon teksti.' };
  if (body.length > MAX_NOTE_BODY) return { ok: false, message: `Muistiinpano on liian pitkä (enintään ${MAX_NOTE_BODY} merkkiä).` };

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length > MAX_NOTE_TITLE) return { ok: false, message: `Otsikko on liian pitkä (enintään ${MAX_NOTE_TITLE} merkkiä).` };

  const category = isNoteCategory(input.category) ? input.category : DEFAULT_NOTE_CATEGORY;
  const leadId = typeof input.leadId === 'string' && input.leadId.trim() ? input.leadId.trim() : null;
  return { ok: true, value: { title: title || null, body, category, leadId } };
}

export type NoteLike = {
  title: string | null;
  body: string;
  category: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: Date;
};

/** Hakusana (otsikko + teksti), luokka ja arkistoidut. Tyhjä haku ja luokka "all" eivät rajaa. */
export function filterNotes<T extends NoteLike>(
  notes: T[],
  options: { query?: string; category?: string; showArchived?: boolean },
): T[] {
  const query = (options.query ?? '').trim().toLocaleLowerCase('fi');
  return notes.filter((note) => {
    if (!options.showArchived && note.archived) return false;
    if (options.category && options.category !== 'all' && note.category !== options.category) return false;
    if (!query) return true;
    return `${note.title ?? ''}\n${note.body}`.toLocaleLowerCase('fi').includes(query);
  });
}

/** Kiinnitetyt ensin, sitten uusimmin muokattu ensin. */
export function sortNotes<T extends NoteLike>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
