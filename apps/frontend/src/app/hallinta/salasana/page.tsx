import { requirePageAccess } from '@/server/access';
import { findUserByEmail } from '@/server/actors';
import { PASSWORD_PATH, homePath } from '@/lib/access';
import { MIN_PASSWORD_LENGTH } from '@/server/password';
import PasswordForm from './PasswordForm';

export const dynamic = 'force-dynamic';

export default async function SalasanaPage() {
  const actor = await requirePageAccess(PASSWORD_PATH);
  const user = await findUserByEmail(actor.email);
  const hasPassword = Boolean(user?.passwordHash);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hasPassword ? 'Vaihda salasana' : 'Aseta oma salasana'}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{actor.email}</p>
      </div>
      {actor.mustChangePassword && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Kirjauduit väliaikaisella salasanalla. Valitse oma salasana ennen kuin jatkat.
        </div>
      )}
      {!hasPassword && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Kirjauduit yhteisellä hätäavaimella tai Googlella. Oman salasanan jälkeen voit kirjautua omalla sähköpostillasi ja salasanallasi.
        </p>
      )}
      <PasswordForm requireCurrent={hasPassword} minLength={MIN_PASSWORD_LENGTH} homeHref={homePath(actor.role)} />
    </div>
  );
}
