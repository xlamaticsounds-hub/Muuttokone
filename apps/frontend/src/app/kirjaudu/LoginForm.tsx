'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { LOGIN_LOCKED_ERROR, LOGIN_LOCKED_MESSAGE } from '@/lib/access';

const inputClass =
  'block h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';

export default function LoginForm({
  callbackUrl,
  initialError,
  showGoogle,
}: {
  callbackUrl: string;
  initialError: string | null;
  showGoogle: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await signIn('credentials', { email: email.trim(), password, redirect: false, callbackUrl });
      if (!result?.ok || result.error) {
        setError(
          result?.error === LOGIN_LOCKED_ERROR
            ? LOGIN_LOCKED_MESSAGE
            : 'Sähköposti tai salasana on väärin. Monen väärän yrityksen jälkeen kirjautuminen estetään 15 minuutiksi.',
        );
        setPassword('');
        setPending(false);
        return;
      }
      // Koko sivun lataus, jotta hallinta lukee uuden istunnon palvelimella
      window.location.assign(callbackUrl);
    } catch {
      setError('Yhteys ei toiminut. Tarkista verkkoyhteys ja yritä uudelleen.');
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-800">
            Sähköposti
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-800">
            Salasana
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              // Näkyvissä salasana on tekstikenttä: ilman näitä puhelin muuttaa alkukirjaimen isoksi
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gray-500 hover:text-gray-800"
              aria-label={showPassword ? 'Piilota salasana' : 'Näytä salasana'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-outfit text-base font-bold text-white shadow-1 transition hover:bg-primary/90 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {pending ? 'Kirjaudutaan…' : 'Kirjaudu'}
        </button>
      </form>

      {showGoogle && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            Omistajat
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white text-base font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Kirjaudu Googlella
          </button>
        </>
      )}
    </div>
  );
}
