import { baseTripSummary, leadBaseTripAdvice } from '@/lib/base-trip';

// Merkki listoihin: keikka on kaukana tukikohdasta. Uusissa laskuriliideissä tukikohtalisä on jo
// hinnassa; vanhoissa se on pelkkä ehdotus, ja ihminen tarkistaa hinnan käsin (ks. lib/base-trip.ts).
export default function BaseTripBadge({
  lead,
}: {
  lead: { fromAddress?: string | null; toAddress?: string | null; formData?: unknown };
}) {
  const advice = leadBaseTripAdvice(lead);
  if (!advice) return null;
  const included = advice.includedInPrice;
  return (
    <span
      title={`Kaukana tukikohdasta: ${baseTripSummary(advice)}`}
      className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-900/40"
    >
      {included != null ? `🚚 Kaukana · lisä ${included} € hinnassa` : `⚠️ Kaukana · lisä noin ${advice.surchargeCrew3} €`}
    </span>
  );
}
