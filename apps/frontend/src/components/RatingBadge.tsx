import { Star } from 'lucide-react';
import { formatRating, shouldShowRating, type GoogleRating } from '@/lib/google-rating';

// "★★★★★ 5,0 · Google ja Muuttomaailma" (lib/google-rating.ts, keskiarvon päivitys hallinnasta).
// Ei hookeja, joten toimii sekä palvelin- että asiakaskomponenteissa.
export default function RatingBadge({ value, tone = 'light' }: { value: GoogleRating; tone?: 'light' | 'dark' }) {
  if (!shouldShowRating(value)) return null;
  const { score, label } = formatRating(value);
  const full = Math.round(value.rating);
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        tone === 'light' ? 'bg-white/15 text-white' : 'bg-white text-black/80 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:text-white/80'
      }`}
    >
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < full ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-400/40'}`} />
        ))}
      </span>
      <span>
        <span className="sr-only">Arvosana </span>
        {score} · {label}
      </span>
    </p>
  );
}
