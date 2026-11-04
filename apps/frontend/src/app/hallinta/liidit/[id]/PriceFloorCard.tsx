'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck, Settings2 } from 'lucide-react';
import {
  PRICE_FLOOR_COST_FIELDS,
  computePriceFloor,
  ownerHourlyAt,
  type EstimatedFloorJob,
  type PriceFloorCosts,
} from '@/lib/price-floor';
import { savePriceFloorCosts } from '@/server/price-floor-actions';

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white';
const eur = (value: number) => `${Math.round(value).toLocaleString('fi-FI')} €`;
const num = (value: string) => Number(value.replace(',', '.'));

// Hintalattia (tiimipalaverin päätös 4.11.2026): varoittaa, jos liidin hinta jää alle tarjouksen
// alarajan. Tunnit ja kilometrit tulevat laskurin arviosta, ja niitä voi muokata, kun keikka on
// tullut muualta (esim. Muuttomaailma). Kululuvut tallennetaan tietokantaan, eivät ole koodissa.
export default function PriceFloorCard({
  costs,
  initialJob,
  price,
}: {
  costs: PriceFloorCosts | null;
  initialJob: EstimatedFloorJob;
  /** Liidin hinta € sis. ALV (vahvistettu, alennettu tai laskurin arvio). */
  price: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingCosts, setEditingCosts] = useState(costs === null);
  const [costDraft, setCostDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(PRICE_FLOOR_COST_FIELDS.map((f) => [f.key, costs ? String(costs[f.key]).replace('.', ',') : ''])),
  );
  const [costError, setCostError] = useState<string | null>(null);
  const [hours, setHours] = useState(String(initialJob.hoursPerPerson).replace('.', ','));
  const [km, setKm] = useState(String(initialJob.kmDriven));
  const [hired, setHired] = useState(String(initialJob.hired));
  const [owners, setOwners] = useState(String(initialJob.owners));
  const [muuttomaailma, setMuuttomaailma] = useState(initialJob.muuttomaailma);
  const [priceInput, setPriceInput] = useState(price != null ? String(Math.round(price)) : '');

  const job = useMemo(
    () => ({ hoursPerPerson: num(hours) || 0, kmDriven: num(km) || 0, hired: num(hired) || 0, owners: num(owners) || 0, muuttomaailma }),
    [hours, km, hired, owners, muuttomaailma],
  );
  const result = costs ? computePriceFloor(job, costs) : null;
  const compared = priceInput.trim() ? num(priceInput) : null;
  const ownerHourly = costs && compared != null && Number.isFinite(compared) ? ownerHourlyAt(compared, job, costs) : null;
  const below = result && compared != null && Number.isFinite(compared) ? compared < result.floor : false;

  const saveCosts = () =>
    startTransition(async () => {
      const response = await savePriceFloorCosts(costDraft);
      if (!response.ok) {
        setCostError(response.message);
        return;
      }
      setCostError(null);
      setEditingCosts(false);
      router.refresh();
    });

  return (
    <section
      className={`rounded-lg border p-4 shadow-sm ${
        below
          ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          {below ? <ShieldAlert className="h-5 w-5 text-red-600" /> : <ShieldCheck className="h-5 w-5 text-green-600" />}
          Hintalattia
        </h2>
        <button
          type="button"
          onClick={() => setEditingCosts((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <Settings2 className="h-3.5 w-3.5" /> Kululuvut
        </button>
      </div>

      {result && (
        <p className={`mt-2 text-sm ${below ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
          Alaraja <strong>{eur(result.floor)}</strong> sis. ALV
          {compared != null && Number.isFinite(compared) && (
            <>
              {' · '}hinta {eur(compared)}
              {ownerHourly != null && <> · omistajalle noin {eur(ownerHourly)}/h</>}
              {' · '}
              {below ? (
                <strong>⚠️ Alle hintalattian, nosta hintaa tai tarkista tunnit ennen tarjousta.</strong>
              ) : (
                <span className="font-semibold text-green-700 dark:text-green-400">✓ Hintalattian yläpuolella</span>
              )}
            </>
          )}
        </p>
      )}
      {!costs && !editingCosts && <p className="mt-2 text-sm text-gray-500">Tallenna kululuvut, niin hintalattia lasketaan.</p>}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
        <label className="text-xs text-gray-500">
          Hinta €
          <input className={inputClass} inputMode="decimal" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500">
          Tunnit / hlö
          <input className={inputClass} inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500">
          Km yhteensä
          <input className={inputClass} inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500">
          Palkattuja
          <input className={inputClass} inputMode="numeric" value={hired} onChange={(e) => setHired(e.target.value)} />
        </label>
        <label className="text-xs text-gray-500">
          Omistajia
          <input className={inputClass} inputMode="numeric" value={owners} onChange={(e) => setOwners(e.target.value)} />
        </label>
        <label className="flex items-end gap-2 pb-1 text-xs text-gray-500">
          <input type="checkbox" checked={muuttomaailma} onChange={(e) => setMuuttomaailma(e.target.checked)} />
          Muuttomaailma
        </label>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {initialJob.fromCalculator
          ? 'Tunnit ja km laskurin arviosta: todellinen ajo, paluu yli 30 km:n muutoista ja tyhjä ajo tukikohdasta mukana.'
          : 'Keikka ei tullut laskurista: täytä arvioidut tunnit ja kilometrit.'}
      </p>

      {editingCosts && (
        <div className="mt-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs text-gray-500">Kululuvut tallennetaan tietokantaan, ja ne koskevat kaikkia liidejä.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PRICE_FLOOR_COST_FIELDS.map((field) => (
              <label key={field.key} className="text-xs text-gray-500">
                {field.label} ({field.unit})
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={costDraft[field.key] ?? ''}
                  onChange={(e) => setCostDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          {costError && <p className="mt-2 text-xs text-red-600">{costError}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={saveCosts}
            className="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            {pending ? 'Tallennetaan…' : 'Tallenna kululuvut'}
          </button>
        </div>
      )}
    </section>
  );
}
