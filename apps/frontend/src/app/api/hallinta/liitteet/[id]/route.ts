import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Keikan kuvaliite vain kirjautuneille (kuvissa on asiakkaan henkilötietoja). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.leadAttachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: 'Kuvaa ei löytynyt.' }, { status: 404 });

  // Paikallinen mock-tietokanta palauttaa levyltä luetun Bufferin JSON-muodossa
  const data = attachment.data as unknown;
  const bytes = data instanceof Uint8Array ? data : Uint8Array.from((data as { data?: number[] } | null)?.data ?? []);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': ALLOWED_TYPES.has(attachment.mimeType) ? attachment.mimeType : 'application/octet-stream',
      'Content-Disposition': `inline; filename="${attachment.name.replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
