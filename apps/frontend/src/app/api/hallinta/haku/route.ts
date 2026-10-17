import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { LEAD_STATUS_LABELS } from '@/lib/lead-status';

const LIMIT = 6;

export type SearchResults = {
  leads: { id: string; title: string; subtitle: string; status: string }[];
  contacts: { id: string; title: string; subtitle: string }[];
  invoices: { id: string; title: string; subtitle: string }[];
};

const fullName = (c: { firstName: string | null; lastName: string | null; companyName: string | null }) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Asiakas';

// Globaali haku: liidit, asiakkaat ja laskut. Puhelinnumerosta verrataan pelkkiä numeroita,
// jotta "040 123" löytää myös "+358 40 123".
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ leads: [], contacts: [], invoices: [] } satisfies SearchResults);

  const text = { contains: q, mode: 'insensitive' as const };
  const digits = q.replace(/\D/g, '');
  // Kotimainen numero (040...) vs. kansainvälinen (+358 40...): vertaillaan ilman etunollaa
  const phoneTail = digits.length >= 4 ? digits.replace(/^(00)?358/, '').replace(/^0/, '') : '';

  const contactWhere = {
    OR: [
      { firstName: text },
      { lastName: text },
      { companyName: text },
      { email: text },
      { phone: text },
      { street: text },
      ...(phoneTail ? [{ phone: { contains: phoneTail } }] : []),
    ],
  };
  const invoiceNumber = /^\d{1,9}$/.test(q) ? Number(q) : null;

  try {
    const [leads, contacts, invoices] = await Promise.all([
      prisma.lead.findMany({
        where: { OR: [{ contact: contactWhere }, { fromAddress: text }, { toAddress: text }] },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      prisma.contact.findMany({ where: contactWhere, orderBy: { updatedAt: 'desc' }, take: LIMIT }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { customerName: text },
            { customerEmail: text },
            ...(invoiceNumber !== null ? [{ invoiceNumber }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
    ]);

    const result: SearchResults = {
      leads: leads.map((l) => ({
        id: l.id,
        title: fullName(l.contact),
        subtitle: [l.fromAddress, l.toAddress].filter(Boolean).join(' → ') || l.contact.email || '',
        status: LEAD_STATUS_LABELS[l.status] ?? l.status,
      })),
      contacts: contacts.map((c) => ({ id: c.id, title: fullName(c), subtitle: c.email || c.phone || '' })),
      invoices: invoices.map((i) => ({ id: i.id, title: `Lasku ${i.invoiceNumber} · ${i.customerName}`, subtitle: i.status })),
    };
    return NextResponse.json(result);
  } catch (error) {
    console.warn('[hallinta/haku] Haku epäonnistui', error);
    return NextResponse.json({ error: 'Haku epäonnistui.' }, { status: 500 });
  }
}
