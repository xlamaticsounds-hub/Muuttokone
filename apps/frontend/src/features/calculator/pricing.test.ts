import { describe, expect, it } from 'vitest';
import { CalculatorSchema, MAX_DISTANCE_KM, URBAN_DRIVE_KM, calculateMovingPrice, estimateDriveHours } from './pricing';

// "Tyypillinen 1h" -pikavalinta laskurista (Calculator.tsx): yksiö, hissit molemmissa päissä, 2. kerros.
const STUDIO_ITEMS = { sofa_2: 1, bed_140: 1, wardrobe_assembled: 1, coffee_table: 1, bookshelf: 1, nightstand: 1, dresser_small: 1, box_standard: 10 };

const studioMove = (distanceKm: number, over: Record<string, unknown> = {}) =>
  calculateMovingPrice(
    CalculatorSchema.parse({
      serviceType: 'moving',
      movingPackage: 'full_service',
      addressFrom: 'Tampere',
      addressTo: 'Helsinki',
      distanceKm,
      apartmentSize: '1h',
      elevatorFrom: true,
      elevatorTo: true,
      floorFrom: 2,
      floorTo: 2,
      furnitureItems: STUDIO_ITEMS,
      ...over,
    }),
  );

describe('estimateDriveHours', () => {
  it('lyhyillä matkoilla (alle 40 km) täsmälleen sama kuin vanha kaava km/40 + 0,25 — lyhyiden muuttojen hinnat eivät muutu', () => {
    for (const km of [0, 1, 5, 19, 25, 40]) {
      expect(estimateDriveHours(km)).toBeCloseTo(km / 40 + 0.25, 10);
    }
  });

  it('pitkällä matkalla ajetaan valtatiellä: Tampere–Helsinki (180 km) on 3 h eikä 4,75 h', () => {
    expect(estimateDriveHours(180)).toBeCloseTo(3.0, 10);
    expect(estimateDriveHours(180)).toBeLessThan(180 / 40 + 0.25);
  });

  it('on jatkuva rajalla (ei hyppyä) ja kasvaa aina matkan mukana', () => {
    expect(estimateDriveHours(URBAN_DRIVE_KM + 0.001) - estimateDriveHours(URBAN_DRIVE_KM)).toBeLessThan(0.001);
    let previous = estimateDriveHours(0);
    for (let km = 1; km <= MAX_DISTANCE_KM; km += 7) {
      const hours = estimateDriveHours(km);
      expect(hours).toBeGreaterThanOrEqual(previous);
      previous = hours;
    }
  });

  it('negatiivinen matka käsitellään nollana', () => {
    expect(estimateDriveHours(-10)).toBe(estimateDriveHours(0));
  });
});

describe('pitkän matkan muutto (yksiö)', () => {
  it('Tampere–Helsinki (180 km) ei ole enää yli 800 € vaan noin 690 € (vanha kaava antoi 912 €)', () => {
    const price = studioMove(180);
    expect(price.total).toBeLessThan(750);
    expect(price.total).toBeGreaterThan(550);
  });

  it('ajoaika näkyy erittelyssä uuden kaavan mukaisena', () => {
    expect(studioMove(180).details.timeBreakdown.driveTimeHours).toBeCloseTo(3.0, 10);
  });

  it('hinta ei koskaan laske kun matka kasvaa', () => {
    let previous = 0;
    for (const km of [1, 5, 19, 40, 41, 60, 100, 180, 300, 600, 1000]) {
      const total = studioMove(km).total;
      expect(total).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });

  it('erittely täsmää hintaan myös pitkällä matkalla', () => {
    const { impactBreakdown } = studioMove(180).details;
    const sum = Object.values(impactBreakdown).reduce((a, b) => a + (b ?? 0), 0);
    expect(sum).toBeCloseTo(studioMove(180).normalPriceTotal, 6);
  });

  it('yli 500 km muutto maksaa selvästi enemmän kuin 5 km (aiemmin yli 500 km jäi oletusmatkalle 5 km)', () => {
    expect(studioMove(610).total).toBeGreaterThan(studioMove(5).total * 5);
  });
});

describe('MAX_DISTANCE_KM', () => {
  it('kattaa koko Suomen (Helsinki–Utsjoki noin 1 200 km)', () => {
    expect(MAX_DISTANCE_KM).toBeGreaterThanOrEqual(1200);
  });
});
