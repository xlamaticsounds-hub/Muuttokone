'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_OFFER_VAT_RATE,
  MAX_OFFER_LINES,
  OFFER_LIMITS,
  OFFER_TYPES,
  OFFER_VAT_RATES,
  offerTotals,
  parseAmount,
  type OfferType,
} from '@/lib/offer';
import { inputClass, labelClass, textareaClass } from '../form-styles';

export type LineState = { id: string; label: string; amount: string; vatRate: number };

export type OfferFieldsValue = {
  type: OfferType;
  description: string;
  lines: LineState[];
  priceNote: string;
  validUntil: string;
  notes: string;
  terms: string;
};

export const newLine = (label = '', amount = '', vatRate: number = DEFAULT_OFFER_VAT_RATE): LineState => ({
  id: Math.random().toString(36).slice(2, 10),
  label,
  amount,
  vatRate,
});

/** Summa kenttään suomalaisittain: 390 -> "390", 443.2 -> "443,20". */
export const amountToInput = (amount: number | null | undefined) =>
  amount == null ? '' : Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ',');

export const linesToPayload = (lines: LineState[]) => lines.map((l) => ({ label: l.label, amount: l.amount, vatRate: l.vatRate }));

const euro = (value: number) => value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Tarjouksen / tilausvahvistuksen sisältö: tyyppi, kuvaus (ei tavaraluetteloa), hintarivit,
// hinnoittelun lisätieto, voimassaolo, lisätiedot ja ehdot. Käytössä kirjauslomakkeella ja editorissa.
export default function OfferFields({
  value,
  onChange,
  idPrefix,
  showTerms = false,
}: {
  value: OfferFieldsValue;
  onChange: (patch: Partial<OfferFieldsValue>) => void;
  idPrefix: string;
  showTerms?: boolean;
}) {
  const validLines = value.lines
    .map((l) => ({ label: l.label, amount: parseAmount(l.amount), vatRate: l.vatRate }))
    .filter((l) => Number.isFinite(l.amount) && l.amount > 0);
  const totals = offerTotals(validLines);
  const zeroVat = validLines.some((l) => l.vatRate === 0);

  const updateLine = (id: string, patch: Partial<LineState>) => onChange({ lines: value.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className={labelClass}>Dokumentti</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {OFFER_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={value.type === t.id}
              onClick={() => onChange({ type: t.id })}
              className={`h-11 rounded-lg border text-sm font-bold ${
                value.type === t.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200'
              }`}
            >
              {t.id === 'vahvistus' ? 'Tilausvahvistus' : 'Tarjous'}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>Palvelun kuvaus</label>
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          maxLength={OFFER_LIMITS.description}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="esim. Kaksion muutto 3. kerroksesta (hissi) Espooseen. Kolme muuttajaa ja pakettiauto."
          className={textareaClass}
        />
      </div>

      <div>
        <span className={labelClass}>Hinta</span>
        <ul className="mt-1 space-y-2">
          {value.lines.map((line, i) => (
            <li key={line.id} className="grid grid-cols-[1fr_6.5rem] gap-2 sm:grid-cols-[1fr_7rem_6rem_auto]">
              <input
                aria-label={`Rivin ${i + 1} selite`}
                value={line.label}
                maxLength={OFFER_LIMITS.lineLabel}
                onChange={(e) => updateLine(line.id, { label: e.target.value })}
                placeholder="Muuttopalvelu"
                className={`${inputClass} col-span-2 sm:col-span-1`}
              />
              <input
                aria-label={`Rivin ${i + 1} summa (€)`}
                value={line.amount}
                inputMode="decimal"
                onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                placeholder="0,00 €"
                className={`${inputClass} text-right`}
              />
              <select
                aria-label={`Rivin ${i + 1} ALV`}
                value={line.vatRate}
                onChange={(e) => updateLine(line.id, { vatRate: Number(e.target.value) })}
                className={inputClass}
              >
                {OFFER_VAT_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    ALV {rate === 0 ? '0 %' : '25,5 %'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ lines: value.lines.filter((l) => l.id !== line.id) })}
                aria-label={`Poista rivi ${i + 1}`}
                className="mt-1 flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-600 dark:border-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onChange({ lines: [...value.lines, newLine()] })}
            disabled={value.lines.length >= MAX_OFFER_LINES}
            className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <Plus className="h-4 w-4" />
            Lisää hintarivi
          </button>
          {validLines.length > 0 && (
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Yhteensä <strong>{euro(totals.gross)} €</strong>
              <span className="text-gray-500 dark:text-gray-400">{zeroVat ? ' · ALV 0 %' : ' · sis. ALV'}</span>
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-pricenote`} className={labelClass}>Hinnoittelun lisätieto (valinnainen)</label>
        <textarea
          id={`${idPrefix}-pricenote`}
          rows={2}
          maxLength={OFFER_LIMITS.priceNote}
          value={value.priceNote}
          onChange={(e) => onChange({ priceNote: e.target.value })}
          placeholder="esim. Tuntihinta 89 €/h, vähimmäisveloitus 2 h. Lopullinen hinta toteutuneen työajan mukaan."
          className={textareaClass}
        />
      </div>

      {value.type === 'tarjous' && (
        <div className="max-w-xs">
          <label htmlFor={`${idPrefix}-valid`} className={labelClass}>Tarjous voimassa asti</label>
          <input id={`${idPrefix}-valid`} type="date" value={value.validUntil} onChange={(e) => onChange({ validUntil: e.target.value })} className={inputClass} />
        </div>
      )}

      <div>
        <label htmlFor={`${idPrefix}-notes`} className={labelClass}>Lisätiedot asiakkaalle (valinnainen)</label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={2}
          maxLength={OFFER_LIMITS.notes}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="esim. Avain noudetaan huoltoyhtiöltä klo 9.30."
          className={textareaClass}
        />
      </div>

      {showTerms && (
        <div>
          <label htmlFor={`${idPrefix}-terms`} className={labelClass}>Ehdot</label>
          <textarea
            id={`${idPrefix}-terms`}
            rows={4}
            maxLength={OFFER_LIMITS.terms}
            value={value.terms}
            onChange={(e) => onChange({ terms: e.target.value })}
            className={`${textareaClass} text-xs`}
          />
        </div>
      )}
    </div>
  );
}
