'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkDiscountCode } from '@/features/calculator/discount';
import type { DiscountCodeFormValues } from '@/lib/discount-code-input';
import { saveDiscountCode, setDiscountCodeActive } from '@/server/discount-code-actions';
import { formatHelsinkiDate } from '@/lib/helsinki-time';
import { formatEuro } from '@/lib/format';

export type DiscountCodeRow = {
  id: string;
  code: string;
  partner: string;
  office: string | null;
  agentName: string | null;
  discountPercent: number;
  commissionPercent: number;
  active: boolean;
  validFrom: string; // date-kentän arvo (Suomen aikaa) tai ''
  validUntil: string;
  validFromIso: string | null;
  validUntilIso: string | null;
  leadCount: number;
  completedCount: number;
  completedSales: number; // € sis. alv
};

const NEW_CODE: DiscountCodeFormValues = {
  code: '',
  partner: 'Kiinteistömaailma',
  office: '',
  agentName: '',
  discountPercent: '10',
  commissionPercent: '5',
  active: true,
  validFrom: '',
  validUntil: '',
};

const formatPercent = (value: number) => value.toLocaleString('fi-FI', { maximumFractionDigits: 2 });

function statusOf(row: DiscountCodeRow): { label: string; className: string } {
  const check = checkDiscountCode({
    ...row,
    validFrom: row.validFromIso ? new Date(row.validFromIso) : null,
    validUntil: row.validUntilIso ? new Date(row.validUntilIso) : null,
  });
  if (check.ok) return { label: 'Käytössä', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  if (check.reason === 'not_started') {
    return { label: 'Ei vielä voimassa', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
  }
  if (check.reason === 'expired') return { label: 'Vanhentunut', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
  return { label: 'Ei käytössä', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
}

function validityText(row: DiscountCodeRow): string {
  if (!row.validFromIso && !row.validUntilIso) return 'Voimassa toistaiseksi';
  const from = row.validFromIso ? formatHelsinkiDate(new Date(row.validFromIso)) : '';
  const until = row.validUntilIso ? formatHelsinkiDate(new Date(row.validUntilIso)) : '';
  if (from && until) return `Voimassa ${from} – ${until}`;
  return from ? `Voimassa ${from} alkaen` : `Voimassa ${until} asti`;
}

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';
const labelClass = 'block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400';

export default function DiscountCodesClient({ rows, siteUrl }: { rows: DiscountCodeRow[]; siteUrl: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: string | null; values: DiscountCodeFormValues } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const open = (id: string | null, values: DiscountCodeFormValues) => {
    setFormError(null);
    setEditing({ id, values });
  };

  const setField = <K extends keyof DiscountCodeFormValues>(key: K, value: DiscountCodeFormValues[K]) =>
    setEditing((prev) => (prev ? { ...prev, values: { ...prev.values, [key]: value } } : prev));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    const result = await saveDiscountCode(editing.id, editing.values);
    setSaving(false);
    if (result.success) {
      setEditing(null);
      router.refresh();
    } else {
      setFormError(result.message);
    }
  };

  const toggleActive = async (row: DiscountCodeRow) => {
    if (row.active && !window.confirm(`Poistetaanko koodi ${row.code} käytöstä? Asiakkaat eivät voi enää käyttää sitä.`)) return;
    setBusyId(row.id);
    setRowError(null);
    const result = await setDiscountCodeActive(row.id, !row.active);
    setBusyId(null);
    if (result.success) router.refresh();
    else setRowError(result.message);
  };

  const copyLink = async (row: DiscountCodeRow, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((current) => (current === row.id ? null : current)), 2000);
    } catch {
      window.prompt('Kopioi linkki:', link);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alennuskoodit</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lisää uusia koodeja ja poista vanhoja käytöstä — muutos toimii laskurissa heti, ilman koodimuutoksia.
          </p>
        </div>
        <button
          type="button"
          onClick={() => open(null, NEW_CODE)}
          className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Lisää koodi
        </button>
      </div>

      {rowError && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {rowError}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Ei alennuskoodeja vielä.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const status = statusOf(row);
            const link = `${siteUrl}/?koodi=${encodeURIComponent(row.code)}`;
            return (
              <div
                key={row.id}
                className={`min-w-0 space-y-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 ${
                  row.active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 opacity-80 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-lg font-bold text-gray-900 dark:text-white">{row.code}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {[row.partner, row.office, row.agentName].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Asiakkaalle</p>
                    <p className="font-semibold text-gray-900 dark:text-white">-{formatPercent(row.discountPercent)} %</p>
                  </div>
                  <div className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Palkkio (alv 0)</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatPercent(row.commissionPercent)} %</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {validityText(row)} · {row.leadCount} liidiä · {row.completedCount} toteutunut
                  {row.completedCount > 0 && <> · myynti {formatEuro(row.completedSales)} €</>}
                </p>

                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-600 dark:text-gray-300" title={link}>
                    {link}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyLink(row, link)}
                    className="h-9 shrink-0 rounded-md bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
                  >
                    {copiedId === row.id ? 'Kopioitu ✓' : 'Kopioi linkki'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      open(row.id, {
                        code: row.code,
                        partner: row.partner,
                        office: row.office ?? '',
                        agentName: row.agentName ?? '',
                        discountPercent: formatPercent(row.discountPercent),
                        commissionPercent: formatPercent(row.commissionPercent),
                        active: row.active,
                        validFrom: row.validFrom,
                        validUntil: row.validUntil,
                      })
                    }
                    className="h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Muokkaa
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => toggleActive(row)}
                    className={`h-11 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                      row.active
                        ? 'border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {row.active ? 'Poista käytöstä' : 'Ota käyttöön'}
                  </button>
                  <Link
                    href={`/hallinta/raportit?nakyma=tapahtumat&koodi=${row.id}`}
                    className="col-span-2 flex h-11 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                  >
                    Näytä tapahtumat ja raportti →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discount-code-form-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setEditing(null);
          }}
        >
          <form
            onSubmit={handleSave}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 dark:bg-gray-800"
          >
            <h2 id="discount-code-form-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {editing.id ? 'Muokkaa koodia' : 'Uusi alennuskoodi'}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="dc-code" className={labelClass}>Koodi</label>
                <input
                  id="dc-code"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={editing.values.code}
                  onChange={(e) => setField('code', e.target.value)}
                  placeholder="esim. KM-MANKKAA"
                  className={`${inputClass} font-mono uppercase placeholder:normal-case`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Asiakas syöttää tämän laskuriin. Isoilla ja pienillä kirjaimilla ei ole väliä.
                </p>
              </div>
              <div>
                <label htmlFor="dc-partner" className={labelClass}>Kumppani</label>
                <input id="dc-partner" required value={editing.values.partner} onChange={(e) => setField('partner', e.target.value)} className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dc-office" className={labelClass}>Toimipaikka (valinnainen)</label>
                  <input id="dc-office" value={editing.values.office} onChange={(e) => setField('office', e.target.value)} placeholder="esim. Mankkaa" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dc-agent" className={labelClass}>Välittäjä (valinnainen)</label>
                  <input id="dc-agent" value={editing.values.agentName} onChange={(e) => setField('agentName', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dc-discount" className={labelClass}>Alennus %</label>
                  <input id="dc-discount" required inputMode="decimal" value={editing.values.discountPercent} onChange={(e) => setField('discountPercent', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dc-commission" className={labelClass}>Palkkio % (alv 0)</label>
                  <input id="dc-commission" required inputMode="decimal" value={editing.values.commissionPercent} onChange={(e) => setField('commissionPercent', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dc-from" className={labelClass}>Voimassa alkaen</label>
                  <input id="dc-from" type="date" value={editing.values.validFrom} onChange={(e) => setField('validFrom', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dc-until" className={labelClass}>Voimassa asti</label>
                  <input id="dc-until" type="date" value={editing.values.validUntil} onChange={(e) => setField('validUntil', e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">Tyhjä = ei rajaa. Viimeinen päivä on voimassa koko päivän.</p>
              <label className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                <input type="checkbox" checked={editing.values.active} onChange={(e) => setField('active', e.target.checked)} className="h-5 w-5 rounded" />
                Käytössä
              </label>
              {editing.id && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Muutokset koskevat vain uusia varauksia — jo tehdyille liideille on tallennettu varaushetken alennus ja palkkio.
                </p>
              )}
            </div>

            {formError && (
              <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="h-12 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Peruuta
              </button>
              <button type="submit" disabled={saving} className="h-12 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
