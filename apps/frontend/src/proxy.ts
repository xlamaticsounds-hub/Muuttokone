import { NextRequest, NextFetchEvent, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

const authProxy = withAuth({
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
    },
  },
  callbacks: {
    authorized: ({ token, req }) => {
      // Only allowed emails can access admin or AI generation tools
      const allowedEmails = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase());

      const userEmail = token?.email?.toLowerCase();

      if (!userEmail) return false;

      // Check if user is in the allowlist
      const isAllowed =
        userEmail === 'xlamaticsounds@gmail.com' ||
        userEmail === 'domenic.eklund@gmail.com' ||
        allowedEmails.includes(userEmail);

      return isAllowed;
    },
  },
});

// hallinta/api-ai: täsmälleen sama auth-tarkistus kuin ennenkin, koskematta.
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
