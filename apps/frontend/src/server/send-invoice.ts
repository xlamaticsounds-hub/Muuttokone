'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { siteConfig } from '@/config/site';
import { generateViitenumero } from '@/lib/reference-number';

// Sama HTML-pako kuin send-quote.ts:ssä — asiakkaan/laskun teksti päätyy raakaan
// HTML-merkkijonoon, joten se on paettava käsin (ei JSX:n automaattista turvaverkkoa).
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateFi(date: Date | null): string {
  if (!date) return 'sovitaan erikseen';
  return new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatEuro(value: number): string {
  return value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderInvoiceEmailHtml(params: {
  customerName: string;
  invoiceNumber: number;
  description: string;
  amount: number;
  dueDate: Date | null;
  viitenumero: string;
}): string {
  const { customerName, invoiceNumber, description, amount, dueDate, viitenumero } = params;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(customerName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Kiitos kun valitsit Muuttokone.fi:n! Tässä lasku nro ${esc(invoiceNumber)} palvelustamme: ${esc(description)}.
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Maksettava summa</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${formatEuro(amount)} €</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">sis. ALV</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Saaja</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">Muuttokone.fi</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Tilinumero (IBAN)</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(siteConfig.bankAccount)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Viitenumero</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;font-weight:700;">${esc(viitenumero)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Eräpäivä</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(formatDateFi(dueDate))}</td>
      </tr>
    </table>

    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">
      Maksathan viitenumerolla, jotta maksu kohdistuu oikein. Jos laskussa on jotain kysyttävää, vastaa tähän viestiin tai soita meille.
    </p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>Muuttokone.fi</strong></p>
      <p style="margin:0 0 2px;">Y-tunnus: ${esc(siteConfig.businessId)}</p>
      <p style="margin:0 0 2px;">📞 +358 45 847 0755</p>
      <p style="margin:0;">✉️ info@muuttokone.fi</p>
    </div>
  </div>`;
}

export type SendInvoiceResult = { success: true; sentTo: string } | { success: false; message: string };

/**
 * Lähettää laskun asiakkaan sähköpostiin tarjous@muuttokone.fi-postilaatikon kautta
 * (sama SMTP kuin send-quote.ts:ssä). Kutsutaan vasta kun ihminen painaa
 * "Lähetä lasku sähköpostitse" laskun sivulla — ei koskaan automaattisesti laskua luotaessa.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia) — sama syy kuin sendQuoteEmailissä:
 * Next.js piilottaisi Server Actionin throw-virheen tuotannossa yleiseen virheviestiin.
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<SendInvoiceResult> {
  try {
    return await sendInvoiceEmailInner(invoiceId);
  } catch (err) {
    console.error('sendInvoiceEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe laskun lähetyksessä.',
    };
  }
}

async function sendInvoiceEmailInner(invoiceId: string): Promise<SendInvoiceResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi laskun.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { contact: true } });
  if (!invoice) {
    return { success: false, message: 'Laskua ei löytynyt.' };
  }

  const recipientEmail = invoice.contact?.email;
  if (!recipientEmail) {
    return { success: false, message: 'Tällä laskulla ei ole sähköpostiosoitetta — valitse asiakas listalta jolla on sähköposti, tai lähetä lasku muulla tavalla.' };
  }

  const viitenumero = generateViitenumero(invoice.invoiceNumber);
  const html = renderInvoiceEmailHtml({
    customerName: invoice.customerName,
    invoiceNumber: invoice.invoiceNumber,
    description: invoice.description,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    viitenumero,
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
      subject: `Laskusi Muuttokone.fi:ltä — Nro ${invoice.invoiceNumber} — ${formatEuro(invoice.amount)} €`,
      html,
    });
  } catch (err) {
    console.error('sendInvoiceEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await prisma.invoice.update({ where: { id: invoiceId }, data: { sentAt: new Date() } });

  await createLog({
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'invoice.sent',
    message: `Lasku lähetetty sähköpostitse osoitteeseen ${recipientEmail}`,
    data: { email: recipientEmail, amount: invoice.amount, invoiceNumber: invoice.invoiceNumber },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: recipientEmail };
}
