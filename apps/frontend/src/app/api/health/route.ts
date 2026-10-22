import { NextResponse } from 'next/server';

export async function GET() {
  // Basic health check - you can add more checks here
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      // Railway asettaa GitHub-julkaisulle RAILWAY_GIT_COMMIT_SHA:n — näin livesivun versio voidaan tarkistaa
      commit: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
    { status: 200 },
  );
}
