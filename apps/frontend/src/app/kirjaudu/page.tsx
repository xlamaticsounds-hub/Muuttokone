import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/access';
import { hasGoogleOAuth } from '@/server/auth';
import { homePath, safeCallbackPath } from '@/lib/access';
import LoginForm from './LoginForm';

// Hallinnan kirjautuminen Muuttokoneen ilmeellä (NextAuthin oletussivun tilalla, server/auth.ts: pages).
// Partionjohtajat kirjautuvat yleensä puhelimella, joten sivu on tehty ensin kapealle näytölle.

export const metadata: Metadata = {
  title: 'Kirjaudu',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// NextAuthin virhekoodit (?error=), joista käyttäjälle kerrotaan selkokielellä.
function errorMessage(code: string | undefined): string | null {
  if (!code || code === 'SessionRequired') return null;
  if (code === 'CredentialsSignin') return 'Sähköposti tai salasana on väärin.';
  if (code === 'AccessDenied') return 'Google-kirjautuminen on vain omistajille. Kirjaudu sähköpostilla ja salasanalla.';
  return 'Kirjautuminen ei onnistunut. Yritä uudelleen.';
}

export default async function KirjauduPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const callback = safeCallbackPath(callbackUrl);

  // Jo kirjautunut: suoraan hallintaan (sivu ohjaa tarvittaessa salasanan vaihtoon tai oman roolin etusivulle)
  const actor = await getActor();
  if (actor) redirect(callback ?? homePath(actor.role));

  return (
    <main className="min-h-dvh bg-white lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary lg:block" aria-hidden="true">
        <Image src="/images/webp/hero/hero.webp" alt="" fill priority sizes="50vw" className="object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16">
          <p className="font-outfit text-4xl font-black leading-tight text-white xl:text-5xl">
            Keikat, partiot ja työajat
            <span className="block text-secondary">yhdessä paikassa.</span>
          </p>
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <Link href="/" className="mb-8 block w-28 self-center lg:self-start" aria-label="Muuttokone.fi etusivulle">
            <Image src="/images/logo/logo.webp" alt="Muuttokone.fi" width={649} height={485} priority sizes="112px" className="h-auto w-full" />
          </Link>

          <h1 className="font-outfit text-3xl font-black text-gray-900">Kirjaudu hallintaan</h1>
          <p className="mt-1 text-gray-600">Muuttokoneen henkilökunnalle.</p>

          <LoginForm callbackUrl={callback ?? '/hallinta'} initialError={errorMessage(error)} showGoogle={hasGoogleOAuth} />

          <p className="mt-8 text-sm text-gray-500">
            Unohtuiko salasana? Pyydä uusi väliaikainen salasana Muuttokoneen omistajalta.
          </p>
        </div>

        <Link href="/" className="mx-auto mt-8 text-sm font-medium text-gray-500 hover:text-primary">
          ← Takaisin muuttokone.fi:hin
        </Link>
      </section>
    </main>
  );
}
