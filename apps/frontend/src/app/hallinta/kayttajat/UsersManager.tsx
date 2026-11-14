'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, KeyRound, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { createUser, deleteUser, resetUserPassword, setUserActive, updateUser } from '@/server/user-actions';
import { ROLES, ROLE_LABELS, roleNeedsTeam, type Role } from '@/lib/access';
import { cardClass, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from '../form-styles';

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  active: boolean;
  hasPassword: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  isSelf: boolean;
  /** Palvelimen asetuksissa määritelty omistaja: ei poisteta (vain käytöstä poisto) */
  envOwner: boolean;
};

type Team = { id: string; name: string };

const ROLE_HELP: Record<Role, string> = {
  OWNER: 'Kaikki tiimit ja toiminnot, myös käyttäjähallinta.',
  TEAM_ADMIN: 'Hallinnan työkalut, mutta vain oman tiimin keikat, työajat ja laatikot. Ei raportteja, ennustetta eikä asetuksia.',
  CREW_LEAD: 'Vain partiosivu: oman tiimin keikat ilman hintoja, työaikaleimat ja laatikoiden toimitukset.',
};

const ROLE_PILL: Record<string, string> = {
  OWNER: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-800',
  TEAM_ADMIN: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:ring-violet-800',
  CREW_LEAD: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800',
};

function formatLogin(iso: string | null): string {
  if (!iso) return 'ei vielä kirjautunut';
  return `kirjautui ${new Date(iso).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

type FormState = { email: string; name: string; role: Role; teamId: string };

function UserForm({
  initial,
  teams,
  withEmail,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  teams: Team[];
  withEmail: boolean;
  submitLabel: string;
  onSubmit: (values: FormState) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsTeam = roleNeedsTeam(values.role);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(await onSubmit(values));
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {withEmail && (
          <label className="block">
            <span className={labelClass}>Sähköposti</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              className={inputClass}
            />
          </label>
        )}
        <label className="block">
          <span className={labelClass}>Nimi</span>
          <input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Rooli</span>
          <select value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value as Role })} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        {needsTeam && (
          <label className="block">
            <span className={labelClass}>Tiimi</span>
            <select required value={values.teamId} onChange={(e) => setValues({ ...values, teamId: e.target.value })} className={inputClass}>
              <option value="">Valitse tiimi</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{ROLE_HELP[values.role]}</p>
      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? 'Tallennetaan…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Peruuta
          </button>
        )}
      </div>
    </form>
  );
}

/** Väliaikainen salasana näytetään vain kerran: omistaja välittää sen käyttäjälle. */
function TempPasswordNotice({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/hallinta` : '/hallinta';
  const text = `Muuttokoneen hallinta: ${loginUrl}\nSähköposti: ${email}\nVäliaikainen salasana: ${password}\nVaihda salasana ensimmäisellä kirjautumisella.`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
      <p className="font-semibold">Väliaikainen salasana käyttäjälle {email}</p>
      <p className="mt-2 select-all rounded-md bg-white px-3 py-2 font-mono text-lg tracking-wider text-gray-900 dark:bg-gray-900 dark:text-white">{password}</p>
      <p className="mt-2">Lähetä tunnukset käyttäjälle esim. tekstiviestillä. Salasanaa ei näytetä uudelleen; tarvittaessa anna uusi.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={secondaryButton}>
          <span className="inline-flex items-center gap-2">
            <Copy className="h-4 w-4" />
            {copied ? 'Kopioitu' : 'Kopioi viesti'}
          </span>
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Valmis
        </button>
      </div>
    </div>
  );
}

