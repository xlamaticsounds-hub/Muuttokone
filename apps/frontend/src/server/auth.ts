import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const allowedEmails = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const builtInAllowedEmails = ["xlamaticsounds@gmail.com", "domenic.eklund@gmail.com"];

const isAllowedEmail = (email?: string | null) => {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return builtInAllowedEmails.includes(normalized) || allowedEmails.includes(normalized);
};

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === "production";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);
const adminLoginPassword = process.env.ADMIN_LOGIN_PASSWORD ?? "";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
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
      name: "Hallinta (dev)",
      credentials: {
        email: { label: "Sahkoposti", type: "email" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;
        if (!isAllowedEmail(email)) return null;
        if (!adminLoginPassword || password !== adminLoginPassword) return null;

        return {
          id: email,
          email,
          name: email,
        };
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
    async signIn({ user }) {
      return isAllowedEmail(user.email);
    },
  },
};
