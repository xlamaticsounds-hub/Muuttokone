import { describe, expect, it } from 'vitest';
import {
  CLEANING_PRICE,
  CalculatorSchema,
  FULL_SERVICE_MIN_PRICE,
  LONG_MOVE_NO_DISCOUNT_KM,
  LONG_MOVE_QUOTE_KM,
  MAX_DISTANCE_KM,
  PRICING_CONSTANTS,
  URBAN_DRIVE_KM,
  VAT_RATE,
  applianceLines,
  calculateMovingPrice,
  estimateDriveHours,
  withVat,
} from './pricing';
import { computePartnerDiscount } from './discount';

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
  it('Tampere–Helsinki (180 km) on noin 860 € sis. ALV (ALV 0 % -aikana noin 690 €; vanha kaava antoi 912 €)', () => {
    const price = studioMove(180);
    expect(price.total).toBeLessThan(940);
    expect(price.total).toBeGreaterThan(690);
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

describe('ALV-korotus (ALV-velvollisuus 28.10.2026 alkaen)', () => {
  it('lisää vanhoihin ALV 0 % -hintoihin 25,5 %, jotta hinta ilman ALV:ia pysyy ennallaan', () => {
    expect(withVat(189)).toBe(237);
    expect(withVat(0.79, 2)).toBe(0.99);
    expect(PRICING_CONSTANTS.hourlyRateDefault).toBe(162);
  });

  it('vähimmäishinnat pysyivät ennallaan (omistajan päätös): pieni muutto voi yhä maksaa 189 €', () => {
    expect(FULL_SERVICE_MIN_PRICE).toMatchObject({ '1h': 189, '2h': 299, '3h': 599, '4h+': 899 });
    expect(PRICING_CONSTANTS).toMatchObject({ carryingHelpMinimum: 180, driverWithVehicleMinimum: 184 });
    const tiny = calculateMovingPrice(
      CalculatorSchema.parse({ addressFrom: 'A', addressTo: 'B', serviceType: 'moving', apartmentSize: '1h', furnitureItems: { box_standard: 3 }, distanceKm: 2, date: new Date(2026, 10, 28) }),
    );
    expect(tiny.total).toBe(189);
  });

  it('laskettu hinta ilman ALV:ia vastaa vanhaa hintaa (pyöristysten tarkkuudella)', () => {
    // 180 km yksiö: ALV 0 % -aikana noin 687 €
    const price = studioMove(180);
    expect(price.total / (1 + VAT_RATE)).toBeGreaterThan(680);
    expect(price.total / (1 + VAT_RATE)).toBeLessThan(695);
  });
});

describe('laitepalvelut (pesukone, TV) muuton yhteydessä', () => {
  const sat = new Date(2026, 10, 28);
  const tue = new Date(2026, 10, 10); // suurin päiväalennus
  const kaksio = (extra: Record<string, unknown> = {}) =>
    calculateMovingPrice(
      CalculatorSchema.parse({
        addressFrom: 'A',
        addressTo: 'B',
        serviceType: 'moving',
        apartmentSize: '2h',
        furnitureItems: { sofa_3: 1, bed_140: 1, box_standard: 20 },
        distanceKm: 10,
        date: sat,
        ...extra,
      }),
    );

  it('lisää kiinteän kappalehinnan: pesukone 49 €, pieni TV 59 €, iso TV 99 €', () => {
    const base = kaksio();
    const withAppliances = kaksio({ applianceServices: { washing_machine: 1, tv_small: 1, tv_large: 2 } });
    expect(withAppliances.appliances?.total).toBe(49 + 59 + 2 * 99);
    expect(withAppliances.total).toBeCloseTo(base.total + 306, 6);
    expect(withAppliances.addOnsTotal).toBeCloseTo(base.addOnsTotal + 306, 6);
    expect(withAppliances.priceRangeLow).toBeGreaterThanOrEqual(base.priceRangeLow + 306);
  });

  it('ei saa päiväalennusta eikä kumppanialennusta', () => {
    const base = kaksio({ date: tue });
    const withWasher = kaksio({ date: tue, applianceServices: { washing_machine: 1 } });
    expect(withWasher.total - base.total).toBeCloseTo(49, 6);
    expect(computePartnerDiscount(withWasher, 10).discountableAmount).toBeCloseTo(computePartnerDiscount(base, 10).discountableAmount, 6);
  });

  it('ohittaa tuntemattomat, nollat ja liian suuret määrät', () => {
    expect(applianceLines({ washing_machine: 0, sauna: 3, tv_small: 99 })).toEqual([
      { id: 'tv_small', label: 'TV:n seinäasennus, alle 55"', qty: 4, unitPrice: 59, total: 236 },
    ]);
    expect(applianceLines(null)).toEqual([]);
  });

  it('koskee vain muuttoa', () => {
    const transport = calculateMovingPrice(
      CalculatorSchema.parse({ addressFrom: 'A', addressTo: 'B', serviceType: 'transport', apartmentSize: '1h', furnitureItems: { sofa_3: 1 }, distanceKm: 10, applianceServices: { washing_machine: 1 } }),
    );
    expect(transport.appliances).toBeUndefined();
  });
});

describe('tiimipalaverin hintapäätökset 4.11.2026', () => {
  const TUESDAY_MID_MONTH = new Date(2026, 10, 10);
  const local = (city: string, over: Record<string, unknown> = {}) =>
    studioMove(5, { addressFrom: `Katu 1, ${city}`, addressTo: `Tie 2, ${city}`, ...over });

  it('vaikean keikan tuntihinta on 180 €/h', () => {
    expect(PRICING_CONSTANTS.hourlyRateComplex).toBe(180);
    expect(local('Helsinki', { elevatorFrom: false, floorFrom: 4 }).details.laborRate).toBe(180);
  });

  it('muuttosiivous on kiinteähintainen 159/219/274/359 € eikä saa päiväalennusta', () => {
    expect(CLEANING_PRICE).toMatchObject({ '1h': 159, '2h': 219, '3h': 274, '4h+': 359, office: 359 });
    const plain = local('Helsinki', { date: TUESDAY_MID_MONTH });
    const cleaned = local('Helsinki', { date: TUESDAY_MID_MONTH, needsCleaning: true });
    expect(cleaned.total).toBeCloseTo(plain.total + 159, 6);
    expect(cleaned.dateDiscountAmount).toBeCloseTo(plain.dateDiscountAmount, 6);
    const { impactBreakdown } = cleaned.details;
    const sum = Object.values(impactBreakdown).reduce((a, b) => a + (b ?? 0), 0);
    expect(sum).toBeCloseTo(cleaned.normalPriceTotal, 6);
  });

  it(`yli ${LONG_MOVE_NO_DISCOUNT_KM} km muutoissa ei päiväalennusta`, () => {
    expect(studioMove(90, { date: TUESDAY_MID_MONTH }).dateDiscountAmount).toBeGreaterThan(0);
    const long = studioMove(150, { date: TUESDAY_MID_MONTH });
    expect(long.dateDiscountAmount).toBe(0);
    expect(long.dateDiscountLabel).toContain('Pitkä muutto');
  });

  it('tukikohtalisä lisätään kaukaiseen paikalliseen muuttoon ilman alennuksia', () => {
    const helsinki = local('Helsinki', { date: TUESDAY_MID_MONTH });
    const hml = local('Hämeenlinna', { date: TUESDAY_MID_MONTH });
    // 100 + 100 − 5 − 30 = 165 km × 1,88 €/km ≈ 310 €
    expect(helsinki.baseTrip).toBeUndefined();
    expect(hml.baseTrip).toEqual({ place: 'Hämeenlinna', emptyKm: 165, surcharge: 310 });
    expect(hml.total).toBeCloseTo(helsinki.total + 310, 6);
    expect(hml.addOnsTotal).toBeCloseTo(helsinki.addOnsTotal + 310, 6);
    expect(computePartnerDiscount(hml, 10).discountAmount).toBe(computePartnerDiscount(helsinki, 10).discountAmount);
    expect(hml.quoteOnly).toBeUndefined();
  });

  it('kantoavussa tukikohtalisä 1–2 hengen hinnalla', () => {
    expect(local('Hämeenlinna', { movingPackage: 'carrying_help' }).baseTrip?.surcharge).toBe(230);
  });

  it('hyvin kaukaiset ja yli 300 km keikat hinnoitellaan tarjouksella', () => {
    expect(local('Hamina').quoteOnly).toBe('far_from_base'); // lisä 500 € > 400 €
    expect(studioMove(LONG_MOVE_QUOTE_KM + 10).quoteOnly).toBe('long_distance');
    expect(studioMove(180).quoteOnly).toBeUndefined();
  });
});
