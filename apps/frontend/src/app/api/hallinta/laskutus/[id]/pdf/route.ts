import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { formatAddress, parseInvoiceItems } from '@/lib/invoice';
import { generateViitenumero } from '@/lib/reference-number';
import { renderInvoicePdf } from '@/server/pdf/invoice-pdf';

// Sama react-pdf-renderöinti kuin sähköpostiin liitettävässä laskussa (server/send-invoice.ts),
// jotta ladattu PDF ja sähköpostiin liitetty PDF näyttävät aina samat tiedot — selaimen oma
// "Tulosta / Tallenna PDF" -tuloste ei ole luotettava, koska se voi pudottaa sisältöä sivunvaihdossa.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { contact: true } });
  if (!invoice) {
    return NextResponse.json({ error: 'Laskua ei löytynyt.' }, { status: 404 });
  }

  const items = parseInvoiceItems(invoice.items);
  const viitenumero = generateViitenumero(invoice.invoiceNumber);
  const customerAddress = formatAddress({
    street: invoice.customerStreet ?? invoice.contact?.street,
    postalCode: invoice.customerPostalCode ?? invoice.contact?.postalCode,
    city: invoice.customerCity ?? invoice.contact?.city,
  });

  const pdfBuffer = await renderInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerAddress,
    customerEmail: invoice.customerEmail ?? invoice.contact?.email ?? null,
    items,
    createdAt: invoice.createdAt,
    dueDate: invoice.dueDate,
    serviceDate: invoice.serviceDate,
    viitenumero,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lasku-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
