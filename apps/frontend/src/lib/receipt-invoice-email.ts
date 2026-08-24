import { siteConfig } from '@/config/site';
import type { ReceiptLineItem } from '@/lib/pdf/receipt-pdf-document';

// Sama HTML-pako kuin muissakin send-*.ts-tiedostoissa/quote-email.ts:ssä.
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

export type InvoiceReceiptEmailParams = {
  customerName: string;
  receiptNumber: string;
  invoiceNumber: number;
  items: ReceiptLineItem[];
  totalAmount: number;
};

// Jaettu send-invoice-receipt.ts:n (oikea lähetys) ja ReceiptPreviewModalin (esikatselu)
// kesken, jotta esikatselu vastaa aina täsmälleen sitä mitä asiakas oikeasti saisi —
// sama periaate kuin quote-email.ts:ssä.
export function renderInvoiceReceiptEmailHtml(params: InvoiceReceiptEmailParams): string {
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
