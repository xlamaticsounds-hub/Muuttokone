import type { PartnerReport } from '@prisma/client';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { isSmtpConfigured, sendMail, SMTP_NOT_CONFIGURED_MESSAGE } from '@/server/mailer';
import { helsinkiMonthRange, previousHelsinkiMonth } from '@/lib/helsinki-time';
import { buildPartnerReport, type PartnerReportData } from '@/lib/partner-report';
import {
  partnerReportCsv,
  partnerReportCsvFilename,
  partnerReportSubject,
  renderPartnerReportHtml,
} from '@/lib/partner-report-render';

// Kumppanin kuukausiraportin kulku:
//   1. luonti (ajastettuna kuun 1. päivä edelliselle kuulle, tai käsin hallinnasta mille
//      tahansa kuulle) -> tilannekuva PartnerReport.data, tila DRAFT
//   2. esikatselu sähköpostilla VAIN meille (PartnerSettings.reportCcEmail)
//   3. hyväksyntä hallinnasta -> lähetys kumppanille (reportEmail) + kopio meille, tila SENT
// Kumppanille ei koskaan lähde mitään ilman ihmisen hyväksyntää.

export type ReportActor = string | null; // hallinnan käyttäjän sähköposti, null = ajastin

export function adminReportsUrl(): string {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muuttokone.fi';
  return `${base.replace(/\/$/, '')}/hallinta/raportit`;
}

export function reportData(report: Pick<PartnerReport, 'data'>): PartnerReportData {
  return report.data as unknown as PartnerReportData;
}

export async function getPartnerSettings(partner: string): Promise<{ reportEmail: string | null; reportCcEmail: string | null }> {
  const settings = await prisma.partnerSettings.findUnique({ where: { partner } });
  return { reportEmail: settings?.reportEmail ?? null, reportCcEmail: settings?.reportCcEmail ?? null };
}

/**
 * Kumppanit joilla on alennuskoodeja tai koodilla tehtyjä liidejä (raportti tehdään kullekin
 * erikseen). Liidien varaushetken nimet mukana, jotta koodin kumppanin nimen muutos ei piilota
 * vanhalla nimellä tehtyjä kauppoja raporteista.
 */
export async function listPartners(): Promise<string[]> {
  const [codes, leads] = await Promise.all([
    prisma.discountCode.findMany({ select: { partner: true } }),
    prisma.lead.findMany({ where: { discountPartner: { not: null } }, select: { discountPartner: true } }),
  ]);
  const names = [...codes.map((c) => c.partner), ...leads.map((l) => l.discountPartner)].filter(
    (name): name is string => Boolean(name),
  );
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'fi'));
}

/** Lähetetyt raportit joissa liidi on mukana (palkkio jo laskutettu) — esim. "syyskuu 2026". */
export async function sentReportsContainingLead(leadId: string): Promise<{ partner: string; periodLabel: string }[]> {
  const sent = await prisma.partnerReport.findMany({ where: { status: 'SENT' } });
  return sent
    .map((report) => reportData(report))
    .filter((data) => data.groups?.some((group) => group.rows.some((row) => row.leadId === leadId)))
    .map((data) => ({ partner: data.partner, periodLabel: data.periodLabel }));
}

function csvAttachment(data: PartnerReportData) {
  return {
    filename: partnerReportCsvFilename(data),
    content: Buffer.from(partnerReportCsv(data), 'utf8'),
    contentType: 'text/csv; charset=utf-8',
  };
}

export type PreviewOutcome =
  | { sent: true; to: string }
  | { sent: false; reason: 'not_requested' | 'no_smtp' | 'no_recipient' | 'failed'; message: string };

