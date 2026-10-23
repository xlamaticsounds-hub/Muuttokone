'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { normalizeNoteInput } from '@/lib/notes';

// Muistiinpanot: vapaa paikka kirjata asioita ylös. Kaikki toiminnot palauttavat tuloksen (ei heitä).

export type NoteActionResult = { success: true } | { success: false; message: string };

const noSession: NoteActionResult = { success: false, message: 'Kirjaudu sisään.' };

function refresh(leadId?: string | null) {
  revalidatePath('/hallinta/muistiinpanot');
  if (leadId) revalidatePath(`/hallinta/liidit/${leadId}`);
}

export type SaveNoteInput = { id?: string; title?: string | null; body: string; category?: string; leadId?: string | null };

/** Luo uuden muistiinpanon tai muokkaa olemassa olevaa (liidi-liitos säilyy muokatessa ellei sitä anneta). */
export async function saveNote(input: SaveNoteInput): Promise<NoteActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;

  const parsed = normalizeNoteInput(input);
  if (!parsed.ok) return { success: false, message: parsed.message };
  const { title, body, category, leadId } = parsed.value;

  try {
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
      if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
    }

    if (input.id) {
      const existing = await prisma.note.findUnique({ where: { id: input.id } });
      if (!existing) return { success: false, message: 'Muistiinpanoa ei löytynyt.' };
      await prisma.note.update({
        where: { id: input.id },
        data: { title, body, category, ...(input.leadId !== undefined ? { leadId } : {}) },
      });
      refresh(existing.leadId);
      if (leadId && leadId !== existing.leadId) refresh(leadId);
      return { success: true };
    }

    const note = await prisma.note.create({
      data: { title, body, category, leadId, pinned: false, archived: false, createdBy: session.user?.email ?? null },
    });
    await createLog({ entityType: 'Note', entityId: note.id, action: 'note.create', message: 'Muistiinpano lisätty', data: { leadId, category } }).catch(() => {});
    refresh(leadId);
    return { success: true };
  } catch (error) {
    console.error('[note-actions] saveNote epäonnistui', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

async function updateFlag(id: string, data: { pinned: boolean } | { archived: boolean }): Promise<NoteActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  try {
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Muistiinpanoa ei löytynyt.' };
    await prisma.note.update({ where: { id }, data });
    refresh(existing.leadId);
    return { success: true };
  } catch (error) {
    console.error('[note-actions] päivitys epäonnistui', error);
    return { success: false, message: 'Päivitys epäonnistui. Yritä uudelleen.' };
  }
}

export async function setNotePinned(id: string, pinned: boolean): Promise<NoteActionResult> {
  return updateFlag(id, { pinned });
}

export async function setNoteArchived(id: string, archived: boolean): Promise<NoteActionResult> {
  return updateFlag(id, { archived });
}

export async function deleteNote(id: string): Promise<NoteActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return noSession;
  try {
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) return { success: true }; // jo poistettu
    await prisma.note.delete({ where: { id } });
    await createLog({ entityType: 'Note', entityId: id, action: 'note.delete', message: 'Muistiinpano poistettu', data: { leadId: existing.leadId } }).catch(() => {});
    refresh(existing.leadId);
    return { success: true };
  } catch (error) {
    console.error('[note-actions] deleteNote epäonnistui', error);
    return { success: false, message: 'Poisto epäonnistui. Yritä uudelleen.' };
  }
}
