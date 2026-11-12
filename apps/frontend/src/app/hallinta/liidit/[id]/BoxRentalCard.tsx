'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, Plus } from 'lucide-react';
import { saveBoxRental } from '@/server/box-rental-actions';
import { formatDateKey, type BoxRentalStatusKey } from '@/lib/box-inventory';
import { BOX_RENTAL } from '@/features/calculator/boxRental';
import { RentalActions } from '../../inventaario/InventoryActions';

export type BoxRentalDto = {
  id: string;
  quantity: number;
  deliveryKey: string;
  pickupKey: string;
  datesEstimated: boolean;
  status: BoxRentalStatusKey;
  returnedQty: number | null;
  lostQty: number;
  notes: string | null;
};

const STATUS_LABELS: Record<BoxRentalStatusKey, string> = {
  RESERVED: 'Varattu',
  DELIVERED: 'Toimitettu asiakkaalle',
  RETURNED: 'Noudettu',
  CANCELLED: 'Peruttu',
};

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white';
const labelClass = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400';

// Laatikkovuokraus liidin sivulla: määrä, toimitus- ja noutopäivä, tila. Rivi luodaan automaattisesti
// lomaketiedoista; tallennus merkitsee päivät vahvistetuiksi. Inventaario: /hallinta/inventaario.
export default function BoxRentalCard({
  leadId,
  rental,
  defaults,
  warning,
}: {
  leadId: string;
  rental: BoxRentalDto | null;
  defaults: { quantity: number; deliveryKey: string; pickupKey: string };
  warning: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(rental !== null);
  const [quantity, setQuantity] = useState(String(rental?.quantity ?? defaults.quantity));
  const [deliveryKey, setDeliveryKey] = useState(rental?.deliveryKey ?? defaults.deliveryKey);
  const [pickupKey, setPickupKey] = useState(rental?.pickupKey ?? defaults.pickupKey);
  const [notes, setNotes] = useState(rental?.notes ?? '');

  const dirty =
    !rental ||
    String(rental.quantity) !== quantity ||
    rental.deliveryKey !== deliveryKey ||
    rental.pickupKey !== pickupKey ||
    (rental.notes ?? '') !== notes;

  const save = () =>
    startTransition(async () => {
      const result = await saveBoxRental({ leadId, quantity: Number(quantity), deliveryKey, pickupKey, notes });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      if (result.warning) toast.error(result.warning, { duration: 8000 });
      else toast.success('Laatikkovuokra tallennettu');
      router.refresh();
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" /> Lisää laatikkovuokraus
      </button>
    );
  }

  const editable = !rental || rental.status === 'RESERVED' || rental.status === 'DELIVERED';

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Package className="h-5 w-5 text-gray-400" /> Laatikkovuokra
          {rental && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {STATUS_LABELS[rental.status]}
            </span>
          )}
        </h2>
        <Link href="/hallinta/inventaario" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Inventaario →
        </Link>
      </div>

      {warning && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}
        </div>
      )}
      {rental?.datesEstimated && rental.status === 'RESERVED' && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
          Päivät on arvioitu lomakkeelta. Sovi toimitus asiakkaan kanssa ja tallenna oikeat päivät.
        </p>
      )}
      {rental?.status === 'RETURNED' && (
        <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
          Palautui {rental.returnedQty ?? rental.quantity}/{rental.quantity}
          {rental.lostQty > 0 && <b className="text-red-600 dark:text-red-400"> · puuttui {rental.lostQty}, korvausmaksu {rental.lostQty * BOX_RENTAL.lostBoxFee} € (sis. ALV)</b>}
        </p>
      )}

      {editable ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <div>
            <label className={labelClass} htmlFor="br-qty">Laatikoita</label>
            <input id="br-qty" type="number" min={1} inputMode="numeric" className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="br-delivery">Toimitus</label>
            <input id="br-delivery" type="date" className={inputClass} value={deliveryKey} onChange={(e) => setDeliveryKey(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="br-pickup">Nouto</label>
            <input id="br-pickup" type="date" className={inputClass} value={pickupKey} min={deliveryKey} onChange={(e) => setPickupKey(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending || !dirty}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {rental ? 'Tallenna' : 'Lisää vuokraus'}
            </button>
          </div>
          <div className="sm:col-span-4">
            <label className={labelClass} htmlFor="br-notes">Lisätiedot (esim. ovikoodi, toimitusaika)</label>
            <input id="br-notes" type="text" maxLength={1000} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </form>
      ) : (
        rental && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {rental.quantity} kpl · toimitus {formatDateKey(rental.deliveryKey)} · nouto {formatDateKey(rental.pickupKey)}
          </p>
        )
      )}

      {rental && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
          <RentalActions id={rental.id} status={rental.status} quantity={rental.quantity} />
        </div>
      )}
    </section>
  );
}
