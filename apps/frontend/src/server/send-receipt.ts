'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { createLog } from '@/server/repo/logs';
import { siteConfig } from '@/config/site';
import { renderReceiptPdf } from '@/server/pdf/receipt-pdf';
import type { ReceiptLineItem } from '@/lib/pdf/receipt-pdf-document';

// Sama HTML-pako kuin send-quote.ts/send-invoice.ts:ssä — asiakkaan/kuitin teksti
// päätyy raakaan HTML-merkkijonoon, joten se on paettava käsin.
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

function computeTotals(items: ReceiptLineItem[]) {
  return items.reduce(
    (acc, item) => {
      const net = item.amount / (1 + item.vatRate);
      const vat = item.amount - net;
      return { net: acc.net + net, vat: acc.vat + vat, gross: acc.gross + item.amount };
    },
    { net: 0, vat: 0, gross: 0 },
  );
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
  items: ReceiptLineItem[];
  totalAmount: number;
  paymentMethod: string;
}): string {
  const { customerName, receiptNumber, items, totalAmount, paymentMethod } = params;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(customerName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Kiitos kun valitsit Muuttokone.fi:n! Tässä kuitti nro ${esc(receiptNumber)}.
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Maksettu summa</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${formatEuro(totalAmount)} €</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">sis. ALV — maksutapa: ${esc(paymentMethod)}</p>
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

export type SendReceiptParams = {
  leadId: string;
  email: string;
  receiptNumber: string;
  receiptDate: string; // ISO
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: string | null;
  items: ReceiptLineItem[];
  paymentMethod: string;
};

/**
 * Lähettää kuitin (PDF-liitteenä) asiakkaan sähköpostiin tarjous@muuttokone.fi-postilaatikon
 * kautta (sama SMTP kuin send-quote.ts/send-invoice.ts:ssä). Kutsutaan vasta kun ihminen
 * painaa "Lähetä kuitti asiakkaalle" kuittisivulla.
 *
 * Kuitin rivit eivät ole pysyvästi tallessa tietokannassa (kuittisivu on täysin
 * asiakaspään tilassa, ks. ReceiptClient.tsx), joten koko sisältö tulee parametreina
 * eikä sitä haeta uudelleen kannasta niin kuin sendInvoiceEmail tekee.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia) — sama syy kuin muissakin lähetystoiminnoissa:
 * Next.js piilottaisi Server Actionin throw-virheen tuotannossa yleiseen virheviestiin.
 */
export async function sendReceiptEmail(params: SendReceiptParams): Promise<SendReceiptResult> {
  try {
    return await sendReceiptEmailInner(params);
  } catch (err) {
    console.error('sendReceiptEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe kuitin lähetyksessä.',
    };
  }
}

async function sendReceiptEmailInner(params: SendReceiptParams): Promise<SendReceiptResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi kuitin.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const recipientEmail = params.email.trim();
  if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
    return { success: false, message: 'Anna kelvollinen sähköpostiosoite johon kuitti lähetetään.' };
  }

  if (params.items.length === 0) {
    return { success: false, message: 'Kuitilla ei ole yhtään riviä.' };
  }

  const receiptDate = new Date(params.receiptDate);
  const totals = computeTotals(params.items);

  const html = renderReceiptEmailHtml({
    customerName: params.customerName,
    receiptNumber: params.receiptNumber,
    items: params.items,
    totalAmount: totals.gross,
    paymentMethod: params.paymentMethod,
  });

  const pdfBuffer = await renderReceiptPdf({
    receiptNumber: params.receiptNumber,
    receiptDate,
    customerName: params.customerName,
    customerEmail: recipientEmail,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    requestedDate: params.requestedDate,
    items: params.items,
    paymentMethod: params.paymentMethod,
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
      subject: `Kuittisi Muuttokone.fi:ltä — Nro ${params.receiptNumber} — ${formatEuro(totals.gross)} €`,
      html,
      attachments: [
        {
          filename: `kuitti-${params.receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('sendReceiptEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await createLog({
    entityType: 'Lead',
    entityId: params.leadId,
    action: 'lead.receipt_sent',
    message: `Kuitti lähetetty sähköpostitse osoitteeseen ${recipientEmail}`,
    data: { email: recipientEmail, amount: totals.gross, receiptNumber: params.receiptNumber },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: recipientEmail };
}
