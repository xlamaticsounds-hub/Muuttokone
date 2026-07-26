'use server';

import { getServerSession } from 'next-auth';
import { LeadStatus } from '@prisma/client';
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

// Kevyt HTML-pako sähköpostiin upotettavalle tekstille (asiakkaan syöttämä nimi/osoite jne.
// päätyy suoraan HTML-merkkijonoon, joten se on paettava samalla tavalla kuin React tekisi
// automaattisesti JSX:ssä — täällä ei ole sitä turvaverkkoa koska kyse on raakaa HTML-merkkijonoa).
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

function renderQuoteEmailHtml(params: {
  contactName: string;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDate: Date | null;
  serviceLabel: string;
  packageLabel: string | null;
  priceConfirmed: number | null;
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

  // Vahvistettu (kiinteä) hinta ohittaa aina laskurin nettisivulla näyttämän arvion —
  // ks. server/actions.ts:updateLeadDetails ja lead-format.ts:getStoredPrice.
  const isFixedPrice = priceConfirmed !== null;
  const priceHtml = isFixedPrice
    ? `${priceConfirmed} €`
    : priceLow !== null && priceHigh !== null
      ? `${priceLow}–${priceHigh} €`
      : priceExact !== null
        ? `${priceExact} €`
        : 'Tarkennetaan puhelimitse';
  const priceLabel = isFixedPrice ? 'Tarjoushinta' : 'Arvioitu hinta';
  const priceSubtext = isFixedPrice
    ? 'sis. ALV — kiinteä tarjous'
    : 'sis. ALV — lopullinen hinta vahvistetaan yhdessä kanssasi';

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#111827;">
    <p style="font-size:16px;margin:0 0 4px;">Hei ${esc(contactName || '')},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Kiitos yhteydenotostasi! Tässä on ${esc(serviceLabel).toLowerCase()}si ${isFixedPrice ? 'tarjous' : 'hinta-arvio'} Muuttokoneelta.
    </p>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">${esc(priceLabel)}</p>
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
        <td style="padding:6px 0;color:#6b7280;font-size:13px;text-transform:uppercase;">Ajankohta</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;text-align:right;">${esc(formatDateFi(requestedDate))}</td>
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
      Jos tiedoissa on jotain korjattavaa tai haluat vahvistaa varauksen, vastaa tähän viestiin tai soita meille — autamme mielellämme.
    </p>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>Muuttokone.fi</strong></p>
      <p style="margin:0 0 2px;">📞 +358 45 847 0755</p>
      <p style="margin:0;">✉️ info@muuttokone.fi</p>
    </div>
  </div>`;
}

export type SendQuoteResult = { success: true; sentTo: string } | { success: false; message: string };

/**
 * Lähettää tarjouksen liidin yhteystiedon sähköpostiin ja merkitsee liidin tilaan
 * PROPOSAL_SENT. Kutsutaan vasta kun ihminen on itse tarkistanut liidin hallintapaneelista
 * ja painanut "Lähetä tarjous" — ei koskaan automaattisesti varauksen yhteydessä.
 *
 * Palauttaa aina tuloksen (ei heitä poikkeuksia) — Next.js piilottaa Server Actionin
 * throw-virheiden viestin tuotannossa turvallisuussyistä ("An error occurred in the
 * Server Components render..."), jolloin käyttäjä ei koskaan näe mitä oikeasti meni
 * pieleen. Oikea virhe kirjataan aina palvelimen lokiin (console.error) debuggausta varten.
 */
export async function sendQuoteEmail(leadId: string): Promise<SendQuoteResult> {
  try {
    return await sendQuoteEmailInner(leadId);
  } catch (err) {
    // Viimeinen turvaverkko: mikä tahansa odottamaton virhe (esim. tietokantayhteys poikki)
    // kirjataan lokiin mutta EI heitetä eteenpäin — throw täältä näkyisi asiakkaalle vain
    // Next.js:n yleisenä "An error occurred in the Server Components render" -viestinä.
    console.error('sendQuoteEmail: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe tarjouksen lähetyksessä.',
    };
  }
}

async function sendQuoteEmailInner(leadId: string): Promise<SendQuoteResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: 'Kirjaudu sisään lähettääksesi tarjouksen.' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, message: 'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.' };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    return { success: false, message: 'Liidiä ei löytynyt.' };
  }
  if (!lead.contact.email) {
    return { success: false, message: 'Tällä liidillä ei ole sähköpostiosoitetta — ei voida lähettää tarjousta sähköpostitse.' };
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: priceConfirmed, exact: priceExact, low: priceLow, high: priceHigh } = getStoredPrice(pfd);
  const items = getInventoryEntries(pfd);
  const wasteTypes = getWasteTypeLabels(pfd);
  const extras = getExtraServices(pfd);
  const serviceLabel = getServiceLabel(pfd) ?? 'Muutto';
  const packageLabel = getPackageLabel(pfd);
  const contactName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ');

  const html = renderQuoteEmailHtml({
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

  const subjectPrice =
    priceConfirmed !== null
      ? ` — ${priceConfirmed} €`
      : priceLow !== null && priceHigh !== null
        ? ` — ${priceLow}–${priceHigh} €`
        : '';
  const senderName = process.env.QUOTE_EMAIL_FROM_NAME || 'Muuttokone.fi';

  // Ladataan nodemailer vasta täällä (ei moduulin huipulla) jotta puuttuvat SMTP-asetukset
  // eivät kaada koko sovellusta buildissa/importissa — vain tätä toimintoa kutsuttaessa.
  // Lähetetään suoraan tarjous@muuttokone.fi -postilaatikon kautta (Zoner SMTP), ei kolmannen
  // osapuolen palvelun kautta — ei vaadi erillistä domain-vahvistusta koska osoite on jo oma.
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
      subject: `Tarjouksesi Muuttokone.fi:ltä${subjectPrice}`,
      html,
    });
  } catch (err) {
    console.error('sendQuoteEmail: SMTP send failed', err);
    return {
      success: false,
      message: `Sähköpostin lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`,
    };
  }

  await prisma.lead.update({ where: { id: leadId }, data: { status: LeadStatus.PROPOSAL_SENT } });

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.quote_sent',
    message: `Tarjous lähetetty sähköpostitse osoitteeseen ${lead.contact.email}`,
    data: { email: lead.contact.email, priceConfirmed, priceLow, priceHigh, priceExact },
    actorId: session.user?.email ?? null,
  });

  return { success: true, sentTo: lead.contact.email };
}
