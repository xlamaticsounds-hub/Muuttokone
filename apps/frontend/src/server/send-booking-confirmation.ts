'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import {
  getInventoryEntries,
  getWasteTypeLabels,
  getExtraServices,
  getServiceLabel,
  getPackageLabel,
  getStoredPrice,
  parseLeadFormData,
  type InventoryEntry,
} from '@/server/lead-format';

// Sama HTML-pako kuin send-quote.ts/send-receipt.ts:ssä.
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

function renderItemRows(items: InventoryEntry[]): string {
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

function renderBookingConfirmationHtml(params: {
  contactName: string;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: Date | null;
  serviceLabel: string;
  packageLabel: string | null;
  priceConfirmed: string | null;
  priceLow: number | null;
  priceHigh: number | null;
  priceExact: number | null;
  items: InventoryEntry[];
  wasteTypes: string[];
  extras: string[];
}): string {
  const {
    contactName, fromAddress, toAddress, requestedDate, serviceLabel, packageLabel,
    priceConfirmed, priceLow, priceHigh, priceExact, items, wasteTypes, extras,
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
    </div>

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

export type SendBookingConfirmationResult = { success: true; sentTo: string } | { success: false; message: string };

/**
 * Lähettää varausvahvistuksen liidin yhteystiedon sähköpostiin. Kutsutaan käsin liidin
 * sivulta ("Lähetä varausvahvistus" -painike, kuitti-linkin vieressä) sen jälkeen kun
 * varaus on sovittu asiakkaan kanssa — ei koskaan automaattisesti.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia), samasta syystä kuin send-quote.ts:ssä.
 */
export async function sendBookingConfirmationEmail(leadId: string): Promise<SendBookingConfirmationResult> {
  try {
    return await sendBookingConfirmationEmailInner(leadId);
  } catch (err) {
    console.error('sendBookingConfirmationEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe varausvahvistuksen lähetyksessä.',
    };
  }
}

async function sendBookingConfirmationEmailInner(leadId: string): Promise<SendBookingConfirmationResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi varausvahvistuksen.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    return { success: false, message: 'Liidiä ei löytynyt.' };
  }
  if (!lead.contact.email) {
    return { success: false, message: 'Tällä liidillä ei ole sähköpostiosoitetta — ei voida lähettää varausvahvistusta sähköpostitse.' };
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: priceConfirmed, exact: priceExact, low: priceLow, high: priceHigh } = getStoredPrice(pfd);
  const items = getInventoryEntries(pfd);
  const wasteTypes = getWasteTypeLabels(pfd);
  const extras = getExtraServices(pfd);
  const serviceLabel = getServiceLabel(pfd) ?? 'Muutto';
  const packageLabel = getPackageLabel(pfd);
  const contactName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ');

  const html = renderBookingConfirmationHtml({
    contactName,
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    requestedDate: lead.requestedDate,
    serviceLabel,
    packageLabel,
    priceConfirmed,
    priceLow,
    priceHigh,
    priceExact,
    items,
    wasteTypes,
    extras,
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
      to: lead.contact.email,
      subject: `Varausvahvistus — Muuttokone.fi${lead.requestedDate ? ` (${formatDateFi(lead.requestedDate)})` : ''}`,
      html,
    });
  } catch (err) {
    console.error('sendBookingConfirmationEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.booking_confirmation_sent',
    message: `Varausvahvistus lähetetty sähköpostitse osoitteeseen ${lead.contact.email}`,
    data: { email: lead.contact.email, priceConfirmed, priceLow, priceHigh, priceExact },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: lead.contact.email };
}
