import { NextRequest, NextResponse } from 'next/server';
import { DIRECTUS_URL } from '@/lib/directus';

export const revalidate = 3600; // cache for 1h on the edge/cache layer if possible

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const token = process.env.DIRECTUS_STATIC_TOKEN;
  const search = req.nextUrl.search;
  const url = `${DIRECTUS_URL.replace(/\/$/, '')}/assets/${encodeURIComponent(id)}${search || ''}`;

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      // Let Next handle caching; Directus can set ETag
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return new NextResponse(text || 'Upstream error', { status: res.status });
    }

    const headers = new Headers();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    headers.set('content-type', contentType);
    const cacheControl = res.headers.get('cache-control') || 'public, max-age=3600, immutable';
    headers.set('cache-control', cacheControl);

    return new NextResponse(res.body, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Asset proxy failed' }, { status: 500 });
  }
}
