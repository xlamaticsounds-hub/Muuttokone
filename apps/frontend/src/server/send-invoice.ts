'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail, SMTP_NOT_CONFIGURED_MESSAGE } from '@/server/mailer';
import { generateViitenumero } from '@/lib/reference-number';
import { computeInvoiceTotals, formatAddress, parseInvoiceItems } from '@/lib/invoice';
import { invoiceEmailSubject, renderInvoiceEmailHtml } from '@/lib/invoice-email';
import { renderInvoicePdf } from '@/server/pdf/invoice-pdf';

export type SendInvoiceResult = { success: true; sentTo: string } | { success: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lähettää laskun sähköpostiin tarjous@muuttokone.fi-postilaatikon kautta
 * (sama SMTP kuin send-quote.ts:ssä). Kutsutaan vasta kun ihminen painaa
 * "Lähetä lasku sähköpostitse" laskun sivulla — ei koskaan automaattisesti laskua luotaessa.
 *
 * `email` on laskun sivulla valittu/kirjoitettu osoite — ei aina sama kuin kontaktin
 * oletusosoite, koska käyttäjä voi vaihtaa sen ennen lähetystä.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia) — sama syy kuin sendQuoteEmailissä:
 * Next.js piilottaisi Server Actionin throw-virheen tuotannossa yleiseen virheviestiin.
 */
export type SendInvoiceOptions = {
  // Lisäteksti asiakkaalle (esikatselussa kirjoitettu) — ks. lib/invoice-email.ts.
  customMessage?: string | null;
};

export async function sendInvoiceEmail(
  invoiceId: string,
  email: string,
  options: SendInvoiceOptions = {},
): Promise<SendInvoiceResult> {
  try {
    return await sendInvoiceEmailInner(invoiceId, email, options);
  } catch (err) {
    console.error('sendInvoiceEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe laskun lähetyksessä.',
    };
  }
}

async function sendInvoiceEmailInner(
  invoiceId: string,
  email: string,
  options: SendInvoiceOptions,
): Promise<SendInvoiceResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi laskun.' };
  }

  if (!isSmtpConfigured()) {
    return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };
  }

  const recipientEmail = email.trim();
  if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
    return { success: false, message: 'Anna kelvollinen sähköpostiosoite johon lasku lähetetään.' };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { contact: true, sourceInvoice: { select: { id: true, invoiceNumber: true, status: true } } },
  });
  if (!invoice) {
    return { success: false, message: 'Laskua ei löytynyt.' };
  }

  // Maksumuistutus = lasku joka on tehty toisen laskun pohjalta (createLateFeeInvoice).
  const reminder = !!invoice.sourceInvoice;
  const items = parseInvoiceItems(invoice.items);
  const totals = computeInvoiceTotals(items);
  const viitenumero = generateViitenumero(invoice.invoiceNumber);
  const html = renderInvoiceEmailHtml({
    customerName: invoice.customerName,
    invoiceNumber: invoice.invoiceNumber,
    items,
    totalAmount: totals.gross,
    dueDate: invoice.dueDate,
    viitenumero,
    customMessage: options.customMessage ?? null,
    reminder,
  });

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

  try {
    await sendMail({
      to: recipientEmail,
      subject: invoiceEmailSubject({ invoiceNumber: invoice.invoiceNumber, totalAmount: totals.gross, reminder }),
      html,
      attachments: [
        {
          filename: `lasku-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('sendInvoiceEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    // Uudelleenlähetys ei saa palauttaa jo maksettua / myöhässä olevaa laskua tilaan "Lähetetty".
    data: { sentAt: new Date(), recipientEmail, ...(invoice.status === 'DRAFT' ? { status: 'SENT' as const } : {}) },
  });

  // Muistutus korvaa alkuperäisen laskun: asiakas maksaa muistutuksen (uusi viitenumero),
  // joten alkuperäinen ei saa enää näkyä avoimena eikä siitä saa tehdä uutta muistutusta.
  const source = invoice.sourceInvoice;
  if (source && source.status !== 'PAID' && source.status !== 'SUPERSEDED') {
    await prisma.invoice.update({ where: { id: source.id }, data: { status: 'SUPERSEDED' } });
    await createLog({
      entityType: 'Invoice',
      entityId: source.id,
      action: 'invoice.status_changed',
      message: `Laskun tila muutettu: Korvattu muistutuksella (lasku #${invoice.invoiceNumber})`,
      data: { status: 'SUPERSEDED', reminderInvoiceId: invoiceId },
      actorId: session.user?.email ?? null,
    });
  }

  await createLog({
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'invoice.sent',
    message: `Lasku lähetetty sähköpostitse osoitteeseen ${recipientEmail}`,
    data: { email: recipientEmail, amount: totals.gross, invoiceNumber: invoice.invoiceNumber },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: recipientEmail };
}
