import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const previewLock = true; // Set to true to enable preview mode

// Only allow /tulossa for non-localhost, block all else
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (previewLock && !isLocal) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|icons|api|public).*)'],
};
