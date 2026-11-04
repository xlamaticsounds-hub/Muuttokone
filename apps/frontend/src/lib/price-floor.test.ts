import { describe, expect, it } from 'vitest';
import { computePriceFloor, estimateFloorJob, ownerHourlyAt, parsePriceFloorCosts, type PriceFloorCosts } from './price-floor';

// Esimerkkiluvut testejä varten (eivät yrityksen oikeat kulut, jotka tallennetaan hallinnassa).
const COSTS: PriceFloorCosts = { hiredPerHour: 20, kmCost: 0.5, suppliesPerJob: 10, muuttomaailmaFee: 25, ownerFloorPerHour: 30 };
const JOB = { hoursPerPerson: 4, kmDriven: 40, hired: 1, owners: 2, muuttomaailma: false };

describe('computePriceFloor', () => {
  it('laskee lattian kuluista ja omistajien vähimmäistuntiansiosta ALV:n kanssa', () => {
    // kulut 1 × 20 × 4 + 40 × 0,5 + 10 = 110 €, omistajat 30 × 2 × 4 = 240 € → 350 × 1,255 = 439,25 → 440
    expect(computePriceFloor(JOB, COSTS)).toEqual({ floor: 440, costs: 110 });
  });

  it('Muuttomaailman provisio nostaa lattiaa', () => {
    // (110 + 25 + 240) × 1,255 = 470,6 → 475
    expect(computePriceFloor({ ...JOB, muuttomaailma: true }, COSTS).floor).toBe(475);
  });

  it('omistajan tuntiansio hintalattialla on vähintään tavoite', () => {
    const { floor } = computePriceFloor(JOB, COSTS);
    expect(ownerHourlyAt(floor, JOB, COSTS)).toBeGreaterThanOrEqual(30);
    expect(ownerHourlyAt(floor - 50, JOB, COSTS)).toBeLessThan(30);
    expect(ownerHourlyAt(400, { ...JOB, owners: 0 }, COSTS)).toBeNull();
  });
});

describe('parsePriceFloorCosts', () => {
  it('hyväksyy numerot ja pilkulliset merkkijonot', () => {
    expect(parsePriceFloorCosts({ ...COSTS, kmCost: '0,5' })).toEqual(COSTS);
  });

  it('hylkää puuttuvan, negatiivisen tai liian suuren arvon', () => {
    expect(parsePriceFloorCosts(null)).toBeNull();
    expect(parsePriceFloorCosts({ ...COSTS, hiredPerHour: undefined })).toBeNull();
    expect(parsePriceFloorCosts({ ...COSTS, kmCost: -1 })).toBeNull();
    expect(parsePriceFloorCosts({ ...COSTS, ownerFloorPerHour: 'abc' })).toBeNull();
    expect(parsePriceFloorCosts({ ...COSTS, hiredPerHour: 5000 })).toBeNull();
  });
});

describe('estimateFloorJob', () => {
  const calculatorLead = (over: Record<string, unknown> = {}, from = 'Katu 1, Helsinki', to = 'Tie 2, Espoo') => ({
    fromAddress: from,
    toAddress: to,
    formData: JSON.stringify({
      serviceType: 'moving',
      movingPackage: 'full_service',
      addressFrom: from,
      addressTo: to,
      apartmentSize: '2h',
      distanceKm: 15,
      furnitureItems: { sofa_3: 1, bed_140: 1, box_standard: 20 },
      contactEmail: '',
      ...over,
    }),
  });

  it('laskurin liidi: tunnit ja km laskurin arviosta, miehitys 1 palkattu + 2 omistajaa', () => {
    const job = estimateFloorJob(calculatorLead(), false);
    expect(job.fromCalculator).toBe(true);
    expect(job).toMatchObject({ hired: 1, owners: 2, kmDriven: 35, muuttomaailma: false });
    expect(job.hoursPerPerson).toBeGreaterThan(1);
  });

  it('kaukainen keikka: km sisältää tyhjän ajon tukikohdasta ja takaisin', () => {
    const job = estimateFloorJob(calculatorLead({ distanceKm: 5 }, 'Katu 1, Hämeenlinna', 'Tie 2, Hämeenlinna'), false);
    expect(job.kmDriven).toBe(205);
    expect(job.hoursPerPerson).toBeGreaterThan(estimateFloorJob(calculatorLead({ distanceKm: 5 }), false).hoursPerPerson + 2);
  });

  it('kantoapu 1 + 1, kuljettaja + auto omistaja yksin', () => {
    expect(estimateFloorJob(calculatorLead({ movingPackage: 'carrying_help' }), false)).toMatchObject({ hired: 1, owners: 1 });
    expect(estimateFloorJob(calculatorLead({ movingPackage: 'driver_with_vehicle' }), false)).toMatchObject({ hired: 0, owners: 1 });
  });

  it('muualta tullut keikka: oletukset käsin muokattaviksi', () => {
    const job = estimateFloorJob({ fromAddress: 'A', toAddress: 'B', formData: { external: { source: 'muuttomaailma' } } }, true);
    expect(job).toEqual({ hoursPerPerson: 4, kmDriven: 40, hired: 1, owners: 2, muuttomaailma: true, fromCalculator: false });
    expect(estimateFloorJob({ formData: '{rikki' }, false).fromCalculator).toBe(false);
  });
});
