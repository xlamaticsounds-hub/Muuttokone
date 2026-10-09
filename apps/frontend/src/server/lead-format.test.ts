import { describe, expect, it } from 'vitest';
import { CalculatorSchema, calculateMovingPrice } from '@/features/calculator/pricing';
import { defaultFinalPrice, parseEuroAmount, partnerDiscountNote, recomputeLeadPrice } from './lead-format';

// Laskurin varauksen formData sellaisena kuin se saapuu /api/submit-reitille (JSON):
// päivämäärä merkkijonona, yhteystiedot mukana, selaimen oma hinta-arvio mukana.
const bookingPayload = {
  serviceType: 'moving',
  movingPackage: 'full_service',
  addressFrom: 'Mannerheimintie 1, Helsinki',
  addressTo: 'Tapiolantie 5, Espoo',
  additionalStops: [],
  distanceKm: 25,
  driverCount: '1',
  apartmentSize: '2h',
  floorFrom: 2,
  elevatorFrom: true,
  floorTo: 0,
  elevatorTo: true,
  carryDistanceFrom: '<10',
  carryDistanceTo: '<10',
  boxCount: 30,
  heavyItems: [],
  furnitureItems: { sofa_3: 1, bed_160: 1, box_standard: 30, fridge: 1 },
  customItems: [],
  photos: [],
  needsPacking: false,
  needsCleaning: false,
  services: [],
  selectedWasteTypes: [],
  needsBoxRental: false,
  boxRentalCount: 0,
  boxRentalDays: 14,
  date: '2026-11-17T00:00:00.000Z',
  preferredTime: '09:00',
  contactName: 'Matti Meikäläinen',
  contactEmail: 'matti@example.com',
  contactPhone: '040 123 4567',
  price: 1, // selaimen lähettämä hinta — ei saa vaikuttaa mihinkään
  priceRangeLow: 1,
  priceRangeHigh: 2,
  gdpr_consent: true,
};

const expected = calculateMovingPrice(
  CalculatorSchema.parse({ ...bookingPayload, date: new Date(bookingPayload.date), contactEmail: undefined }),
);

describe('recomputeLeadPrice', () => {
  it('liidi ilman koodia: hinta on täsmälleen laskurin hinta, ei alennuskenttiä', () => {
    const result = recomputeLeadPrice(bookingPayload);
    expect(result).toEqual({
      price: expected.total,
      priceRangeLow: expected.priceRangeLow,
      priceRangeHigh: expected.priceRangeHigh,
      discount: null,
    });
  });

  it('ei luota selaimen lähettämään hintaan', () => {
    const result = recomputeLeadPrice({ ...bookingPayload, price: 10, priceRangeLow: 5, priceRangeHigh: 15 });
    expect(result?.price).toBe(expected.total);
  });

  it('koodilla: hinta ja haarukka ovat alennettuja', () => {
    const result = recomputeLeadPrice(bookingPayload, 10);
    const discountAmount = Math.round(expected.total * 0.1);
    expect(result?.discount).toMatchObject({
      discountPercent: 10,
      priceBeforeDiscount: Math.round(expected.total),
      discountAmount,
      priceAfterDiscount: Math.round(expected.total) - discountAmount,
    });
    expect(result?.price).toBe(Math.round(expected.total) - discountAmount);
    expect(result?.priceRangeLow).toBe(expected.priceRangeLow - discountAmount);
    expect(result?.priceRangeHigh).toBe(expected.priceRangeHigh - discountAmount);
  });

  it('alennusprosentti 0 tai null ei muuta hintaa', () => {
    expect(recomputeLeadPrice(bookingPayload, 0)?.discount).toBeNull();
    expect(recomputeLeadPrice(bookingPayload, null)?.price).toBe(expected.total);
  });

  it('kestää tyhjän sähköpostin ja null-kentät (eivät vaikuta hintaan)', () => {
    const result = recomputeLeadPrice({ ...bookingPayload, contactEmail: '', squareMeters: null });
    expect(result?.price).toBe(expected.total);
  });

  it('virheellinen päivämäärä lasketaan kuin päivää ei olisi valittu', () => {
    const noDate = calculateMovingPrice(
      CalculatorSchema.parse({ ...bookingPayload, date: undefined, contactEmail: undefined }),
    );
    expect(recomputeLeadPrice({ ...bookingPayload, date: 'ei päivä' })?.price).toBe(noDate.total);
  });

  it('palauttaa null muulle kuin laskurin liidille', () => {
    expect(recomputeLeadPrice({ kind: 'api-lead', payload: { name: 'Maija' } })).toBeNull();
  });
});

