'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { computeInvoiceTotals, parseInvoiceItems } from '@/lib/invoice';
import { renderReceiptPdf } from '@/server/pdf/receipt-pdf';
import { renderInvoiceReceiptEmailHtml } from '@/lib/receipt-invoice-email';
import type { ReceiptLineItem } from '@/lib/pdf/receipt-pdf-document';

export type SendReceiptResult = { success: true; sentTo: string } | { success: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lähettää kuitin (PDF-liitteenä) laskun tiedoilla — asiakkaan riviä, summaa ja nimeä ei
 * syötetä uudelleen käsin, vaan ne poimitaan suoraan kyseiseltä laskulta. Kutsutaan laskun
 * sivulta "Lähetä kuitti samaan osoitteeseen" -napista, samaan sähköpostiosoitteeseen kuin
 * lasku itse lähetetään/on lähetetty.
 *
 * Ei kosketa Invoice.sentAt/recipientEmail-kenttiä — ne kuvaavat nimenomaan laskun lähetystä,
 * kuitin lähetys on oma, siitä erillinen tapahtuma joka vain kirjataan lokiin (ks. send-receipt.ts,
 * jossa liidin kuiteillakaan ei ole pysyvää tilaa tietokannassa).
 */
export async function sendReceiptForInvoice(invoiceId: string, email: string): Promise<SendReceiptResult> {
  try {
    return await sendReceiptForInvoiceInner(invoiceId, email);
  } catch (err) {
    console.error('sendReceiptForInvoice: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe kuitin lähetyksessä.',
    };
  }
}

async function sendReceiptForInvoiceInner(invoiceId: string, email: string): Promise<SendReceiptResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi kuitin.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const recipientEmail = email.trim();
  if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
    return { success: false, message: 'Anna kelvollinen sähköpostiosoite johon kuitti lähetetään.' };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { contact: true } });
  if (!invoice) {
    return { success: false, message: 'Laskua ei löytynyt.' };
  }

  const invoiceItems = parseInvoiceItems(invoice.items);
  if (invoiceItems.length === 0) {
    return { success: false, message: 'Laskulla ei ole yhtään riviä.' };
  }
  const items: ReceiptLineItem[] = invoiceItems.map((item, i) => ({
    id: String(i),
    label: item.description,
    amount: item.amount,
    vatRate: item.vatRate,
  }));
  const totals = computeInvoiceTotals(invoiceItems);
  const receiptNumber = `${new Date().getFullYear()}-L${invoice.invoiceNumber}`;
  const customerAddress = invoice.contact
    ? [invoice.contact.street, invoice.contact.postalCode, invoice.contact.city].filter(Boolean).join(', ')
    : null;

  const html = renderInvoiceReceiptEmailHtml({
    customerName: invoice.customerName,
    receiptNumber,
    invoiceNumber: invoice.invoiceNumber,
    items,
    totalAmount: totals.gross,
  });

  const pdfBuffer = await renderReceiptPdf({
    receiptNumber,
    receiptDate: new Date(),
    customerName: invoice.customerName,
    customerEmail: recipientEmail,
    customerPhone: invoice.contact?.phone ?? null,
    customerAddress: customerAddress || null,
    fromAddress: null,
    toAddress: null,
    requestedDate: null,
    items,
    paymentMethod: 'Lasku',
  });

  const senderName = process.env.QUOTE_EMAIL_FROM_NAME || 'Muuttokone.fi';

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Kuitti laskuusi nro ${invoice.invoiceNumber} — Muuttokone.fi`,
      html,
      attachments: [
        {
          filename: `kuitti-${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('sendReceiptForInvoice: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await createLog({
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'invoice.receipt_sent',
    message: `Kuitti lähetetty sähköpostitse osoitteeseen ${recipientEmail}`,
    data: { email: recipientEmail, amount: totals.gross, invoiceNumber: invoice.invoiceNumber, receiptNumber },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: recipientEmail };
}
