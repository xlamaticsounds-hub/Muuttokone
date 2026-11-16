// Arvosanamerkintä sivustolle: "★★★★★ 5,0 · Google ja Muuttomaailma" (omistajan toive 15.11.2026:
// pelkkä arvosana ja lähteet, ei arvostelujen määrää). Keskiarvo päivitetään käsin hallinnasta
// (Asetukset → Arvosana sivustolla), koska arvosteluja ei haeta rajapinnasta. Merkintä on pelkkä
// näkyvä teksti: muualta koottuja arvosteluja ei saa merkitä omalle sivulle AggregateRating-schemana.

export const GOOGLE_RATING_KEY = 'reviews.rating';

/** Arvostelulähteet, jotka merkinnässä mainitaan. */
export const RATING_SOURCES = 'Google ja Muuttomaailma';

export type GoogleRating = {
  /** Keskiarvo 1–5, yksi desimaali. */
  rating: number;
};

/** Lähtöarvo 15.11.2026: 5,0 Googlessa (16 arvostelua) ja Muuttomaailmassa. */
export const DEFAULT_GOOGLE_RATING: GoogleRating = { rating: 5 };

/** Merkintä näytetään vain hyvällä keskiarvolla. */
export function shouldShowRating(value: GoogleRating): boolean {
  return Number.isFinite(value.rating) && value.rating >= 4;
}

export function formatRating(value: GoogleRating): { score: string; label: string } {
  return {
    score: value.rating.toLocaleString('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    label: RATING_SOURCES,
  };
}

/** Tarkistaa hallinnasta tallennettavan arvon. null = kelvollinen, muuten virheilmoitus. */
export function ratingProblem(value: GoogleRating): string | null {
  if (!Number.isFinite(value.rating) || value.rating < 1 || value.rating > 5) return 'Keskiarvon pitää olla 1–5.';
  return null;
}
