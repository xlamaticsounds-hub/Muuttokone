import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { offerForLead } from '@/server/offer-data';
import { renderOfferPdf } from '@/server/pdf/offer-pdf';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { offerFileName, offerNumber } from '@/lib/offer';

export const runtime = 'nodejs';

/** Liidin tarjous / tilausvahvistus PDF:nä (tallennettu tai esitäytetty). ?lataa=1 lataa tiedostona. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { contact: true } });
  if (!lead) return NextResponse.json({ error: 'Liidiä ei löytynyt.' }, { status: 404 });

  const { offer } = offerForLead(lead, toHelsinkiDateInput(new Date()));
  const number = offerNumber(lead.id, offer.issuedOn);
  const pdf = await renderOfferPdf(offer, number);
  const download = req.nextUrl.searchParams.get('lataa') === '1';

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${offerFileName(offer.type, number)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
