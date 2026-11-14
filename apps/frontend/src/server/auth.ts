import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, isEnvOwner, normalizeEmail, recordLogin, resolveActor, tooManyFailedLogins } from "@/server/actors";
import { safeEqual, verifyPassword } from "@/server/password";
import { LOGIN_PATH } from "@/lib/access";

// Kirjautuminen: jokaisella hallinnan käyttäjällä on oma salasana (User-taulu, käyttäjähallinta
// /hallinta/kayttajat). Yhteinen ADMIN_LOGIN_PASSWORD toimii enää hätäavaimena ympäristömuuttujan
// omistajille (server/actors.ts), ettei kukaan voi lukita itseään ulos. Google-kirjautuminen vain omistajille.
// Roolit ja tiimit tarkistetaan joka pyynnöllä kannasta (server/access.ts), joten ne eivät ole tokenissa.

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === "production";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
export const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);
const adminLoginPassword = process.env.ADMIN_LOGIN_PASSWORD ?? "";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  // Oma kirjautumissivu (app/kirjaudu). Virheet (esim. Google-kirjautuminen muulle kuin omistajalle)
  // palaavat samalle sivulle ?error=-parametrilla.
  pages: {
    signIn: LOGIN_PATH,
    error: LOGIN_PATH,
  },
  providers: [
    ...(hasGoogleOAuth
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Hallinta",
      credentials: {
        email: { label: "Sähköposti", type: "email" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email ? normalizeEmail(credentials.email) : "";
        const password = credentials?.password ?? "";

        if (!email || !password) return null;
        if (await tooManyFailedLogins(email)) return null;

        const user = await findUserByEmail(email);

        // 1) Oma salasana
        if (user?.active && user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
          await recordLogin(email, true, { method: "password" });
          return { id: user.id, email, name: user.name };
        }

        // 2) Hätäavain: vain ympäristömuuttujan omistajat, eikä käytöstä poistettu käyttäjä
        if (isEnvOwner(email) && (!user || user.active) && adminLoginPassword && safeEqual(password, adminLoginPassword)) {
          await recordLogin(email, true, { method: "emergency_key" });
          return { id: user?.id ?? email, email, name: user?.name ?? email };
        }

        await recordLogin(email, false);
        return null;
      },
    }),
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Salasanakirjautuminen on jo tarkistettu authorize():ssa
      if (account?.provider === "credentials") return true;
      // Google: vain aktiiviset omistajat
      const actor = await resolveActor(user.email);
      if (actor?.role === "OWNER") {
        await recordLogin(user.email!, true, { method: "google" });
        return true;
      }
      return false;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
