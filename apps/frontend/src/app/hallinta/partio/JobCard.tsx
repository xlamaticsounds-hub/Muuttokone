import { MapPin, Navigation, Phone } from 'lucide-react';
import type { CrewJob } from '@/server/crew-jobs';

const mapsUrl = (destination: string, origin?: string | null) =>
  `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}&destination=${encodeURIComponent(destination)}`;

function formatDay(dateKey: string | null): string {
  if (!dateKey) return 'Ei päivää';
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
}

function AddressRow({ label, address, floor }: { label: string; address: string; floor: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{address}</p>
        {floor && <p className="text-xs text-gray-600 dark:text-gray-300">{floor}</p>}
      </div>
      <a
        href={mapsUrl(address)}
        target="_blank"
        rel="noreferrer"
        className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
        aria-label={`Navigoi: ${address}`}
      >
        <Navigation className="h-4 w-4" />
        Navigoi
      </a>
    </div>
  );
}

// Yksi keikka partiolle: aika, asiakas (soita), osoitteet navigointilinkein, kerrokset, palvelu, tavarat ja
// toimiston ohjeet. Ei hintoja (crew-jobs.ts).
export default function JobCard({ job, open = false }: { job: CrewJob; open?: boolean }) {
  const hasDetails = job.items.length > 0 || job.extras.length > 0 || Boolean(job.customerMessage);
  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {formatDay(job.dateKey)}
              {job.time ? ` · klo ${job.time}` : ''}
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.customer}</h3>
            {job.service && <p className="text-sm text-gray-600 dark:text-gray-300">{job.service}</p>}
            {job.size && <p className="text-sm text-gray-600 dark:text-gray-300">{job.size}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!job.confirmed && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-900/40">
                Alustava
              </span>
            )}
            {job.phone && (
              <a
                href={`tel:${job.phone.replace(/\s+/g, '')}`}
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Phone className="h-4 w-4" />
                Soita
              </a>
            )}
          </div>
        </div>

        {job.crewNotes && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100">
            <p className="text-xs font-bold uppercase">Ohjeet toimistolta</p>
            <p className="whitespace-pre-wrap">{job.crewNotes}</p>
          </div>
        )}

        <div className="space-y-3">
          {job.fromAddress && <AddressRow label="Mistä" address={job.fromAddress} floor={job.fromFloor} />}
          {job.toAddress && <AddressRow label="Minne" address={job.toAddress} floor={job.toFloor} />}
          {job.fromAddress && job.toAddress && (
            <a
              href={mapsUrl(job.toAddress, job.fromAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
            >
              Reitti kartalla →
            </a>
          )}
        </div>

        {hasDetails && (
          <details open={open} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
            <summary className="cursor-pointer py-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Tavarat ja lisäpalvelut</summary>
            <div className="space-y-2 pb-1 pt-2 text-sm text-gray-700 dark:text-gray-300">
              {job.extras.length > 0 && (
                <ul className="list-inside list-disc">
                  {job.extras.map((extra) => (
                    <li key={extra}>{extra}</li>
                  ))}
                </ul>
              )}
              {job.items.length > 0 && (
                <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
                  {job.items.map((item) => (
                    <li key={item.label}>
                      {item.icon} {item.label} × {item.qty}
                    </li>
                  ))}
                </ul>
              )}
              {job.customerMessage && (
                <p className="whitespace-pre-wrap border-t border-gray-200 pt-2 dark:border-gray-700">
                  <span className="font-semibold">Asiakkaan viesti: </span>
                  {job.customerMessage}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}
