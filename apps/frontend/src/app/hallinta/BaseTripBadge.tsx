import { baseTripSummary, leadBaseTripAdvice } from '@/lib/base-trip';

// Merkki listoihin: keikka on kaukana tukikohdasta, joten laskurin hinta ei kata tyhjää ajoa.
// Pelkkä varoitus — ihminen tarkistaa hinnan käsin (ks. lib/base-trip.ts).
export default function BaseTripBadge({
  lead,
}: {
  lead: { fromAddress?: string | null; toAddress?: string | null; formData?: unknown };
}) {
  const advice = leadBaseTripAdvice(lead);
  if (!advice) return null;
  return (
    <span
      title={`Kaukana tukikohdasta: ${baseTripSummary(advice)}`}
      className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-900/40"
    >
      ⚠️ Kaukana · lisä noin {advice.surcharge} €
    </span>
  );
}
