import Link from 'next/link';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import {
  RETURNING_SOON_DAYS,
  availabilityByDay,
  daysBetweenKeys,
  formatDateKey,
  summarizeInventory,
  type InventoryRental,
} from '@/lib/box-inventory';
import { getBoxStockTotal, loadInventoryRentals, syncMissingBoxRentals } from '@/server/box-rentals';
import { BoxStockEditor, RentalActions } from './InventoryActions';

export const dynamic = 'force-dynamic';

const AVAILABILITY_DAYS = 21;
const card = 'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800';

function Tile({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string | null; tone?: 'default' | 'warn' }) {
  return (
    <div className={`${card} p-4`}>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone === 'warn' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</div>}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'red' | 'amber' | 'blue' | 'gray' }) {
  const tones = {
    red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300',
    gray: 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-700/40 dark:text-gray-300',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

function RentalRow({ rental, todayKey }: { rental: InventoryRental; todayKey: string }) {
  const toPickup = daysBetweenKeys(todayKey, rental.pickupKey);
  const toDelivery = daysBetweenKeys(todayKey, rental.deliveryKey);
  return (
    <li className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
      <div className="min-w-0 flex-1">
        <Link href={`/hallinta/liidit/${rental.leadId}`} className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
          {rental.customer}
        </Link>
        <span className="ml-2 font-semibold tabular-nums text-gray-900 dark:text-white">{rental.quantity} kpl</span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
          <span>Toimitus {formatDateKey(rental.deliveryKey)}</span>
          <span>Nouto {formatDateKey(rental.pickupKey)}</span>
          {rental.status === 'DELIVERED' && toPickup < 0 && <Badge tone="red">Nouto myöhässä {-toPickup} pv</Badge>}
          {rental.status === 'DELIVERED' && toPickup >= 0 && toPickup <= RETURNING_SOON_DAYS && (
            <Badge tone="blue">{toPickup === 0 ? 'Nouto tänään' : `Palaa ${toPickup} pv päästä`}</Badge>
          )}
          {rental.status === 'RESERVED' && rental.commitment === 'confirmed' && toDelivery < 0 && <Badge tone="amber">Toimitus merkitsemättä</Badge>}
          {rental.status === 'RESERVED' && toDelivery >= 0 && toDelivery <= 2 && <Badge tone="blue">{toDelivery === 0 ? 'Toimitus tänään' : `Toimitus ${toDelivery} pv päästä`}</Badge>}
          {rental.datesEstimated && rental.status === 'RESERVED' && <Badge tone="gray">päivät arvioita</Badge>}
          {rental.status === 'RETURNED' && rental.lostQty > 0 && <Badge tone="red">puuttui {rental.lostQty}</Badge>}
          {rental.status === 'RETURNED' && rental.lostQty === 0 && <Badge tone="gray">kaikki palautui</Badge>}
        </div>
        {rental.notes && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rental.notes}</p>}
      </div>
      <RentalActions id={rental.id} status={rental.status} quantity={rental.quantity} />
    </li>
  );
}

function Section({
  title,
  rentals,
  todayKey,
  open,
  empty,
  hint,
}: {
  title: string;
  rentals: InventoryRental[];
  todayKey: string;
  open: boolean;
  empty: string;
  hint?: string;
}) {
  const qty = rentals.reduce((s, r) => s + r.quantity, 0);
  return (
    <details open={open} className={`${card} group`}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-gray-900 dark:text-white">
          {title}{' '}
          <span className="font-normal text-gray-500 dark:text-gray-400">
            · {rentals.length} {rentals.length === 1 ? 'vuokraus' : 'vuokrausta'}, {qty} kpl
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180" />
      </summary>
      {hint && <p className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {rentals.length === 0 ? (
        <p className="border-t border-gray-100 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
          {rentals.map((r) => (
            <RentalRow key={r.id} rental={r} todayKey={todayKey} />
          ))}
        </ul>
      )}
    </details>
  );
}

export default async function InventaarioPage() {
  const todayKey = toHelsinkiDateInput(new Date());
  let dbUnavailable = false;
  let total: number | null = null;
  let rentals: InventoryRental[] = [];

  try {
    // Liidit, joilla on laatikkovuokra mutta ei vielä vuokrausriviä (esim. ennen inventaariota tulleet)
    await syncMissingBoxRentals();
    [total, rentals] = await Promise.all([getBoxStockTotal(), loadInventoryRentals()]);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/inventaario] tietokanta ei vastaa', error);
  }

  const stock = total ?? 0;
  const s = summarizeInventory(stock, rentals, todayKey);
  const days = availabilityByDay(stock, rentals, todayKey, AVAILABILITY_DAYS, todayKey);
  const lowLimit = Math.max(1, Math.round(stock * 0.15));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventaario</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Muuttolaatikot: varasto, vuokraukset ja palautukset.</p>
        </div>
        <BoxStockEditor total={total} />
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä.
        </div>
      )}
      {!dbUnavailable && total === null && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
          Aseta ensin varaston koko (kaikki laatikot, myös vuokralla olevat). Sen jälkeen saatavuus ja ylivarausvaroitukset toimivat.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Varastossa nyt"
          value={total !== null ? `${s.inStock}` : '–'}
          sub={total !== null ? `/ ${total} laatikkoa` : 'varaston koko puuttuu'}
          tone={total !== null && s.inStock < 0 ? 'warn' : 'default'}
        />
        <Tile label="Vuokralla" value={`${s.out}`} sub={`${s.current.length} asiakkaalla`} />
        <Tile
          label={`Palaamassa ${RETURNING_SOON_DAYS} pv`}
          value={`${s.returningSoon}`}
          sub={s.overduePickups.length ? `${s.overduePickups.length} noutoa myöhässä` : null}
          tone={s.overduePickups.length ? 'warn' : 'default'}
        />
        <Tile label="Varattu tuleviin" value={`${s.reserved}`} sub={s.tentative ? `+ ${s.tentative} alustavaa` : 'ei alustavia'} />
      </div>

      {(s.overduePickups.length > 0 || s.unmarkedDeliveries.length > 0) && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            {s.overduePickups.length > 0 && (
              <p>
                <b>Myöhässä olevat noudot:</b> {s.overduePickups.map((r) => `${r.customer} (${r.quantity} kpl, ${formatDateKey(r.pickupKey, false)})`).join(', ')}
              </p>
            )}
            {s.unmarkedDeliveries.length > 0 && (
              <p>
                <b>Toimitus merkitsemättä:</b> {s.unmarkedDeliveries.map((r) => `${r.customer} (${formatDateKey(r.deliveryKey, false)})`).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {total !== null && (
        <section className={`${card} p-4`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">Vapaana seuraavat {AVAILABILITY_DAYS} päivää</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pienin vapaa määrä 30 päivän aikana: <b className={s.minFreeNext30 < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>{s.minFreeNext30} kpl</b>
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const tone =
                d.free < 0
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : d.free < lowLimit
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white';
              return (
                <div
                  key={d.key}
                  className={`rounded-md border px-1 py-1.5 text-center ${tone}`}
                  title={`${formatDateKey(d.key)}: vapaana ${d.free}, varattu ${d.booked}${d.tentative ? `, alustavia ${d.tentative}` : ''}`}
                >
                  <div className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{formatDateKey(d.key)}</div>
                  <div className="text-sm font-bold tabular-nums">{d.free}</div>
                  {d.tentative > 0 && <div className="hidden text-[10px] leading-tight text-gray-500 sm:block dark:text-gray-400">+{d.tentative} alust.</div>}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Vapaana = varasto − toimitetut − vahvistetut varaukset. Alustavat (uudet ja tarjotut liidit) näkyvät erikseen eivätkä vähennä vapaita.
          </p>
        </section>
      )}

      <div className="space-y-3">
        <Section title="Nykyiset vuokraukset" rentals={s.current} todayKey={todayKey} open empty="Ei laatikoita asiakkailla." />
        <Section
          title="Tulevat vuokraukset"
          rentals={s.upcoming}
          todayKey={todayKey}
          open
          empty="Ei vahvistettuja tulevia vuokrauksia."
          hint="Vahvistetut liidit (kalenterissa). Päivät tulevat lomakkeelta arviona: korjaa ne liidin sivulla, kun toimitus on sovittu."
        />
        <Section
          title="Alustavat"
          rentals={s.tentativeList}
          todayKey={todayKey}
          open={false}
          empty="Ei alustavia vuokrauksia."
          hint="Uudet ja tarjotut liidit. Eivät varaa laatikoita ennen kuin liidi vahvistetaan."
        />
        <Section title="Palautetut" rentals={s.returned} todayKey={todayKey} open={false} empty="Ei vielä palautettuja." hint="20 viimeisintä." />
      </div>
    </div>
  );
}
