import { prisma } from '@/server/db';
import NotesBoard from './NotesBoard';
import { toNoteDto, type NoteDto } from './dto';

export const dynamic = 'force-dynamic';

export default async function MuistiinpanotPage() {
  let dbUnavailable = false;
  let notes: NoteDto[] = [];

  try {
    const rows = await prisma.note.findMany({ orderBy: { updatedAt: 'desc' }, take: 500 });
    const leadIds = [...new Set(rows.map((n) => n.leadId).filter((id): id is string => Boolean(id)))];
    const leads = leadIds.length > 0 ? await prisma.lead.findMany({ where: { id: { in: leadIds } }, include: { contact: true } }) : [];
    const leadById = new Map(leads.map((l) => [l.id, l]));
    notes = rows.map((n) => toNoteDto(n, n.leadId ? leadById.get(n.leadId) : null));
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/muistiinpanot] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Muistiinpanot</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Kirjaa asiat ylös: koodit, tehtävät, ideat ja muistettavat. Keikkakohtaiset muistiinpanot löytyvät myös liidin sivulta.</p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Muistiinpanoja ei voi tallentaa ennen kuin yhteys palaa.
        </div>
      )}

      <div className="max-w-3xl">
        <NotesBoard notes={notes} />
      </div>
    </div>
  );
}
