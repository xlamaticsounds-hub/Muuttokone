import { renderPartnerDiscountNote, type QuoteEmailParams } from '@/lib/quote-email';

// Sama HTML-pako kuin quote-email.ts:ssä.
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

function renderItemRows(items: QuoteEmailParams['items']): string {
  if (items.length === 0) return '';
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;">${esc(item.icon)} ${esc(item.label)}</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;font-weight:600;">× ${esc(item.qty)}</td>
        </tr>`,
    )
    .join('');
}

// Sama data kuin tarjouksessa (getQuoteEmailPreviewData palauttaa sen myös esikatselulle).
export type BookingConfirmationEmailParams = QuoteEmailParams;

export function bookingConfirmationSubject(requestedDate: Date | null): string {
  return `Varausvahvistus — Muuttokone.fi${requestedDate ? ` (${formatDateFi(requestedDate)})` : ''}`;
}

export function renderBookingConfirmationHtml(params: BookingConfirmationEmailParams): string {
  const {
    contactName, fromAddress, toAddress, requestedDate, serviceLabel, packageLabel,
    priceConfirmed, priceLow, priceHigh, priceExact, items, wasteTypes, extras, customMessage,
  } = params;

  const isFixedPrice = priceConfirmed !== null;
  const priceHtml = isFixedPrice
    ? `${priceConfirmed} €`
    : priceLow !== null && priceHigh !== null
      ? `${priceLow}–${priceHigh} €`
      : priceExact !== null
        ? `${priceExact} €`
        : 'Tarkennetaan puhelimitse';
  const priceSubtext = isFixedPrice
    ? 'sis. ALV — sovittu hinta'
    : 'sis. ALV — lopullinen hinta vahvistetaan yhdessä kanssasi';

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(contactName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Varauksesi on vahvistettu! Tässä yhteenveto ${esc(serviceLabel).toLowerCase()}stasi Muuttokoneelta.
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Hinta</p>
      <p style="margin:0;font-size:32px;font-weight:800;">${priceHtml}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">${esc(priceSubtext)}</p>
      ${renderPartnerDiscountNote(params.partnerDiscountNote)}
    </div>

    ${customMessage && customMessage.trim() ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#0c4a6e;">${escMultiline(customMessage.trim())}</p>
    </div>` : ''}

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Mistä</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(fromAddress || '-')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Minne</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(toAddress || '-')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Muuttopäivä</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;font-weight:600;">${esc(formatDateFi(requestedDate))}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Palvelu</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc([serviceLabel, packageLabel].filter(Boolean).join(' · '))}</td>
      </tr>
    </table>

    ${items.length > 0 ? `
    <p style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;margin:24px 0 8px;">Ilmoittamasi tavarat</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;">
      ${renderItemRows(items)}
    </table>` : ''}

    ${wasteTypes.length > 0 ? `<p style="font-size:14px;color:#374151;margin:16px 0 0;"><strong>Jätetyypit:</strong> ${esc(wasteTypes.join(', '))}</p>` : ''}
    ${extras.length > 0 ? `<p style="font-size:14px;color:#374151;margin:8px 0 0;"><strong>Lisäpalvelut:</strong> ${esc(extras.join(', '))}</p>` : ''}

    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">
      Nähdään muuttopäivänä! Jos jokin osoitteista, ajankohdasta tai muusta tiedosta vielä muuttuu,
      ilmoitathan meille mahdollisimman pian vastaamalla tähän viestiin tai soittamalla.
    </p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>Muuttokone.fi</strong></p>
      <p style="margin:0 0 2px;">📞 +358 45 847 0755</p>
      <p style="margin:0;">✉️ info@muuttokone.fi</p>
    </div>
  </div>`;
}
