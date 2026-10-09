import { describe, expect, it } from 'vitest';
import { CalculatorSchema, calculateMovingPrice, type CalculatorData } from './pricing';
import { BOX_RENTAL } from './boxRental';
import {
  checkDiscountCode,
  computeCommission,
  computePartnerDiscount,
  discountLabel,
  normalizeDiscountCode,
  type DiscountCodeRecord,
} from './discount';

const SATURDAY_NO_DATE_DISCOUNT = new Date('2026-11-07T00:00:00Z'); // la, ei kuun puolivälin bonusta -> 0 %
const TUESDAY_MID_MONTH = new Date('2026-11-17T00:00:00Z'); // ti 10 % + kuun puoliväli 5 % = 15 %

function move(overrides: Partial<CalculatorData> = {}): CalculatorData {
  return CalculatorSchema.parse({
    serviceType: 'moving',
    movingPackage: 'full_service',
    addressFrom: 'Mannerheimintie 1, Helsinki',
    addressTo: 'Tapiolantie 5, Espoo',
    distanceKm: 25,
    apartmentSize: '2h',
    floorFrom: 2,
    elevatorFrom: true,
    floorTo: 0,
    elevatorTo: true,
    furnitureItems: { sofa_3: 1, bed_160: 1, box_standard: 30, fridge: 1, dining_table_small: 1, kitchen_chair: 4 },
    date: SATURDAY_NO_DATE_DISCOUNT,
    ...overrides,
  });
}

const KM_CODE: DiscountCodeRecord = {
  code: 'KIINTEISTOMAAILMA',
  partner: 'Kiinteistömaailma',
  office: null,
  agentName: null,
  discountPercent: 10,
  commissionPercent: 5,
  active: true,
  validFrom: null,
  validUntil: null,
};

describe('normalizeDiscountCode', () => {
  it('ei välitä kirjainkoosta eikä ylimääräisistä välilyönneistä', () => {
    expect(normalizeDiscountCode('KIINTEISTOMAAILMA')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('kiinteistomaailma')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('  KiinteistoMaailma ')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('kiinteisto maailma')).toBe('KIINTEISTOMAAILMA');
  });

  it('ääkköset kelpaavat: "Kiinteistömaailma" = KIINTEISTOMAAILMA', () => {
    expect(normalizeDiscountCode('Kiinteistömaailma')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('KIINTEISTÖMAAILMA')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('kiinteistömaailma')).toBe('KIINTEISTOMAAILMA');
    expect(normalizeDiscountCode('Åbo-Ääni')).toBe('ABO-AANI');
  });

  it('palauttaa tyhjän muille kuin merkkijonoille', () => {
    expect(normalizeDiscountCode(undefined)).toBe('');
    expect(normalizeDiscountCode(null)).toBe('');
    expect(normalizeDiscountCode(123)).toBe('');
    expect(normalizeDiscountCode('   ')).toBe('');
  });
});

