import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    leads: [] as Record<string, any>[],
    reports: [] as Record<string, any>[],
    settings: [] as Record<string, any>[],
    codes: [{ partner: 'Kiinteistömaailma' }] as Record<string, any>[],
    logs: [] as Record<string, any>[],
    smtp: true,
  };
  const prisma = {
    lead: {
      findMany: vi.fn(async () => state.leads),
      update: vi.fn(async ({ where, data }: any) => {
        const lead = state.leads.find((l) => l.id === where.id)!;
        Object.assign(lead, data);
        return lead;
      }),
    },
    discountCode: { findMany: vi.fn(async () => state.codes) },
    partnerSettings: { findUnique: vi.fn(async ({ where }: any) => state.settings.find((s) => s.partner === where.partner) ?? null) },
    partnerReport: {
      findFirst: vi.fn(async ({ where }: any) =>
        state.reports.find((r) => r.partner === where.partner && r.periodYear === where.periodYear && r.periodMonth === where.periodMonth) ?? null,
      ),
      findUnique: vi.fn(async ({ where }: any) => state.reports.find((r) => r.id === where.id) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `rep_${state.reports.length + 1}`, previewSentAt: null, sentAt: null, ...data };
        state.reports.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const row = state.reports.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      }),
    },
    log: { create: vi.fn(async ({ data }: any) => (state.logs.push(data), data)) },
  };
  const sendMail = vi.fn(async (_mail: any) => {});
  return { state, prisma, sendMail };
});

vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/mailer', () => ({
  isSmtpConfigured: () => mocks.state.smtp,
  sendMail: mocks.sendMail,
  SMTP_NOT_CONFIGURED_MESSAGE: 'SMTP puuttuu',
}));

const { generatePartnerReport, sendPartnerReport, runMonthlyPartnerReports, reportData } = await import('./partner-reports');
const { POST: cronPost } = await import('@/app/api/cron/partner-report/route');

const completedLead = {
  id: 'lead_1',
  status: 'COMPLETED',
  completedAt: new Date('2026-10-15T12:00:00Z'),
  requestedDate: new Date('2026-10-14T00:00:00Z'),
  finalPrice: 1000,
  discountCode: 'KIINTEISTOMAAILMA',
  commissionPercent: 5,
  contact: { firstName: 'Matti', lastName: 'Meikäläinen' },
  discount: { partner: 'Kiinteistömaailma', office: null, agentName: null, commissionPercent: 5 },
};

beforeEach(() => {
  mocks.state.leads = [completedLead, { ...completedLead, id: 'lead_2', status: 'CANCELLED' }];
  mocks.state.reports = [];
  mocks.state.logs = [];
  mocks.state.smtp = true;
  mocks.state.settings = [{ partner: 'Kiinteistömaailma', reportEmail: 'laskutus@km.example', reportCcEmail: 'info@muuttokone.example' }];
  mocks.sendMail.mockClear();
});

