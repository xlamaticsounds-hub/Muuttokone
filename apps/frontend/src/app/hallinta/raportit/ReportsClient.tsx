'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PartnerReportTotals } from '@/lib/partner-report';
import { formatEuro } from '@/lib/format';
import { formatHelsinkiDate } from '@/lib/helsinki-time';
import {
  approveAndSendPartnerReport,
  createPartnerReport,
  savePartnerSettings,
  type ReportActionResult,
} from '@/server/partner-report-actions';

export type PartnerSettingsRow = { partner: string; reportEmail: string; reportCcEmail: string };

export type ReportRow = {
  id: string;
  partner: string;
  periodLabel: string;
  monthInput: string;
  status: 'DRAFT' | 'SENT';
  totals: PartnerReportTotals;
  generatedAt: string;
  previewSentAt: string | null;
  previewSentTo: string | null;
  sentAt: string | null;
  sentTo: string | null;
  sentCc: string | null;
  html: string;
  csv: string;
  csvFilename: string;
};

const card = 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-800';
const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';
const labelClass = 'block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400';
const secondaryButton =
  'h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700';

const dateFi = (iso: string | null) => (iso ? formatHelsinkiDate(new Date(iso)) : '');

function Feedback({ result }: { result: ReportActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role={result.success ? 'status' : 'alert'}
      className={`text-sm font-medium ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
    >
      {result.message}
    </p>
  );
}

function downloadCsv(report: ReportRow) {
  const url = URL.createObjectURL(new Blob([report.csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = report.csvFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function RecipientsForm({ settings }: { settings: PartnerSettingsRow }) {
  const router = useRouter();
  const [reportEmail, setReportEmail] = useState(settings.reportEmail);
  const [reportCcEmail, setReportCcEmail] = useState(settings.reportCcEmail);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ReportActionResult | null>(null);
  const slug = settings.partner.replace(/\W+/g, '-');

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setResult(await savePartnerSettings(settings.partner, { reportEmail, reportCcEmail }));
        setSaving(false);
        router.refresh();
      }}
    >
      <p className="font-semibold text-gray-900 dark:text-white">{settings.partner}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`report-to-${slug}`} className={labelClass}>Raportin vastaanottaja ({settings.partner})</label>
          <input
            id={`report-to-${slug}`}
            type="text"
            inputMode="email"
            autoComplete="off"
            value={reportEmail}
            onChange={(e) => setReportEmail(e.target.value)}
            placeholder="esim. laskutus@kumppani.fi"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Hyväksytty raportti lähetetään tänne.</p>
        </div>
        <div>
          <label htmlFor={`report-cc-${slug}`} className={labelClass}>Kopio meille</label>
          <input
            id={`report-cc-${slug}`}
            type="text"
            inputMode="email"
            autoComplete="off"
            value={reportCcEmail}
            onChange={(e) => setReportCcEmail(e.target.value)}
            placeholder="esim. info@muuttokone.fi"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Esikatselu tulee tänne, ja lähetetystä raportista kopio.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Tallennetaan...' : 'Tallenna vastaanottajat'}
        </button>
        <Feedback result={result} />
      </div>
    </form>
  );
}

function ReportCard({ report, recipient }: { report: ReportRow; recipient: PartnerSettingsRow | undefined }) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReportActionResult | null>(null);
  const reportEmail = recipient?.reportEmail || '';

  const regenerate = async () => {
    const sentWarning = report.status === 'SENT' ? ` Raportti on jo lähetetty ${report.partner}lle — uusi versio pitää hyväksyä ja lähettää uudelleen, jos se muuttuu.` : '';
    if (!window.confirm(`Luodaanko raportti ${report.periodLabel} uudelleen nykyisillä tiedoilla? Esikatselu lähetetään uudelleen.${sentWarning}`)) return;
    setBusy(true);
    setResult(await createPartnerReport(report.partner, report.monthInput, true));
    setBusy(false);
    router.refresh();
  };

  const approve = async () => {
    if (busy) return;
    const cc = recipient?.reportCcEmail ? `\nKopio: ${recipient.reportCcEmail}` : '';
    const again = report.status === 'SENT' ? ' UUDELLEEN' : '';
    if (!window.confirm(`Lähetetäänkö raportti ${report.periodLabel}${again} osoitteeseen ${reportEmail}?${cc}`)) return;
    setBusy(true);
    setResult(await approveAndSendPartnerReport(report.id, report.status === 'SENT'));
    setBusy(false);
    router.refresh();
  };

  return (
    <div className={`${card} min-w-0 space-y-3`} data-report-id={report.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {report.partner} · {report.periodLabel}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {report.totals.count} {report.totals.count === 1 ? 'muutto' : 'muuttoa'} · myynti {formatEuro(report.totals.salesNet)} € alv 0 % ·{' '}
            <strong>palkkio {formatEuro(report.totals.commission)} €</strong>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            report.status === 'SENT'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          }`}
        >
          {report.status === 'SENT' ? 'Lähetetty' : 'Odottaa hyväksyntää'}
        </span>
      </div>

      <ul className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <li>Luotu {dateFi(report.generatedAt)}</li>
        {report.previewSentAt && <li>Esikatselu lähetetty {dateFi(report.previewSentAt)} osoitteeseen {report.previewSentTo}</li>}
        {report.sentAt && (
          <li className="font-semibold text-green-700 dark:text-green-400">
            Lähetetty {dateFi(report.sentAt)} osoitteeseen {report.sentTo}
            {report.sentCc ? ` (kopio ${report.sentCc})` : ''}
          </li>
        )}
      </ul>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={() => setShowPreview((v) => !v)} className={secondaryButton}>
          {showPreview ? 'Piilota raportti' : 'Näytä raportti'}
        </button>
        <button type="button" onClick={() => downloadCsv(report)} className={secondaryButton}>
          Lataa CSV
        </button>
        <button type="button" onClick={regenerate} disabled={busy} className={secondaryButton}>
          Luo uudelleen
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={busy || !reportEmail}
          title={!reportEmail ? 'Aseta ensin raportin vastaanottaja' : undefined}
          className="col-span-2 h-11 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {report.status === 'SENT' ? `Lähetä uudelleen ${report.partner}lle` : `Hyväksy ja lähetä ${report.partner}lle`}
        </button>
      </div>
      {!reportEmail && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Aseta ensin raportin vastaanottaja yllä.</p>
      )}
      <Feedback result={result} />

      {showPreview && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <iframe title={`Raportti ${report.periodLabel}`} srcDoc={report.html} className="h-[70vh] w-full border-0 bg-white" />
        </div>
      )}
    </div>
  );
}