describe('checkDiscountCode', () => {
  const now = new Date('2026-10-09T12:00:00Z');

  it('hyväksyy aktiivisen koodin ilman aikarajoja', () => {
    expect(checkDiscountCode(KM_CODE, now)).toEqual({ ok: true });
  });

  it('hylkää tuntemattoman koodin', () => {
    expect(checkDiscountCode(null, now)).toMatchObject({ ok: false, reason: 'not_found' });
  });

  it('hylkää deaktivoidun koodin', () => {
    expect(checkDiscountCode({ ...KM_CODE, active: false }, now)).toMatchObject({ ok: false, reason: 'inactive' });
  });

  it('hylkää koodin jonka voimassaolo ei ole alkanut', () => {
    const record = { ...KM_CODE, validFrom: new Date('2026-11-01T00:00:00Z') };
    expect(checkDiscountCode(record, now)).toMatchObject({ ok: false, reason: 'not_started' });
  });

  it('hylkää vanhentuneen koodin', () => {
    const record = { ...KM_CODE, validUntil: new Date('2026-10-01T00:00:00Z') };
    expect(checkDiscountCode(record, now)).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('hyväksyy koodin voimassaoloikkunan sisällä', () => {
    const record = {
      ...KM_CODE,
      validFrom: new Date('2026-10-01T00:00:00Z'),
      validUntil: new Date('2026-12-31T21:59:59Z'),
    };
    expect(checkDiscountCode(record, now)).toEqual({ ok: true });
  });
});

describe('discountLabel', () => {
  it('muodostaa asiakkaalle näytettävän tekstin', () => {
    expect(discountLabel('Kiinteistömaailma', 10)).toBe('Kiinteistömaailma-etu -10 %');
    expect(discountLabel('Kiinteistömaailma', 7.5)).toBe('Kiinteistömaailma-etu -7,5 %');
  });
});

describe('computePartnerDiscount — pyöristys', () => {
  it('pyöristää täysiin euroihin ja luvut täsmäävät keskenään', () => {
    const result = computePartnerDiscount({ total: 723.4, addOnsTotal: 0 }, 10);
    expect(result).toMatchObject({ priceBeforeDiscount: 723, discountAmount: 72, priceAfterDiscount: 651 });
  });

  it('pyöristää puolikkaat ylöspäin lähimpään euroon', () => {
    const result = computePartnerDiscount({ total: 725, addOnsTotal: 0 }, 10);
    expect(result).toMatchObject({ priceBeforeDiscount: 725, discountAmount: 73, priceAfterDiscount: 652 });
  });

  it('pitää aina voimassa: ennen - alennus = jälkeen, kaikki kokonaislukuja', () => {
    for (const total of [99, 189.99, 299, 487.31, 599, 1124.06, 2310.5]) {
      const r = computePartnerDiscount({ total, addOnsTotal: 0 }, 10);
      expect(Number.isInteger(r.priceBeforeDiscount)).toBe(true);
      expect(Number.isInteger(r.discountAmount)).toBe(true);
      expect(r.priceBeforeDiscount - r.discountAmount).toBe(r.priceAfterDiscount);
    }
  });
});

describe('computePartnerDiscount — laskentasäännöt oikealla hinnoittelulla', () => {
  it('alennus koskee koko muuton hintaa kilometrikorvaus mukaan lukien', () => {
    const price = calculateMovingPrice(move({ distanceKm: 60 }));
    expect(price.distanceCost).toBeGreaterThan(0);

    const discount = computePartnerDiscount(price, 10);
    expect(discount.discountableAmount).toBeCloseTo(price.total, 6);
    expect(discount.discountAmount).toBe(Math.round(price.total * 0.1));

    const shortMove = computePartnerDiscount(calculateMovingPrice(move({ distanceKm: 5 })), 10);
    expect(discount.discountAmount).toBeGreaterThan(shortMove.discountAmount);
  });

  it('lasketaan päiväalennuksen jälkeen (alennukset kertautuvat)', () => {
    const price = calculateMovingPrice(move({ date: TUESDAY_MID_MONTH }));
    expect(price.dateDiscountAmount).toBeGreaterThan(0);

    const discount = computePartnerDiscount(price, 10);
    expect(discount.discountAmount).toBe(Math.round(price.total * 0.1));
    expect(discount.priceAfterDiscount).toBe(Math.round(price.total) - Math.round(price.total * 0.1));
  });

  it('saa viedä 4h+ -muuton alle 899 € vähimmäishinnan', () => {
    // Pieni 4h+ -muutto hiljaisena päivänä: päiväalennus painaisi alle 899 €, joten tiukka minimi laukeaa
    const price = calculateMovingPrice(
      move({ apartmentSize: '4h+', furnitureItems: { sofa_3: 1 }, distanceKm: 5, date: TUESDAY_MID_MONTH }),
    );
    expect(price.normalPriceTotal * 0.85).toBeLessThan(899);
    expect(price.total).toBe(899);

    const discount = computePartnerDiscount(price, 10);
    expect(discount.priceAfterDiscount).toBe(809);
  });

  it('ei koske muuttosiivousta eikä laatikkovuokraa', () => {
    const price = calculateMovingPrice(
      move({
        needsCleaning: true,
        needsBoxRental: true,
        boxRentalCount: BOX_RENTAL.minBoxes,
        boxRentalDays: BOX_RENTAL.defaultDays,
      }),
    );
    expect(price.addOnsTotal).toBeCloseTo(169, 6); // 2h-siivous, ei päiväalennusta
    expect(price.boxRental?.total).toBeGreaterThan(0);

    const moveOnly = price.total - 169 - price.boxRental!.total;
    const discount = computePartnerDiscount(price, 10);
    expect(discount.discountableAmount).toBeCloseTo(moveOnly, 6);
    expect(discount.discountAmount).toBe(Math.round(moveOnly * 0.1));
    expect(discount.priceBeforeDiscount).toBe(Math.round(price.total));
  });

  it('siivouksen osuus seuraa päiväalennusta', () => {
    const price = calculateMovingPrice(move({ needsCleaning: true, date: TUESDAY_MID_MONTH }));
    expect(price.addOnsTotal).toBeCloseTo(169 * 0.85, 6);
  });

  it('ei koske kierrätyksen jätemaksuja', () => {
    const price = calculateMovingPrice(move({ serviceType: 'recycling', selectedWasteTypes: ['sekajate'] }));
    expect(price.addOnsTotal).toBeCloseTo(50, 6);
    expect(computePartnerDiscount(price, 10).discountAmount).toBe(Math.round((price.total - 50) * 0.1));
  });

  it('kuljetuksessa ei ole lisäpalveluita', () => {
    const price = calculateMovingPrice(move({ serviceType: 'transport' }));
    expect(price.addOnsTotal).toBe(0);
  });
});

describe('computeCommission', () => {
  it('laskee palkkion lopullisesta hinnasta ilman arvonlisäveroa', () => {
    // 1000 € sis. alv 25,5 % -> 796,81 € alv 0 % -> 5 % = 39,84 €
    expect(computeCommission(1000, 5)).toEqual({ finalPriceNet: 796.81, commissionAmount: 39.84 });
  });

  it('pyöristää senttiin', () => {
    // 809 / 1,255 = 644,6215 -> 644,62; × 5 % = 32,231 -> 32,23
    expect(computeCommission(809, 5)).toEqual({ finalPriceNet: 644.62, commissionAmount: 32.23 });
  });

  it('käyttää koodin omaa palkkioprosenttia', () => {
    expect(computeCommission(1255, 7.5)).toEqual({ finalPriceNet: 1000, commissionAmount: 75 });
  });
});