describe('generatePartnerReport', () => {
  it('tallentaa tilannekuvan ja lähettää esikatselun VAIN meille', async () => {
    const { report, preview } = await generatePartnerReport({
      partner: 'Kiinteistömaailma',
      year: 2026,
      month: 10,
      sendPreviewEmail: true,
      actor: 'admin@example.com',
    });
    expect(report.status).toBe('DRAFT');
    expect(reportData(report).totals).toEqual({ count: 1, salesGross: 1000, salesNet: 796.81, commission: 39.84 });
    expect(preview).toEqual({ sent: true, to: 'info@muuttokone.example' });

    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toBe('info@muuttokone.example');
    expect(mail.cc).toBeUndefined();
    expect(mail.to).not.toContain('km.example'); // ei kumppanin osoitteeseen
    expect(mail.subject).toMatch(/^\[Esikatselu/);
    expect(mail.attachments[0].filename).toBe('muuttokone-valityspalkkio-kiinteistomaailma-2026-10.csv');
    expect(report.previewSentTo).toBe('info@muuttokone.example');
  });

  it('uudelleenluonti korvaa saman kuukauden raportin', async () => {
    await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    mocks.state.leads = [];
    await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    expect(mocks.state.reports).toHaveLength(1);
    expect(mocks.state.reports[0].data.totals.count).toBe(0);
    expect(mocks.state.logs.map((l) => l.action)).toEqual(['partner_report.generated', 'partner_report.regenerated']);
  });

  it('ilman SMTP:tä raportti luodaan silti, esikatselu ohitetaan selkeällä syyllä', async () => {
    mocks.state.smtp = false;
    const { report, preview } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: true, actor: null });
    expect(report.status).toBe('DRAFT');
    expect(preview).toMatchObject({ sent: false, reason: 'no_smtp' });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});

describe('sendPartnerReport: ei tuplalähetystä', () => {
  it('merkitsee raportin muutot laskutetuiksi', async () => {
    const { report } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    await sendPartnerReport(report.id, 'admin@example.com');
    const lead = mocks.state.leads.find((l) => l.id === 'lead_1')!;
    expect(lead.partnerReportedAt).toBeInstanceOf(Date);
    expect(lead.partnerReportId).toBe(report.id);
    expect(mocks.state.leads.find((l) => l.id === 'lead_2')!.partnerReportedAt).toBeUndefined(); // peruttu ei raportissa
  });

  it('jo lähetettyä ei lähetetä uudelleen ilman erillistä pyyntöä', async () => {
    const { report } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    await sendPartnerReport(report.id, 'admin@example.com');
    const again = await sendPartnerReport(report.id, 'admin@example.com');
    expect(again.success).toBe(false);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect((await sendPartnerReport(report.id, 'admin@example.com', { allowResend: true })).success).toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it('tuplaklikkaus / kaksi hyväksyjää yhtä aikaa: vain yksi lähetys', async () => {
    const { report } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    const [a, b] = await Promise.all([sendPartnerReport(report.id, 'a@example.com'), sendPartnerReport(report.id, 'b@example.com')]);
    expect([a.success, b.success].sort()).toEqual([false, true]);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });
});

describe('sendPartnerReport (hyväksyntä)', () => {
  it('lähettää kumppanille kopiolla meille ja merkitsee lähetetyksi', async () => {
    const { report } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    const result = await sendPartnerReport(report.id, 'admin@example.com');
    expect(result).toEqual({ success: true, sentTo: 'laskutus@km.example' });
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail).toMatchObject({ to: 'laskutus@km.example', cc: 'info@muuttokone.example' });
    expect(mail.subject).not.toContain('Esikatselu');
    expect(mail.html).not.toContain('Esikatselu');
    expect(mocks.state.reports[0]).toMatchObject({ status: 'SENT', sentTo: 'laskutus@km.example', approvedBy: 'admin@example.com' });
  });

  it('ei lähetä ilman kumppanin osoitetta', async () => {
    mocks.state.settings = [{ partner: 'Kiinteistömaailma', reportEmail: null, reportCcEmail: 'info@muuttokone.example' }];
    const { report } = await generatePartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, sendPreviewEmail: false, actor: null });
    const result = await sendPartnerReport(report.id, 'admin@example.com');
    expect(result.success).toBe(false);
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.state.reports[0].status).toBe('DRAFT');
  });
});

describe('runMonthlyPartnerReports + cron-reitti', () => {
  it('kuun 1. päivänä edellinen kuukausi Suomen aikaa, ei kahta esikatselua samalle kuulle', async () => {
    const now = new Date('2026-11-01T06:00:00Z');
    const first = await runMonthlyPartnerReports(now);
    expect(first).toMatchObject({ year: 2026, month: 10, results: [{ partner: 'Kiinteistömaailma', status: 'created', moves: 1 }] });
    const again = await runMonthlyPartnerReports(now);
    expect(again.results[0].status).toBe('exists');
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail.mock.calls[0][0].to).toBe('info@muuttokone.example');
  });

  it('cron-reitti vaatii CRON_SECRETin', async () => {
    process.env.CRON_SECRET = 'testisalaisuus';
    const unauthorized = await cronPost(new NextRequest('http://localhost/api/cron/partner-report', { method: 'POST' }));
    expect(unauthorized.status).toBe(401);
    const ok = await cronPost(
      new NextRequest('http://localhost/api/cron/partner-report', { method: 'POST', headers: { authorization: 'Bearer testisalaisuus' } }),
    );
    expect(ok.status).toBe(200);
  });
});