export default function UsersManager({ users, teams }: { users: UserDto[]; teams: Team[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? null;

  const run = async (id: string, action: () => Promise<{ success: boolean; message?: string; tempPassword?: string }>, email?: string) => {
    setBusy(id);
    setError(null);
    const result = await action();
    setBusy(null);
    if (!result.success) {
      setError(result.message ?? 'Toiminto epäonnistui.');
      return;
    }
    if (result.tempPassword && email) setNotice({ email, password: result.tempPassword });
    router.refresh();
  };

  return (
    <section className={`${cardClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hallinnan käyttäjät</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Lisää käyttäjä
            </span>
          </button>
        )}
      </div>

      {notice && <TempPasswordNotice email={notice.email} password={notice.password} onClose={() => setNotice(null)} />}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

      {adding && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Uusi käyttäjä</h3>
          <UserForm
            initial={{ email: '', name: '', role: 'CREW_LEAD', teamId: 'tampere' }}
            teams={teams}
            withEmail
            submitLabel="Lisää ja luo salasana"
            onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              const result = await createUser({ email: v.email, name: v.name, role: v.role, teamId: v.teamId || null });
              if (!result.success) return result.message;
              setAdding(false);
              if (result.tempPassword) setNotice({ email: v.email.trim().toLowerCase(), password: result.tempPassword });
              router.refresh();
              return null;
            }}
          />
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Ei käyttäjiä.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {users.map((u) => (
            <li key={u.id} className={`py-3 ${u.active ? '' : 'opacity-60'}`}>
              {editing === u.id ? (
                <UserForm
                  initial={{ email: u.email, name: u.name, role: u.role as Role, teamId: u.teamId ?? '' }}
                  teams={teams}
                  withEmail={false}
                  submitLabel="Tallenna"
                  onCancel={() => setEditing(null)}
                  onSubmit={async (v) => {
                    const result = await updateUser({ id: u.id, name: v.name, role: v.role, teamId: v.teamId || null });
                    if (!result.success) return result.message;
                    setEditing(null);
                    router.refresh();
                    return null;
                  }}
                />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{u.name}</span>
                      {u.isSelf && <span className="text-xs text-gray-500">(sinä)</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${ROLE_PILL[u.role] ?? ''}`}>
                        {ROLE_LABELS[u.role as Role] ?? u.role}
                        {teamName(u.teamId) ? ` · ${teamName(u.teamId)}` : ''}
                      </span>
                      {!u.active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">Pois käytöstä</span>}
                    </div>
                    <p className="truncate text-sm text-gray-600 dark:text-gray-300">{u.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatLogin(u.lastLoginAt)}
                      {u.mustChangePassword && u.hasPassword ? ' · väliaikainen salasana' : ''}
                      {!u.hasPassword ? ' · ei omaa salasanaa' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditing(u.id)} disabled={busy === u.id} className={secondaryButton} title="Muokkaa">
                      <span className="inline-flex items-center gap-1.5">
                        <Pencil className="h-4 w-4" /> Muokkaa
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={busy === u.id}
                      className={secondaryButton}
                      onClick={() => {
                        if (window.confirm(`Annetaanko käyttäjälle ${u.email} uusi väliaikainen salasana? Vanha lakkaa toimimasta.`)) {
                          run(u.id, () => resetUserPassword(u.id), u.email);
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <KeyRound className="h-4 w-4" /> Uusi salasana
                      </span>
                    </button>
                    {!u.isSelf && (
                      <button
                        type="button"
                        disabled={busy === u.id}
                        className={secondaryButton}
                        onClick={() => run(u.id, () => setUserActive(u.id, !u.active))}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          {u.active ? 'Poista käytöstä' : 'Palauta käyttöön'}
                        </span>
                      </button>
                    )}
                    {!u.isSelf && !u.envOwner && (
                      <button
                        type="button"
                        disabled={busy === u.id}
                        className={dangerButton}
                        onClick={() => {
                          if (window.confirm(`Poistetaanko ${u.email} pysyvästi? Työaikaleimat ja lokit säilyvät.`)) {
                            run(u.id, () => deleteUser(u.id));
                          }
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 className="h-4 w-4" /> Poista
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
