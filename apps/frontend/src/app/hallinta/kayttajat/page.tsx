import { prisma } from '@/server/db';
import { requirePageAccess } from '@/server/access';
import { envOwnerEmails } from '@/server/actors';
import { USERS_PATH } from '@/lib/access';
import { TEAMS } from '@/lib/teams';
import UsersManager, { type UserDto } from './UsersManager';
import WorkersManager, { type WorkerDto } from '../partio/WorkersManager';

export const dynamic = 'force-dynamic';

// Käyttäjähallinta (vain omistajat): hallinnan käyttäjät, roolit, tiimit ja tiimien työntekijät.
export default async function KayttajatPage() {
  const actor = await requirePageAccess(USERS_PATH);

  let dbUnavailable = false;
  let users: UserDto[] = [];
  let workers: WorkerDto[] = [];
  try {
    const [userRows, workerRows] = await Promise.all([
      prisma.user.findMany({ orderBy: [{ active: 'desc' }, { role: 'asc' }, { name: 'asc' }] }),
      prisma.worker.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] }),
    ]);
    const envOwners = envOwnerEmails();
    users = userRows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      teamId: u.teamId ?? null,
      active: u.active,
      hasPassword: Boolean(u.passwordHash),
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      isSelf: u.email === actor.email,
      envOwner: envOwners.includes(u.email),
    }));
    workers = workerRows.map((w) => ({ id: w.id, teamId: w.teamId, name: w.name, active: w.active }));
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/kayttajat] tietokanta ei vastaa', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Käyttäjät</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hallinnan käyttäjät ja oikeudet. Uusi käyttäjä saa väliaikaisen salasanan, joka vaihdetaan ensimmäisellä kirjautumisella.
        </p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä.
        </div>
      )}

      <UsersManager users={users} teams={TEAMS.map((t) => ({ id: t.id, name: t.name }))} />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tiimien työntekijät</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Partionjohtaja valitsee työaikaleimaan, ketkä olivat mukana. Työntekijät eivät kirjaudu. Aluevastaava ylläpitää oman tiiminsä listaa partiosivulla.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {TEAMS.map((team) => (
            <WorkersManager key={team.id} teamId={team.id} teamName={team.name} workers={workers.filter((w) => w.teamId === team.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
