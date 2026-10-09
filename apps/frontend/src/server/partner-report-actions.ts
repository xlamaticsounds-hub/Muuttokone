'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { generatePartnerReport, sendPartnerReport } from '@/server/partner-reports';

// Hallinnan /hallinta/raportit -toiminnot. Palauttavat aina tuloksen (ei heitä), koska
// Next.js piilottaa server actionin virheviestit tuotannossa.

export type ReportActionResult = { success: true; message: string } | { success: false; message: string };

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** "a@x.fi, b@y.fi" -> "a@x.fi, b@y.fi" (siistitty) | null (tyhjä) | false (virheellinen) */
function parseEmailList(raw: string): string | null | false {
  const emails = raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (emails.length === 0) return null;
  return emails.every((e) => EMAIL_RE.test(e)) ? emails.join(', ') : false;
}

export async function savePartnerSettings(
  partner: string,
  values: { reportEmail: string; reportCcEmail: string },
): Promise<ReportActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  const reportEmail = parseEmailList(values.reportEmail);
  const reportCcEmail = parseEmailList(values.reportCcEmail);
  if (reportEmail === false || reportCcEmail === false) {
    return { success: false, message: 'Tarkista sähköpostiosoitteet (useampi pilkulla erotettuna).' };
  }

  try {
    const existing = await prisma.partnerSettings.findUnique({ where: { partner } });
    if (existing) {
      await prisma.partnerSettings.update({ where: { id: existing.id }, data: { reportEmail, reportCcEmail } });
    } else {
      await prisma.partnerSettings.create({ data: { partner, reportEmail, reportCcEmail } });
    }
    await createLog({
      entityType: 'PartnerReport',
      entityId: partner,
      action: 'partner_settings.updated',
      message: `${partner}: raportin vastaanottaja ${reportEmail ?? '-'}, kopio ${reportCcEmail ?? '-'}`,
      actorId: session.user?.email ?? null,
    });
    return { success: true, message: 'Vastaanottajat tallennettu.' };
  } catch (error) {
    console.error('[savePartnerSettings]', error);
    return { success: false, message: 'Tallennus epäonnistui. Yritä uudelleen.' };
  }
}

/** monthInput = "YYYY-MM" (input type="month") */
export async function createPartnerReport(
  partner: string,
  monthInput: string,
  sendPreviewEmail: boolean,
): Promise<ReportActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  const m = /^(\d{4})-(\d{2})$/.exec(monthInput);
  const year = m ? Number(m[1]) : NaN;
  const month = m ? Number(m[2]) : NaN;
  if (!m || month < 1 || month > 12 || year < 2020 || year > 2100) {
    return { success: false, message: 'Valitse kuukausi.' };
  }

  try {
    const { report, preview } = await generatePartnerReport({
      partner,
      year,
      month,
      sendPreviewEmail,
      actor: session.user?.email ?? null,
    });
    const moves = (report.data as { totals?: { count?: number } })?.totals?.count ?? 0;
    const base = `Raportti luotu: ${moves} toteutunutta muuttoa.`;
    if (preview.sent) return { success: true, message: `${base} Esikatselu lähetetty osoitteeseen ${preview.to}.` };
    if (preview.reason === 'not_requested') return { success: true, message: base };
    return { success: true, message: `${base} Esikatselua ei lähetetty: ${preview.message}` };
  } catch (error) {
    console.error('[createPartnerReport]', error);
    return { success: false, message: 'Raportin luonti epäonnistui. Yritä uudelleen.' };
  }
}

export async function approveAndSendPartnerReport(reportId: string, resend = false): Promise<ReportActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu sisään.' };

  try {
    const result = await sendPartnerReport(reportId, session.user?.email ?? null, { allowResend: resend });
    return result.success ? { success: true, message: `Raportti lähetetty osoitteeseen ${result.sentTo}.` } : result;
  } catch (error) {
    console.error('[approveAndSendPartnerReport]', error);
    return { success: false, message: 'Lähetys epäonnistui. Yritä uudelleen.' };
  }
}
