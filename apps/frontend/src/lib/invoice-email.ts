import { siteConfig } from '@/config/site';
import type { InvoiceLineItem } from '@/lib/invoice';

// Sama HTML-pako kuin quote-email.ts:ssä — asiakkaan/laskun teksti päätyy raakaan
// HTML-merkkijonoon, joten se on paettava käsin (ei JSX:n automaattista turvaverkkoa).
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Rivinvaihdot säilytetään, mutta HTML paetaan ensin (sama kuin quote-email.ts:ssä).
function escMultiline(value: string): string {
  return esc(value).replace(/\n/g, '<br />');
}

function formatDateFi(date: Date | null): string {
  if (!date) return 'sovitaan erikseen';
  return new Date(date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatEuro(value: number): string {
  return value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderItemRows(items: InvoiceLineItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;">${esc(item.description)}</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;font-weight:600;">${formatEuro(item.amount)} €</td>
        </tr>`,
    )
    .join('');
}

export type InvoiceEmailParams = {
  customerName: string;
  // Esikatselussa laskua ei ole vielä luotu, joten numeron tilalla voi olla paikkamerkkiteksti.
  invoiceNumber: number | string;
  items: InvoiceLineItem[];
  totalAmount: number;
  dueDate: Date | null;
  viitenumero: string;
  // Hallinnan vapaasti kirjoittama lisäteksti — näkyy summalaatikon alla. Tyhjänä lohko jätetään pois.
  customMessage?: string | null;
  // Maksumuistutus (viivästyskorkolasku): eri johdanto- ja otsikkoteksti kuin tavallisessa laskussa.
  reminder?: boolean;
};

export function invoiceEmailSubject(params: { invoiceNumber: number | string; totalAmount: number; reminder?: boolean }): string {
  const prefix = params.reminder ? 'Maksumuistutus Muuttokone.fi:ltä' : 'Laskusi Muuttokone.fi:ltä';
  return `${prefix} — Nro ${params.invoiceNumber} — ${formatEuro(params.totalAmount)} €`;
}

export function renderInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const { customerName, invoiceNumber, items, totalAmount, dueDate, viitenumero, customMessage, reminder } = params;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(customerName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      ${reminder
        ? `Tässä maksumuistutus viivästyskorkoineen, lasku nro ${esc(invoiceNumber)}.`
        : `Kiitos kun valitsit Muuttokone.fi:n! Tässä lasku nro ${esc(invoiceNumber)}.`}
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Maksettava summa</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${formatEuro(totalAmount)} €</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">sis. ALV</p>
    </div>

    ${customMessage && customMessage.trim() ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#0c4a6e;">${escMultiline(customMessage.trim())}</p>
    </div>` : ''}

    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;margin-bottom:16px;">
      ${renderItemRows(items)}
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Saaja</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(siteConfig.invoicePayee)}</td>
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
