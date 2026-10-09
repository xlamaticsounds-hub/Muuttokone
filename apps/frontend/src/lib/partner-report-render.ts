import { normalizeDiscountCode } from '@/features/calculator/discount';
import { formatEuro } from '@/lib/format';
import type { PartnerReportData, PartnerReportRow } from '@/lib/partner-report';

// Kumppaniraportin sähköposti (HTML) ja CSV-liite. Sisältää vain laskutukseen tarvittavat
// tiedot: päivät, koodi, nimikirjaimet, hinnat ja palkkio — ei yhteystietoja eikä osoitteita.

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** "2026-10-07" -> "7.10.2026" */
export function formatDateInputFi(dateInput: string | null): string {
  if (!dateInput) return '–';
  const [y, m, d] = dateInput.split('-').map(Number);
  return `${d}.${m}.${y}`;
}

const euro = (value: number) => `${formatEuro(value)} €`;
const percent = (value: number) => `${value.toLocaleString('fi-FI', { maximumFractionDigits: 2 })} %`;

export function partnerReportSubject(report: PartnerReportData, preview: boolean): string {
  const base = `Muuttokone.fi – välityspalkkioraportti ${report.periodLabel} (${report.partner})`;
  return preview ? `[Esikatselu – ei lähetetty] ${base}` : base;
}

export function partnerReportCsvFilename(report: PartnerReportData): string {
  const partnerSlug = normalizeDiscountCode(report.partner).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `muuttokone-valityspalkkio-${partnerSlug}-${report.year}-${String(report.month).padStart(2, '0')}.csv`;
}

const TH = 'padding:8px 4px;text-align:left;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;';
const TD = 'padding:8px 4px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;';
const NUM = 'text-align:right;white-space:nowrap;';

function rowHtml(row: PartnerReportRow): string {
  const codeDetails = [row.office, row.agentName].filter(Boolean).join(' / ');
  return `
      <tr>
        <td style="${TD}white-space:nowrap;">${esc(formatDateInputFi(row.moveDate))}</td>
        <td style="${TD}">${esc(row.code)}${codeDetails ? `<br /><span style="color:#6b7280;font-size:12px;">${esc(codeDetails)}</span>` : ''}</td>
        <td style="${TD}">${esc(row.initials)}</td>
        <td style="${TD}${NUM}">${esc(euro(row.finalPriceNet))}</td>
        <td style="${TD}${NUM}">${esc(euro(row.finalPriceGross))}</td>
        <td style="${TD}${NUM}font-weight:600;">${esc(euro(row.commissionAmount))}</td>
      </tr>`;
}

