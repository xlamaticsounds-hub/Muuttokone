'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Pencil, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { deleteNote, saveNote, setNoteArchived, setNotePinned, type NoteActionResult } from '@/server/note-actions';
import { DEFAULT_NOTE_CATEGORY, MAX_NOTE_BODY, MAX_NOTE_TITLE, NOTE_CATEGORIES, categoryLabel, filterNotes, sortNotes } from '@/lib/notes';
import { formatClock, formatEntryDate } from '@/lib/work-time';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton, textareaClass } from '../form-styles';
import type { NoteDto } from './dto';

const CATEGORY_STYLES: Record<string, string> = {
  yleinen: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  tehtava: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  asiakas: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  kalusto: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  talous: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  idea: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
};

const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100';

// Lomake uuden muistiinpanon kirjaamiseen ja olemassa olevan muokkaukseen.
function NoteForm({
  initial,
  leadId,
  autoFocus,
  onCancel,
  onSaved,
}: {
  initial?: NoteDto;
  leadId?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [category, setCategory] = useState(initial?.category ?? DEFAULT_NOTE_CATEGORY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idPrefix = initial ? `note-${initial.id}` : `note-new-${leadId ?? 'all'}`;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Muokatessa liidi-liitos jätetään koskematta (leadId undefined)
      const result = await saveNote({ id: initial?.id, title, body, category, leadId: initial ? undefined : leadId });
      if (result.success) {
        if (!initial) {
          setTitle('');
          setBody('');
          setCategory(DEFAULT_NOTE_CATEGORY);
        }
        onSaved();
      } else {
        setError(result.message);
      }
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <div>
          <label htmlFor={`${idPrefix}-title`} className={labelClass}>Otsikko (valinnainen)</label>
          <input id={`${idPrefix}-title`} value={title} readOnly={busy} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_NOTE_TITLE} placeholder="esim. Rappu B:n avainkoodi" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-category`} className={labelClass}>Luokka</label>
          <select id={`${idPrefix}-category`} value={category} disabled={busy} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {NOTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-body`} className={labelClass}>Muistiinpano</label>
        <textarea
          id={`${idPrefix}-body`}
          rows={initial ? 5 : 3}
          value={body}
          readOnly={busy}
          autoFocus={autoFocus}
          maxLength={MAX_NOTE_BODY}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
          }}
          placeholder="Kirjaa asia ylös…"
          className={textareaClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className={secondaryButton}>
            Peruuta
          </button>
        )}
        <button type="submit" disabled={busy || body.trim().length === 0} className={primaryButton}>
          {busy ? 'Tallennetaan…' : 'Tallenna'}
        </button>
      </div>
    </form>
  );
}

// Muistiinpanotaulu: kirjaus, haku, luokkasuodatus, kiinnitys, arkistointi ja poisto.
// leadId + compact: liidin sivulla näytetään vain sen keikan muistiinpanot ja lisäys liitetään keikkaan.
export default function NotesBoard({ notes, leadId, compact = false }: { notes: NoteDto[]; leadId?: string; compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [composing, setComposing] = useState(!compact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const views = useMemo(() => notes.map((n) => ({ ...n, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt) })), [notes]);
  const visible = useMemo(() => sortNotes(filterNotes(views, { query, category, showArchived })), [views, query, category, showArchived]);
  const archivedCount = views.filter((n) => n.archived).length;
  const countFor = (id: string) => views.filter((n) => !n.archived && (id === 'all' || n.category === id)).length;

  const refresh = () => router.refresh();
  // Liidin sivulla muistiinpanot ovat jo kortin sisällä, joten rivit saavat kevyemmän taustan
  const surface = compact ? 'rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40' : cardClass;

  const perform = async (id: string, action: () => Promise<NoteActionResult>) => {
    setBusyId(id);
    setError(null);
    try {
      const result = await action();
      if (result.success) refresh();
      else setError(result.message);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = (note: NoteDto) => {
    if (!window.confirm(`Poistetaanko muistiinpano${note.title ? ` "${note.title}"` : ''} pysyvästi?`)) return;
    void perform(note.id, () => deleteNote(note.id));
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium ${
      active
        ? 'border-blue-600 bg-blue-600 text-white'
        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="space-y-4">
      {composing ? (
        <div className={surface}>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Uusi muistiinpano</h2>
          <NoteForm
            leadId={leadId}
            autoFocus={compact}
            onCancel={compact ? () => setComposing(false) : undefined}
            onSaved={() => {
              if (compact) setComposing(false);
              refresh();
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setComposing(true)} className={`${secondaryButton} flex items-center gap-1.5`}>
          <Plus className="h-4 w-4" />
          Lisää muistiinpano
        </button>
      )}

      {!compact && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae muistiinpanoista…"
              aria-label="Hae muistiinpanoista"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategory('all')} className={chip(category === 'all')}>
              Kaikki ({countFor('all')})
            </button>
            {NOTE_CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={chip(category === c.id)}>
                {c.label} ({countFor(c.id)})
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
          {views.length === 0 ? 'Ei vielä muistiinpanoja.' : 'Ei muistiinpanoja valituilla rajauksilla.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((note) => {
            const dto = notes.find((n) => n.id === note.id)!;
            if (editingId === note.id) {
              return (
                <li key={note.id} className={surface}>
                  <NoteForm
                    initial={dto}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      refresh();
                    }}
                  />
                </li>
              );
            }
            const busy = busyId === note.id;
            return (
              <li key={note.id} className={`${surface} ${note.pinned ? 'ring-2 ring-amber-300 dark:ring-amber-500/50' : ''}`}>
                <div className={note.archived ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {note.title && <h3 className="break-words text-base font-semibold text-gray-900 dark:text-white">{note.pinned && '📌 '}{note.title}</h3>}
                      {!note.title && note.pinned && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">📌 Kiinnitetty</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLES[note.category] ?? CATEGORY_STYLES.yleinen}`}>
                      {categoryLabel(note.category)}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 ${note.title ? 'mt-1' : 'mt-0'}`}>{note.body}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatEntryDate(note.updatedAt)} {formatClock(note.updatedAt)}
                    {note.archived && ' · arkistoitu'}
                    {note.leadId && !leadId && (
                      <>
                        {' · '}
                        <Link href={`/hallinta/liidit/${note.leadId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                          {note.leadLabel}
                        </Link>
                      </>
                    )}
                  </p>
                  <div className="flex items-center">
                    <button type="button" disabled={busy} onClick={() => perform(note.id, () => setNotePinned(note.id, !note.pinned))} aria-label={note.pinned ? 'Poista kiinnitys' : 'Kiinnitä ylös'} title={note.pinned ? 'Poista kiinnitys' : 'Kiinnitä ylös'} className={iconButton}>
                      {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setEditingId(note.id)} aria-label="Muokkaa" title="Muokkaa" className={iconButton}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={busy} onClick={() => perform(note.id, () => setNoteArchived(note.id, !note.archived))} aria-label={note.archived ? 'Palauta arkistosta' : 'Arkistoi'} title={note.archived ? 'Palauta arkistosta' : 'Arkistoi'} className={iconButton}>
                      {note.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </button>
                    <button type="button" disabled={busy} onClick={() => remove(dto)} aria-label="Poista" title="Poista" className={`${iconButton} hover:!text-red-600`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived((v) => !v)} className="text-sm font-medium text-gray-600 underline-offset-2 hover:underline dark:text-gray-300">
          {showArchived ? 'Piilota arkistoidut' : `Näytä arkistoidut (${archivedCount})`}
        </button>
      )}
    </div>
  );
}
