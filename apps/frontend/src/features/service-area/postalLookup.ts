// Coarse mapping from the first two digits of a Finnish postal code to its
// general region (maakunta). Finnish postal codes are allocated in geographic
// blocks, so this gives a reasonable area name without claiming street-level
// accuracy — good enough for "do you operate near me?" style lookups.
const REGION_RANGES: Array<{ from: number; to: number; region: string }> = [
  { from: 0, to: 9, region: 'Uusimaa' },
  { from: 10, to: 19, region: 'Kanta-Häme / Länsi-Uusimaa' },
  { from: 20, to: 29, region: 'Varsinais-Suomi' },
  { from: 30, to: 39, region: 'Pirkanmaa' },
  { from: 40, to: 49, region: 'Keski-Suomi' },
  { from: 50, to: 59, region: 'Etelä-Savo / Etelä-Karjala' },
  { from: 60, to: 69, region: 'Etelä-Pohjanmaa / Pohjanmaa' },
  { from: 70, to: 79, region: 'Pohjois-Savo' },
  { from: 80, to: 89, region: 'Pohjois-Karjala / Kainuu' },
  { from: 90, to: 99, region: 'Pohjois-Pohjanmaa / Lappi' },
];

export type PostalLookupResult = {
  valid: boolean;
  region?: string;
};

export function lookupPostalCode(rawInput: string): PostalLookupResult {
  const code = rawInput.trim();

  if (!/^\d{5}$/.test(code)) {
    return { valid: false };
  }

  const prefix = Number(code.slice(0, 2));
  const match = REGION_RANGES.find((r) => prefix >= r.from && prefix <= r.to);

  return { valid: true, region: match?.region };
}
