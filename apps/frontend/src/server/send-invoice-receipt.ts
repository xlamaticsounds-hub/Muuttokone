'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { siteConfig } from '@/config/site';
import { computeInvoiceTotals, parseInvoiceItems } from '@/lib/invoice';
import { renderReceiptPdf } from '@/server/pdf/receipt-pdf';
import type { ReceiptLineItem } from '@/lib/pdf/receipt-pdf-document';

// Sama HTML-pako kuin muissakin send-*.ts-tiedostoissa.
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEuro(value: number): string {
  return value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderItemRows(items: ReceiptLineItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;">${esc(item.label)}</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;font-weight:600;">${formatEuro(item.amount)} €</td>
        </tr>`,
    )
    .join('');
}

function renderReceiptEmailHtml(params: {
  customerName: string;
  receiptNumber: string;
  invoiceNumber: number;
  items: ReceiptLineItem[];
  totalAmount: number;
}): string {
  const { customerName, receiptNumber, invoiceNumber, items, totalAmount } = params;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(customerName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Tässä kuitti laskuusi nro ${esc(invoiceNumber)} liittyen.
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Summa</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${formatEuro(totalAmount)} €</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">sis. ALV — kuitti nro ${esc(receiptNumber)}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;margin-bottom:16px;">
      ${renderItemRows(items)}
    </table>

    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">
      Kuitti on liitteenä PDF-tiedostona — säilytäthän sen, sillä se toimii tositteena mahdollista
      kotitalousvähennystä varten. Jos kuitissa on jotain kysyttävää, vastaa tähän viestiin tai soita meille.
    </p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>Muuttokone.fi</strong></p>
      <p style="margin:0 0 2px;">Y-tunnus: ${esc(siteConfig.businessId)}</p>
      <p style="margin:0 0 2px;">📞 +358 45 847 0755</p>
      <p style="margin:0;">✉️ info@muuttokone.fi</p>
    </div>
  </div>`;
}

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

  const html = renderReceiptEmailHtml({
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