export default function ReportsClient({
  partners,
  reports,
  defaultMonth,
}: {
  partners: PartnerSettingsRow[];
  reports: ReportRow[];
  defaultMonth: string;
}) {
  const router = useRouter();
  const [partner, setPartner] = useState(partners[0]?.partner ?? '');
  const [month, setMonth] = useState(defaultMonth);
  const [sendPreview, setSendPreview] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ReportActionResult | null>(null);

  return (
    <>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Välityspalkkio toteutuneista muutoista. Raportti luodaan automaattisesti kuun 1. päivänä edelliselle kuukaudelle,
        esikatselu tulee vain meille, ja kumppanille se lähtee vasta kun hyväksyt sen täältä.
      </p>

      {partners.length === 0 ? (
        <div className={card}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lisää ensin alennuskoodi Koodit-välilehdellä, niin kumppani näkyy täällä.</p>
        </div>
      ) : (
        <>
          <section className={`${card} space-y-5`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vastaanottajat</h2>
            {partners.map((settings) => (
              <RecipientsForm key={settings.partner} settings={settings} />
            ))}
          </section>

          <section className={`${card} space-y-3`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Luo raportti käsin</h2>
            <form
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setCreating(true);
                setResult(await createPartnerReport(partner, month, sendPreview));
                setCreating(false);
                router.refresh();
              }}
            >
              {partners.length > 1 && (
                <div>
                  <label htmlFor="report-partner" className={labelClass}>Kumppani</label>
                  <select id="report-partner" value={partner} onChange={(e) => setPartner(e.target.value)} className={inputClass}>
                    {partners.map((p) => (
                      <option key={p.partner} value={p.partner}>{p.partner}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="report-month" className={labelClass}>Kuukausi</label>
                <input
                  id="report-month"
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={creating || !month} className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Luodaan...' : 'Luo raportti'}
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-3 dark:text-gray-200">
                <input type="checkbox" checked={sendPreview} onChange={(e) => setSendPreview(e.target.checked)} className="h-5 w-5 rounded" />
                Lähetä esikatselu sähköpostiin (vain meille)
              </label>
            </form>
            <Feedback result={result} />
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Raportit</h2>
        {reports.length === 0 ? (
          <div className={card}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ei raportteja vielä.</p>
          </div>
        ) : (
          reports.map((report) => (
            <ReportCard key={report.id} report={report} recipient={partners.find((p) => p.partner === report.partner)} />
          ))
        )}
      </section>
    </>
  );
}