async function sendPreview(report: PartnerReport, actor: ReportActor): Promise<PreviewOutcome> {
  const data = reportData(report);
  const settings = await getPartnerSettings(report.partner);
  const to = settings.reportCcEmail || process.env.SMTP_USER || null;
  if (!isSmtpConfigured()) return { sent: false, reason: 'no_smtp', message: SMTP_NOT_CONFIGURED_MESSAGE };
  if (!to) return { sent: false, reason: 'no_recipient', message: 'Esikatselun vastaanottajaa (kopio meille) ei ole asetettu.' };

  try {
    await sendMail({
      to,
      subject: partnerReportSubject(data, true),
      html: renderPartnerReportHtml(data, { approveUrl: adminReportsUrl(), recipient: settings.reportEmail }),
      attachments: [csvAttachment(data)],
    });
  } catch (error) {
    console.error('[partner-reports] Esikatselun lähetys epäonnistui', error);
    return { sent: false, reason: 'failed', message: `Esikatselun lähetys epäonnistui: ${error instanceof Error ? error.message : 'tuntematon virhe'}` };
  }

  await prisma.partnerReport.update({ where: { id: report.id }, data: { previewSentAt: new Date(), previewSentTo: to } });
  await createLog({
    entityType: 'PartnerReport',
    entityId: report.id,
    action: 'partner_report.preview_sent',
    message: `Esikatselu ${data.partner} ${data.periodLabel} lähetetty osoitteeseen ${to}`,
    actorId: actor,
  });
  return { sent: true, to };
}

/**
 * Luo (tai luo uudelleen) kumppanin raportin annetulle kuukaudelle. Uudelleenluonti korvaa
 * tilannekuvan ja palauttaa tilan luonnokseksi — myös jo lähetetylle, jos sitä on korjattu.
 */
export async function generatePartnerReport(params: {
  partner: string;
  year: number;
  month: number;
  sendPreviewEmail: boolean;
  actor: ReportActor;
  now?: Date;
}): Promise<{ report: PartnerReport; preview: PreviewOutcome }> {
  const { partner, year, month, sendPreviewEmail, actor, now = new Date() } = params;
  const { start, end } = helsinkiMonthRange(year, month);

  const leads = await prisma.lead.findMany({
    where: {
      status: 'COMPLETED',
      discountCode: { not: null },
      completedAt: { gte: start, lt: end },
      // Varaushetken kumppani; vanhoilla liideillä (ilman sitä) koodin nykyinen kumppani
      OR: [{ discountPartner: partner }, { discountPartner: null, discount: { partner } }],
    },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      discount: { select: { partner: true, office: true, agentName: true, commissionPercent: true } },
    },
  });

  // buildPartnerReport suodattaa vielä itse (status, kumppani, kuukausi) — sama sääntö pätee
  // vaikka kysely palauttaisi liikaa (esim. paikallinen mock-tietokanta).
  const data = buildPartnerReport({ partner, year, month, leads, now });
  const json = JSON.parse(JSON.stringify(data));

  const existing = await prisma.partnerReport.findFirst({ where: { partner, periodYear: year, periodMonth: month } });
  const report = existing
    ? await prisma.partnerReport.update({
        where: { id: existing.id },
        data: { data: json, status: 'DRAFT', previewSentAt: null, previewSentTo: null },
      })
    : await prisma.partnerReport.create({
        data: { partner, periodYear: year, periodMonth: month, data: json, status: 'DRAFT' },
      });

  await createLog({
    entityType: 'PartnerReport',
    entityId: report.id,
    action: existing ? 'partner_report.regenerated' : 'partner_report.generated',
    message: `${partner} ${data.periodLabel}: ${data.totals.count} muuttoa, palkkio ${data.totals.commission} €`,
    data: { totals: data.totals, previousStatus: existing?.status ?? null },
    actorId: actor,
  });

  const preview: PreviewOutcome = sendPreviewEmail
    ? await sendPreview(report, actor)
    : { sent: false, reason: 'not_requested', message: 'Esikatselua ei pyydetty.' };
  const fresh = (await prisma.partnerReport.findUnique({ where: { id: report.id } })) ?? report;
  return { report: fresh, preview };
}

// Käynnissä olevat lähetykset (yksi palvelininstanssi Railwayssa): tuplaklikkaus tai kaksi
// samanaikaista hyväksyjää ei lähetä raporttia kumppanille kahdesti.
const sendingReports = new Set<string>();

/**
 * Hyväksytty raportti kumppanille + kopio meille. Vain hallinnasta, ei koskaan ajastimesta.
 * Jo lähetetty raportti lähetetään uudelleen vain kun sitä erikseen pyydetään (allowResend).
 */
