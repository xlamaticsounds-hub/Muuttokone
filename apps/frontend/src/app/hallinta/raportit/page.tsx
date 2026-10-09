import Link from 'next/link';
import { prisma } from '@/server/db';
import { listPartners, reportData } from '@/server/partner-reports';
import { previousHelsinkiMonth, toHelsinkiDateInput } from '@/lib/helsinki-time';
import { partnerReportCsv, partnerReportCsvFilename, renderPartnerReportHtml } from '@/lib/partner-report-render';
import { buildCodeActivity, codeActivityCsv, codeActivityCsvFilename } from '@/lib/code-activity';
import ReportsClient, { type ReportRow, type PartnerSettingsRow } from './ReportsClient';
import DiscountCodesClient, { type DiscountCodeRow } from './DiscountCodesClient';
import CodeActivityClient, { type CodeOption } from './CodeActivityClient';

export const dynamic = 'force-dynamic';

// Kumppanit yhdessä paikassa: kuukausiraportit, alennuskoodien hallinta (lisäys, muokkaus,
// käytöstä poisto) ja yksittäisen koodin tapahtumat. Välilehti URL:ssa (?nakyma=...), jotta
// esim. koodikortin "Näytä tapahtumat" -linkki ja selaimen takaisin-painike toimivat.
const TABS = [
  { key: 'kuukausi', label: 'Kuukausiraportit', short: 'Raportit' },
  { key: 'koodit', label: 'Alennuskoodit', short: 'Koodit' },
  { key: 'tapahtumat', label: 'Koodin tapahtumat', short: 'Tapahtumat' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

// Välittäjille jaettava linkki osoittaa aina tuotantosivustolle, vaikka hallintaa käytettäisiin
// paikallisesti (NEXT_PUBLIC_BASE_URL on kehityksessä http://localhost).
function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  return (configured?.startsWith('https://') ? configured : 'https://www.muuttokone.fi').replace(/\/$/, '');
}

async function loadMonthlyReports() {
  const [codePartners, settings, rows] = await Promise.all([
    listPartners(),
    prisma.partnerSettings.findMany(),
    prisma.partnerReport.findMany({ orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }] }),
  ]);
  const names = [...new Set([...codePartners, ...settings.map((s) => s.partner)])];
  const partners: PartnerSettingsRow[] = names.map((partner) => {
    const s = settings.find((x) => x.partner === partner);
    return { partner, reportEmail: s?.reportEmail ?? '', reportCcEmail: s?.reportCcEmail ?? '' };
  });
  const reports: ReportRow[] = rows.map((report) => {
    const data = reportData(report);
    return {
      id: report.id,
      partner: report.partner,
      periodLabel: data.periodLabel,
      monthInput: `${report.periodYear}-${String(report.periodMonth).padStart(2, '0')}`,
      status: report.status,
      totals: data.totals,
      generatedAt: data.generatedAt,
      previewSentAt: report.previewSentAt?.toISOString() ?? null,
      previewSentTo: report.previewSentTo,
      sentAt: report.sentAt?.toISOString() ?? null,
      sentTo: report.sentTo,
      sentCc: report.sentCc,
      html: renderPartnerReportHtml(data, null),
      csv: partnerReportCsv(data),
      csvFilename: partnerReportCsvFilename(data),
    };
  });
  return { partners, reports };
}

async function loadDiscountCodeRows(): Promise<DiscountCodeRow[]> {
  const [codes, usage] = await Promise.all([
    prisma.discountCode.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] }),
    prisma.lead.findMany({
      where: { discountCodeId: { not: null } },
      select: { discountCodeId: true, status: true, finalPrice: true },
    }),
  ]);
  return codes.map((code) => {
    const used = usage.filter((lead) => lead.discountCodeId === code.id);
    const completed = used.filter((lead) => lead.status === 'COMPLETED');
    return {
      id: code.id,
      code: code.code,
      partner: code.partner,
      office: code.office,
      agentName: code.agentName,
      discountPercent: code.discountPercent,
      commissionPercent: code.commissionPercent,
      active: code.active,
      validFrom: code.validFrom ? toHelsinkiDateInput(code.validFrom) : '',
      validUntil: code.validUntil ? toHelsinkiDateInput(code.validUntil) : '',
      validFromIso: code.validFrom?.toISOString() ?? null,
      validUntilIso: code.validUntil?.toISOString() ?? null,
      leadCount: used.length,
      completedCount: completed.length,
      completedSales: completed.reduce((sum, lead) => sum + (lead.finalPrice ?? 0), 0),
    };
  });
}

async function loadCodeActivity(selectedId: string | undefined) {
  const codes = await prisma.discountCode.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] });
  const options: CodeOption[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    partner: c.partner,
    office: c.office,
    agentName: c.agentName,
    active: c.active,
    discountPercent: c.discountPercent,
    commissionPercent: c.commissionPercent,
  }));
  const selected = options.find((c) => c.id === selectedId) ?? null;
  if (!selected) return { options, selected, rows: [], summary: null, csv: '', csvFilename: '' };

  const leads = await prisma.lead.findMany({
    where: { discountCodeId: selected.id },
    include: { contact: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const { rows, summary } = buildCodeActivity({
    codeId: selected.id,
    defaultCommissionPercent: selected.commissionPercent,
    leads,
  });
  return {
    options,
    selected,
    rows,
    summary,
    csv: codeActivityCsv(selected.code, rows, summary),
    csvFilename: codeActivityCsvFilename(selected.code),
  };
}

export default async function RaportitPage({
  searchParams,
}: {
  searchParams: Promise<{ nakyma?: string; koodi?: string }>;
}) {
  const { nakyma, koodi } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === nakyma) ? (nakyma as TabKey) : 'kuukausi';

  let dbUnavailable = false;
  let content: React.ReactNode = null;
  try {
    if (tab === 'koodit') {
      content = <DiscountCodesClient rows={await loadDiscountCodeRows()} siteUrl={siteUrl()} />;
    } else if (tab === 'tapahtumat') {
      const activity = await loadCodeActivity(koodi);
      content = (
        <CodeActivityClient
          codes={activity.options}
          selected={activity.selected}
          rows={activity.rows}
          summary={activity.summary}
          csv={activity.csv}
          csvFilename={activity.csvFilename}
        />
      );
    } else {
      const { partners, reports } = await loadMonthlyReports();
      const prev = previousHelsinkiMonth(new Date());
      content = (
        <ReportsClient
          partners={partners}
          reports={reports}
          defaultMonth={`${prev.year}-${String(prev.month).padStart(2, '0')}`}
        />
      );
    }
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/raportit] Database unavailable', error);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kumppaniraportit</h1>

      <nav aria-label="Raporttien näkymät" className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'kuukausi' ? '/hallinta/raportit' : `/hallinta/raportit?nakyma=${t.key}`}
            aria-current={tab === t.key ? 'page' : undefined}
            className={`flex h-10 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </Link>
        ))}
      </nav>

      {dbUnavailable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä.
        </div>
      ) : (
        content
      )}
    </div>
  );
}
