// Muistiinpanonäkymien palvelimella muodostettava tietorakenne (päivämäärät ISO-merkkijonoina).
// Client-komponentit tuovat täältä vain tyyppejä.

import { leadJobLabel } from '../tyoajat/dto';

export type NoteDto = {
  id: string;
  title: string | null;
  body: string;
  category: string;
  pinned: boolean;
  archived: boolean;
  leadId: string | null;
  leadLabel: string | null; // "22.10. Matti Meikäläinen", jos muistiinpano on liitetty keikkaan
  createdAt: string;
  updatedAt: string;
};

export function toNoteDto(
  note: {
    id: string;
    title: string | null;
    body: string;
    category: string;
    pinned: boolean;
    archived: boolean;
    leadId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  lead?: Parameters<typeof leadJobLabel>[0] | null,
): NoteDto {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    category: note.category,
    pinned: Boolean(note.pinned),
    archived: Boolean(note.archived),
    leadId: note.leadId,
    leadLabel: lead ? leadJobLabel(lead) : note.leadId ? 'Poistettu keikka' : null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
