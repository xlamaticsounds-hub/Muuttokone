import { describe, expect, it } from 'vitest';
import { DEFAULT_GOOGLE_RATING, formatRating, ratingProblem, shouldShowRating } from './google-rating';

describe('arvosanamerkintä', () => {
  it('muotoilee suomeksi yhdellä desimaalilla ja mainitsee lähteet, ei arvostelujen määrää', () => {
    expect(formatRating({ rating: 5 })).toEqual({ score: '5,0', label: 'Google ja Muuttomaailma' });
    expect(formatRating({ rating: 4.86 }).score).toBe('4,9');
  });

  it('näytetään vain hyvällä keskiarvolla', () => {
    expect(shouldShowRating(DEFAULT_GOOGLE_RATING)).toBe(true);
    expect(shouldShowRating({ rating: 3.9 })).toBe(false);
  });

  it('tarkistaa hallinnasta tallennettavan keskiarvon', () => {
    expect(ratingProblem({ rating: 4.8 })).toBeNull();
    expect(ratingProblem({ rating: 6 })).not.toBeNull();
    expect(ratingProblem({ rating: Number.NaN })).not.toBeNull();
  });
});