export async function sendPartnerReport(
  reportId: string,
  actor: ReportActor,
  options: { allowResend?: boolean } = {},
): Promise<{ success: true; sentTo: string } | { success: false; message: string }> {
  if (sendingReports.has(reportId)) return { success: false, message: 'Lähetys on jo käynnissä.' };
  sendingReports.add(reportId);
  try {
    return await sendPartnerReportInner(reportId, actor, options.allowResend === true);
  } finally {
    sendingReports.delete(reportId);
  }
}

async function sendPartnerReportInner(
  reportId: string,
  actor: ReportActor,
  allowResend: boolean,
): Promise<{ success: true; sentTo: string } | { success: false; message: string }> {
  const report = await prisma.partnerReport.findUnique({ where: { id: reportId } });
  if (!report) return { success: false, message: 'Raporttia ei löytynyt.' };
  if (report.status === 'SENT' && !allowResend) {
    return { success: false, message: 'Raportti on jo lähetetty. Käytä "Lähetä uudelleen", jos haluat lähettää sen uudestaan.' };
  }

  const settings = await getPartnerSettings(report.partner);
  if (!settings.reportEmail) {
    return { success: false, message: `Aseta ensin ${report.partner}n sähköpostiosoite (Vastaanottajat).` };
  }
  if (!isSmtpConfigured()) return { success: false, message: SMTP_NOT_CONFIGURED_MESSAGE };

  const data = reportData(report);
  try {
    await sendMail({
      to: settings.reportEmail,
      cc: settings.reportCcEmail ?? undefined,
      subject: partnerReportSubject(data, false),
      html: renderPartnerReportHtml(data, null),
      attachments: [csvAttachment(data)],
    });
  } catch (error) {
    console.error('[partner-reports] Raportin lähetys epäonnistui', error);
    return { success: false, message: `Lähetys epäonnistui: ${error instanceof Error ? error.message : 'tuntematon virhe'}` };
  }

  const sentAt = new Date();
  await prisma.partnerReport.update({
    where: { id: report.id },
    data: {
      status: 'SENT',
      sentAt,
      sentTo: settings.reportEmail,
      sentCc: settings.reportCcEmail,
      approvedBy: actor,
    },
  });
  // Merkitään raportin muutot laskutetuiksi (tuplapalkkion esto, ks. lead-completion-actions.ts)
  for (const leadId of data.groups.flatMap((group) => group.rows.map((row) => row.leadId))) {
    await prisma.lead.update({ where: { id: leadId }, data: { partnerReportedAt: sentAt, partnerReportId: report.id } });
  }
  await createLog({
    entityType: 'PartnerReport',
    entityId: report.id,
    action: 'partner_report.sent',
    message: `Raportti ${data.partner} ${data.periodLabel} hyväksytty ja lähetetty osoitteeseen ${settings.reportEmail}${settings.reportCcEmail ? ` (kopio ${settings.reportCcEmail})` : ''}`,
    data: { totals: data.totals },
    actorId: actor,
  });
  return { success: true, sentTo: settings.reportEmail };
}

/**
 * Ajastettu kuukausiajo (kuun 1. päivä): edellinen kalenterikuukausi Suomen aikaa, jokaiselle
 * kumppanille. Jo olemassa olevaa raporttia ei luoda uudelleen (ajastimen uusintayritys ei
 * lähetä esikatselua kahdesti) — käsin uudelleenluonti tehdään hallinnasta.
 */
export async function runMonthlyPartnerReports(now: Date = new Date()) {
  const { year, month } = previousHelsinkiMonth(now);
  const results: { partner: string; status: 'created' | 'exists'; moves?: number; preview?: PreviewOutcome }[] = [];
  for (const partner of await listPartners()) {
    const existing = await prisma.partnerReport.findFirst({ where: { partner, periodYear: year, periodMonth: month } });
    if (existing) {
      results.push({ partner, status: 'exists' });
      continue;
    }
    const { report, preview } = await generatePartnerReport({ partner, year, month, sendPreviewEmail: true, actor: null, now });
    results.push({ partner, status: 'created', moves: reportData(report).totals.count, preview });
  }
  return { year, month, results };
}
