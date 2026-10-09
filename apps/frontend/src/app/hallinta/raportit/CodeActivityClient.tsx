'use client';

import { useRouter } from 'next/navigation';
import { UniversalTable, type Column } from '@/components/ui/UniversalTable';
import type { CodeActivityRow, CodeActivitySummary } from '@/lib/code-activity';
import { formatDateInputFi } from '@/lib/partner-report-render';
import { LEAD_STATUS_PILL_CLASSES } from '@/lib/lead-status';
import { formatEuro } from '@/lib/format';

export type CodeOption = {
  id: string;
  code: string;
  partner: string;
  office: string | null;
  agentName: string | null;
  active: boolean;
  discountPercent: number;
  commissionPercent: number;
};

type Row = CodeActivityRow & { id: string };

const card = 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-800';
const percent = (value: number) => value.toLocaleString('fi-FI', { maximumFractionDigits: 2 });

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-900/50">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// Yhden alennuskoodin tapahtumat: kaikki koodilla tehdyt varaukset tiloineen ja toteutuneiden
// palkkiot. Kuukausittainen raportti kumppanille tehdään Kuukausiraportit-välilehdeltä.
export default function CodeActivityClient({
  codes,
  selected,
  rows,
  summary,
  csv,
  csvFilename,
}: {
  codes: CodeOption[];
  selected: CodeOption | null;
  rows: CodeActivityRow[];
  summary: CodeActivitySummary | null;
  csv: string;
  csvFilename: string;
}) {
  const router = useRouter();

  const downloadCsv = () => {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const columns: Column<Row>[] = [
    { header: 'Varaus tehty', cell: (r) => formatDateInputFi(r.createdDate) },
    {
      header: 'Asiakas',
      cell: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.customerName}</span>,
    },
    { header: 'Muuttopäivä', cell: (r) => formatDateInputFi(r.moveDate) },
    {
      header: 'Tila',
      cell: (r) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${LEAD_STATUS_PILL_CLASSES[r.status]}`}>
          {r.statusLabel}
          {r.completedDate ? ` ${formatDateInputFi(r.completedDate)}` : ''}
        </span>
      ),
    },
    {
      header: 'Hinta',
      cell: (r) =>
        r.finalPriceGross !== null ? (
          <span className="font-semibold">{formatEuro(r.finalPriceGross)} €</span>
        ) : r.estimate !== null ? (
          <span className="text-gray-500">arvio {r.estimate} €</span>
        ) : (
          '–'
        ),
    },
    {
      header: 'Palkkio',
      cell: (r) =>
        r.commissionAmount !== null ? (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatEuro(r.commissionAmount)} €</span>
        ) : (
          <span className="text-gray-400">–</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className={card}>
        <label htmlFor="activity-code" className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
          Valitse alennuskoodi
        </label>
        <select
          id="activity-code"
          value={selected?.id ?? ''}
          onChange={(e) =>
            router.push(e.target.value ? `/hallinta/raportit?nakyma=tapahtumat&koodi=${e.target.value}` : '/hallinta/raportit?nakyma=tapahtumat')
          }
          className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="">— valitse —</option>
          {codes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
              {c.office || c.agentName ? ` (${[c.office, c.agentName].filter(Boolean).join(' / ')})` : ''}
              {c.active ? '' : ' — ei käytössä'}
            </option>
          ))}
        </select>
        {codes.length === 0 && <p className="mt-2 text-sm text-gray-500">Ei alennuskoodeja vielä — lisää koodi Koodit-välilehdellä.</p>}
      </div>

      {selected && summary && (
        <>
          <div className={`${card} space-y-4`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-all font-mono text-lg font-bold text-gray-900 dark:text-white">{selected.code}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {[selected.partner, selected.office, selected.agentName].filter(Boolean).join(' · ')} · asiakkaalle -
                  {percent(selected.discountPercent)} % · palkkio {percent(selected.commissionPercent)} %
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  selected.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {selected.active ? 'Käytössä' : 'Ei käytössä'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tile label="Varauksia" value={summary.total} sub={summary.open ? `${summary.open} avoinna` : undefined} />
              <Tile label="Vahvistettu" value={summary.confirmed} sub="ei vielä toteutunut" />
              <Tile label="Toteutunut" value={summary.completed} />
              <Tile label="Peruttu / hävitty" value={summary.cancelledOrLost} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Tile
                label="Toteutuneiden myynti"
                value={`${formatEuro(summary.salesNet)} €`}
                sub={`alv 0 % · ${formatEuro(summary.salesGross)} € sis. alv`}
              />
              <Tile label="Välityspalkkio yhteensä" value={`${formatEuro(summary.commission)} €`} sub="alv 0 %, vain toteutuneista" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadCsv}
                disabled={rows.length === 0}
                className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Lataa CSV
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CSV:ssä asiakkaista vain nimikirjaimet. Kuukausiraportti kumppanille tehdään Raportit-välilehdeltä.
              </p>
            </div>
          </div>

          <UniversalTable
            data={rows.map((r) => ({ ...r, id: r.leadId }))}
            columns={columns}
            onRowClick={(r) => router.push(`/hallinta/liidit/${r.leadId}`)}
            emptyMessage="Tällä koodilla ei ole vielä tehty varauksia."
          />
        </>
      )}
    </div>
  );
}
