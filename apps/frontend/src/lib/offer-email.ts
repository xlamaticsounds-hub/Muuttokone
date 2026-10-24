import { siteConfig } from '@/config/site';
import { formatIsoDateFi, type OfferData } from '@/lib/offer';

// Yleisen tarjouksen / tilausvahvistuksen saateviesti. Varsinainen dokumentti kulkee PDF-liitteenä
// (server/pdf/offer-pdf.tsx); viesti kertoo pääkohdat. Sama HTML-pako kuin muissa sähköpostipohjissa.

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escMultiline(value: string): string {
  return esc(value).replace(/\n/g, '<br />');
}

const euro = (value: number) => value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function offerEmailSubject(offer: OfferData, number: string): string {
  const date = offer.serviceDate ? formatIsoDateFi(offer.serviceDate) : null;
  return offer.type === 'vahvistus'
    ? `Tilausvahvistus — Muuttokone.fi${date ? ` (${date})` : ''}`
    : `Tarjous Muuttokone.fi:ltä nro ${number}${date ? ` — ${date}` : ''}`;
}

export function renderOfferEmailHtml(params: { offer: OfferData; number: string; total: number; message: string | null }): string {
  const { offer, number, total, message } = params;
  const firstName = offer.customerName.split(/\s+/)[0] ?? '';
  const isConfirmation = offer.type === 'vahvistus';
  const zeroVat = offer.lines.some((l) => l.vatRate === 0);

  const intro = isConfirmation
    ? `Kiitos tilauksesta! Vahvistamme sovitun keikan. Tilausvahvistus (nro ${esc(number)}) on liitteenä PDF-tiedostona.`
    : `Kiitos yhteydenotostasi! Tarjouksemme (nro ${esc(number)}) on liitteenä PDF-tiedostona.`;

  const priceBox =
    total > 0
      ? `<p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">${isConfirmation ? 'Sovittu hinta' : 'Hinta'}</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${euro(total)} €</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">${zeroVat ? 'ALV 0 % (myyjä ei ole arvonlisäverovelvollinen)' : 'sis. ALV 25,5 %'}</p>
      ${offer.priceNote ? `<p style="margin:8px 0 0;font-size:13px;color:#e5e7eb;">${escMultiline(offer.priceNote)}</p>` : ''}`
      : offer.priceNote
        ? `<p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Hinnoittelu</p>
      <p style="margin:0;font-size:16px;line-height:1.5;">${escMultiline(offer.priceNote)}</p>`
        : '';

  const rows = [
    ['Päivä', offer.serviceDate ? formatIsoDateFi(offer.serviceDate) : null],
    ['Aika', offer.serviceTime],
    ['Mistä', offer.fromAddress],
    ['Minne', offer.toAddress],
  ]
    .filter((r): r is [string, string] => Boolean(r[1]))
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">${esc(label)}</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const closing = isConfirmation
    ? 'Jos jokin tiedoista muuttuu, ilmoitathan meille mahdollisimman pian vastaamalla tähän viestiin tai soittamalla.'
    : `Tarjous on voimassa${offer.validUntil ? ` ${esc(formatIsoDateFi(offer.validUntil))} asti` : ''}. Voit hyväksyä sen vastaamalla tähän viestiin tai soittamalla numeroon ${esc(siteConfig.contact.phone.display)}.`;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(firstName)},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">${intro}</p>

    ${priceBox ? `<div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">${priceBox}</div>` : ''}

    ${message && message.trim() ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#0c4a6e;">${escMultiline(message.trim())}</p>
    </div>` : ''}

    ${rows ? `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rows}</table>` : ''}

    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">${closing}</p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>${esc(siteConfig.brand.name)}</strong></p>
      <p style="margin:0 0 2px;">Y-tunnus: ${esc(siteConfig.businessId)}</p>
      <p style="margin:0 0 2px;">📞 ${esc(siteConfig.contact.phone.display)}</p>
      <p style="margin:0;">✉️ ${esc(siteConfig.contact.email)}</p>
    </div>
  </div>`;
}
