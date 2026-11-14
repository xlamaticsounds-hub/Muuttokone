import { NextRequest, NextFetchEvent, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { LOGIN_PATH } from "@/lib/access";

const authProxy = withAuth({
  pages: {
    signIn: LOGIN_PATH,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
    },
  },
  callbacks: {
    // Vain kirjautuminen tarkistetaan tässä. Token myönnetään vain sallituille (server/auth.ts: signIn), ja
    // roolit/tiimit tarkistetaan kannasta joka sivulla, server actionissa ja API-reitissä (server/access.ts),
    // jotta käytöstä poisto ja roolin muutos tehoavat heti eikä vasta tokenin vanhetessa.
    authorized: ({ token }) => Boolean(token?.email),
  },
});

// hallinta/api-ai: vaatii kirjautumisen (yllä).
// Kaikki muut reitit: merkitään kieli x-locale-headeriin URL:n perusteella (/en tai
// /en/... -> 'en', muuten 'fi') — (site)/layout.tsx lukee tämän, jotta Header/Footer/koko
// sivu renderöityy oikealla kielellä jo ensimmäisellä, evästeettömällä käynnillä (esim.
// hakukonebotti /en-sivulla). Ilman tätä vain sivun body (LocaleProvider-uudelleennestaus
// en/layout.tsx:ssä) kääntyisi, mutta Header/Footer eivät, koska ne renderöityvät
// (site)/layout.tsx:ssä children-propsin ULKOPUOLELLA eivätkä siis ole en/layout.tsx:n
// nestatun providerin sisällä.
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/hallinta') || pathname.startsWith('/api/ai')) {
    return authProxy(req as NextRequestWithAuth, event);
  }

  const isEnglish = pathname === '/en' || pathname.startsWith('/en/');
  const response = NextResponse.next();
  response.headers.set('x-locale', isEnglish ? 'en' : 'fi');
  return response;
}

export const config = {
  matcher: [
    "/hallinta/:path*",
    "/api/ai/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)",
  ],
};