export function renderPartnerReportHtml(
  report: PartnerReportData,
  preview?: { approveUrl: string; recipient: string | null } | null,
): string {
  const { totals } = report;
  const commissionPercents = [...new Set(report.groups.flatMap((g) => g.rows.map((r) => r.commissionPercent)))];
  const commissionText =
    commissionPercents.length === 1
      ? `Palkkio on ${percent(commissionPercents[0])} lopullisesta hinnasta ilman arvonlisäveroa (alv 0 %).`
      : 'Palkkio on laskettu kunkin koodin palkkioprosentilla lopullisesta hinnasta ilman arvonlisäveroa (alv 0 %).';

  const previewBox = preview
    ? `
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px;margin-bottom:24px;font-size:14px;line-height:1.5;color:#78350f;">
      <strong>Esikatselu — tätä ei ole lähetetty ${esc(report.partner)}lle.</strong><br />
      Tarkista raportti ja hyväksy lähetys hallintapaneelissa:<br />
      <a href="${esc(preview.approveUrl)}" style="color:#1d4ed8;">${esc(preview.approveUrl)}</a><br />
      Vastaanottaja hyväksynnän jälkeen: ${preview.recipient ? esc(preview.recipient) : '<strong>ei vielä asetettu</strong>'}
    </div>`
    : '';

  const body =
    totals.count === 0
      ? `<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Ei toteutuneita muuttoja tällä jaksolla (${esc(report.periodLabel)}), joten palkkiota ei kerry.</p>`
      : `
    <div style="overflow-x:auto;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="${TH}">Muuttopäivä</th>
          <th style="${TH}">Koodi</th>
          <th style="${TH}">Asiakas</th>
          <th style="${TH}${NUM}">Hinta alv 0 %</th>
          <th style="${TH}${NUM}">Hinta sis. alv</th>
          <th style="${TH}${NUM}">Palkkio</th>
        </tr>
      </thead>
      <tbody>
        ${report.groups
          .map(
            (group) => `
        ${report.grouped ? `<tr><td colspan="6" style="padding:14px 6px 6px;font-size:13px;font-weight:700;color:#111827;">${esc(group.label)}</td></tr>` : ''}
        ${group.rows.map(rowHtml).join('')}
        ${
          report.grouped
            ? `<tr>
          <td colspan="3" style="${TD}color:#6b7280;">Välisumma (${group.totals.count} kpl)</td>
          <td style="${TD}${NUM}color:#6b7280;">${esc(euro(group.totals.salesNet))}</td>
          <td style="${TD}${NUM}color:#6b7280;">${esc(euro(group.totals.salesGross))}</td>
          <td style="${TD}${NUM}color:#6b7280;font-weight:600;">${esc(euro(group.totals.commission))}</td>
        </tr>`
            : ''
        }`,
          )
          .join('')}
      </tbody>
    </table>
    </div>

    <div style="background:#111827;color:#ffffff;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;">Yhteenveto ${esc(report.periodLabel)}</p>
      <p style="margin:0 0 4px;font-size:15px;">Muuttoja: <strong>${totals.count}</strong></p>
      <p style="margin:0 0 4px;font-size:15px;">Kokonaismyynti: <strong>${esc(euro(totals.salesNet))}</strong> alv 0 % (${esc(euro(totals.salesGross))} sis. alv)</p>
      <p style="margin:0;font-size:18px;">Välityspalkkio yhteensä: <strong>${esc(euro(totals.commission))}</strong> (alv 0 %)</p>
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 8px;">${esc(commissionText)} Samat tiedot ovat liitteenä CSV-tiedostona (avautuu Excelissä).</p>`;

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;padding:32px 16px;color:#111827;">
    ${previewBox}
    <p style="font-size:13px;margin:0 0 4px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">${esc(report.partner)} · ${esc(report.periodLabel)}</p>
    <h1 style="font-size:22px;margin:0 0 8px;">Välityspalkkioraportti</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hei, alla ${esc(report.partner)}n alennuskoodilla tehdyt muutot, jotka toteutuivat jaksolla ${esc(report.periodLabel)}.
    </p>
    ${body}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
      <p style="margin:0 0 4px;"><strong>Muuttokone.fi</strong></p>
      <p style="margin:0 0 2px;">📞 +358 45 847 0755</p>
      <p style="margin:0;">✉️ info@muuttokone.fi</p>
    </div>
  </div>`;
}

const csvNumber = (value: number) => value.toFixed(2).replace('.', ',');
const csvPercent = (value: number) => String(value).replace('.', ',');
function csvField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Puolipisteerotin + desimaalipilkku + BOM: aukeaa suomenkielisessä Excelissä suoraan oikein. */
export function partnerReportCsv(report: PartnerReportData): string {
  const header = [
    'Muuttopäivä',
    'Kirjattu toteutuneeksi',
    'Koodi',
    'Toimipaikka',
    'Välittäjä',
    'Asiakas',
    'Lopullinen hinta alv 0 % (€)',
    'Lopullinen hinta sis. alv (€)',
    'Palkkio %',
    'Välityspalkkio alv 0 % (€)',
  ];
  const rows = report.groups.flatMap((group) => group.rows);
  const lines = [
    header,
    ...rows.map((row) => [
      formatDateInputFi(row.moveDate),
      formatDateInputFi(row.completedDate),
      row.code,
      row.office ?? '',
      row.agentName ?? '',
      row.initials,
      csvNumber(row.finalPriceNet),
      csvNumber(row.finalPriceGross),
      csvPercent(row.commissionPercent),
      csvNumber(row.commissionAmount),
    ]),
    [],
    [
      `Yhteensä ${report.periodLabel}`,
      '',
      '',
      '',
      '',
      `${report.totals.count} muuttoa`,
      csvNumber(report.totals.salesNet),
      csvNumber(report.totals.salesGross),
      '',
      csvNumber(report.totals.commission),
    ],
  ];
  return '﻿' + lines.map((line) => line.map((v) => csvField(String(v))).join(';')).join('\r\n') + '\r\n';
}