describe('parseEuroAmount', () => {
  it.each([
    ['648', 648],
    ['648,50', 648.5],
    ['1 124,06 €', 1124.06],
    ['1 124,06', 1124.06],
    ['648.5', 648.5],
    [648.123, 648.12],
  ])('%j -> %d', (input, expected) => {
    expect(parseEuroAmount(input)).toBe(expected);
  });

  it.each(['', 'abc', '12,345', '-5', '1.2.3', null, undefined, Number.NaN])('hylkää %j', (input) => {
    expect(parseEuroAmount(input)).toBeNull();
  });
});

describe('defaultFinalPrice', () => {
  const lead = { status: 'WON', finalPrice: null, priceAfterDiscount: null, formData: JSON.stringify({ price: 719.6 }) };

  it('laskurin arvio pyöristettynä, kun muuta ei ole', () => {
    expect(defaultFinalPrice(lead)).toBe(720);
  });

  it('kumppanialennuksen jälkeinen hinta ennen laskurin arviota', () => {
    expect(defaultFinalPrice({ ...lead, priceAfterDiscount: 648 })).toBe(648);
  });

  it('ihmisen vahvistama kiinteä hinta ensin', () => {
    const formData = JSON.stringify({ price: 719.6, confirmedPrice: '690' });
    expect(defaultFinalPrice({ ...lead, priceAfterDiscount: 648, formData })).toBe(690);
  });

  it('vahvistettu haarukka ei kelpaa oletukseksi', () => {
    const formData = JSON.stringify({ price: 719.6, confirmedPrice: '650–700' });
    expect(defaultFinalPrice({ ...lead, priceAfterDiscount: 648, formData })).toBe(648);
  });

  it('jo toteutuneella tallennettu lopullinen hinta', () => {
    expect(defaultFinalPrice({ ...lead, status: 'COMPLETED', finalPrice: 655.5, priceAfterDiscount: 648 })).toBe(655.5);
  });

  it('kumotun toteutumisen vanha hinta ei ohita vahvistettua hintaa', () => {
    const formData = JSON.stringify({ price: 719.6, confirmedPrice: '650' });
    expect(defaultFinalPrice({ ...lead, status: 'WON', finalPrice: 500, formData })).toBe(650);
    expect(defaultFinalPrice({ ...lead, status: 'WON', finalPrice: 500, priceAfterDiscount: 648 })).toBe(648);
  });

  it('null kun hintaa ei ole lainkaan', () => {
    expect(defaultFinalPrice({ status: 'NEW', finalPrice: null, priceAfterDiscount: null, formData: null })).toBeNull();
  });
});

describe('partnerDiscountNote', () => {
  const lead = { discountCode: 'KIINTEISTOMAAILMA', discountPercent: 10, discountAmount: 72 };

  it('laskurin arviolle summa mukaan', () => {
    expect(partnerDiscountNote(lead, 'Kiinteistömaailma', true)).toBe(
      'Hinnassa on huomioitu Kiinteistömaailma-etu -10 % (-72 €).',
    );
  });

  it('vahvistetulle hinnalle ilman summaa', () => {
    expect(partnerDiscountNote(lead, 'Kiinteistömaailma', false)).toBe('Hinnassa on huomioitu Kiinteistömaailma-etu -10 %.');
  });

  it('ei huomautusta ilman koodia', () => {
    expect(partnerDiscountNote({ discountCode: null, discountPercent: null, discountAmount: null }, null, true)).toBeNull();
  });

  it('ei huomautusta jos alennusta ei saatu laskettua varauksessa (hinta on alentamaton)', () => {
    const notComputed = { discountCode: 'KIINTEISTOMAAILMA', discountPercent: 10, discountAmount: null };
    expect(partnerDiscountNote(notComputed, 'Kiinteistömaailma', true)).toBeNull();
    expect(partnerDiscountNote(notComputed, 'Kiinteistömaailma', false)).toBeNull();
  });
});

describe('defaultFinalPrice — puuttuvat kentät', () => {
  it('kestää undefined-kentät (paikallinen mock-tietokanta ei aseta null-arvoja)', () => {
    const lead = { formData: JSON.stringify({ price: 719.6 }) } as unknown as Parameters<typeof defaultFinalPrice>[0];
    expect(defaultFinalPrice(lead)).toBe(720);
  });
});
