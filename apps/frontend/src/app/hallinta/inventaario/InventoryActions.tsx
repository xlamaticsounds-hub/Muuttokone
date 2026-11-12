'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Pencil, Truck, Undo2, X, PackageCheck } from 'lucide-react';
import { saveBoxStock, setBoxRentalStatus } from '@/server/box-rental-actions';
import type { BoxRentalStatusKey } from '@/lib/box-inventory';

const buttonClass =
  'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition disabled:opacity-50';
const neutral = `${buttonClass} border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`;
const primary = `${buttonClass} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;
const inputClass =
  'w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white';

/** Varaston koko (kaikki laatikot, myös vuokralla olevat). */
export function BoxStockEditor({ total }: { total: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(total === null);
  const [value, setValue] = useState(total === null ? '' : String(total));

  const save = () =>
    startTransition(async () => {
      const result = await saveBoxStock(Number(value));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success('Varaston koko tallennettu');
      setEditing(false);
      router.refresh();
    });

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={neutral} title="Muuta varaston kokoa (esim. lisäostot)">
        <Pencil className="h-3.5 w-3.5" /> Varasto {total} kpl
      </button>
    );
  }
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="box-stock">
        Laatikoita yhteensä
      </label>
      <input id="box-stock" type="number" min={0} inputMode="numeric" className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      <button type="submit" className={primary} disabled={pending || value === ''}>
        <Check className="h-3.5 w-3.5" /> Tallenna
      </button>
      {total !== null && (
        <button type="button" className={neutral} onClick={() => setEditing(false)} disabled={pending}>
          Peru
        </button>
      )}
    </form>
  );
}

/** Tilanvaihtonapit: toimitettu → noudettu (palautunut määrä), kumoaminen ja peruminen. */
export function RentalActions({ id, status, quantity }: { id: string; status: BoxRentalStatusKey; quantity: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [returning, setReturning] = useState(false);
  const [returned, setReturned] = useState(String(quantity));

  const change = (next: BoxRentalStatusKey, returnedQty?: number, message?: string) =>
    startTransition(async () => {
      const result = await setBoxRentalStatus({ id, status: next, returnedQty });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      if (message) toast.success(message);
      setReturning(false);
      router.refresh();
    });

  if (returning) {
    const n = Number(returned);
    const missing = Number.isInteger(n) ? Math.max(0, quantity - n) : 0;
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          change('RETURNED', n, missing ? `Noudettu, ${missing} laatikkoa puuttuu` : 'Noudettu');
        }}
      >
        <label className="text-xs text-gray-600 dark:text-gray-300" htmlFor={`ret-${id}`}>
          Palautui
        </label>
        <input id={`ret-${id}`} type="number" min={0} max={quantity} className={inputClass} value={returned} onChange={(e) => setReturned(e.target.value)} autoFocus />
        <span className="text-xs text-gray-500">/ {quantity}</span>
        {missing > 0 && <span className="text-xs font-semibold text-red-600 dark:text-red-400">puuttuu {missing}</span>}
        <button type="submit" className={primary} disabled={pending}>
          <Check className="h-3.5 w-3.5" /> OK
        </button>
        <button type="button" className={neutral} onClick={() => setReturning(false)} disabled={pending} aria-label="Peru">
          <X className="h-3.5 w-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'RESERVED' && (
        <>
          <button type="button" className={primary} disabled={pending} onClick={() => change('DELIVERED', undefined, 'Merkitty toimitetuksi')}>
            <Truck className="h-3.5 w-3.5" /> Toimitettu
          </button>
          <button
            type="button"
            className={neutral}
            disabled={pending}
            onClick={() => {
              if (window.confirm('Perutaanko laatikkovuokraus? Liidi itse ei muutu.')) change('CANCELLED', undefined, 'Vuokraus peruttu');
            }}
          >
            <X className="h-3.5 w-3.5" /> Peru
          </button>
        </>
      )}
      {status === 'DELIVERED' && (
        <>
          <button type="button" className={primary} disabled={pending} onClick={() => setReturning(true)}>
            <PackageCheck className="h-3.5 w-3.5" /> Noudettu
          </button>
          <button type="button" className={neutral} disabled={pending} onClick={() => change('RESERVED')}>
            <Undo2 className="h-3.5 w-3.5" /> Ei vielä toimitettu
          </button>
        </>
      )}
      {status === 'RETURNED' && (
        <button type="button" className={neutral} disabled={pending} onClick={() => change('DELIVERED', undefined, 'Nouto kumottu')}>
          <Undo2 className="h-3.5 w-3.5" /> Kumoa nouto
        </button>
      )}
      {status === 'CANCELLED' && (
        <button type="button" className={neutral} disabled={pending} onClick={() => change('RESERVED', undefined, 'Vuokraus palautettu')}>
          <Undo2 className="h-3.5 w-3.5" /> Palauta vuokraus
        </button>
      )}
    </div>
  );
}
