import { describe, expect, it } from 'vitest';
import { CalculatorSchema, calculateMovingPrice } from './pricing';
import { PRICE_FROM, PRICE_FROM_TEXT } from './priceFrom';

// Pieni muutto Helsingin sisällä ilman päiväalennusta (päivää ei valittu): hinnan pitää olla tasan
// vähimmäishinta, jotta UKK:n "alkaen"-hinta on todellinen hinta eikä mainoslukema.
const smallMove = (over: Record<string, unknown>) =>
  calculateMovingPrice(
    CalculatorSchema.parse({
      serviceType: 'moving',
      movingPackage: 'full_service',
      addressFrom: 'Mannerheimintie 10, 00100 Helsinki',
      addressTo: 'Hämeentie 20, 00530 Helsinki',
      distanceKm: 3,
      apartmentSize: '1h',
      elevatorFrom: true,
      elevatorTo: true,
      furnitureItems: { box_standard: 5 },
      ...over,
    }),
  ).total;

describe('alkaen-hinnat', () => {
  it('täyspalvelun alkaen-hinta on pienen muuton todellinen hinta laskurissa', () => {
    for (const size of ['1h', '2h', '3h'] as const) {
      expect(smallMove({ apartmentSize: size }), size).toBe(PRICE_FROM.fullService[size]);
    }
  });

  it('kuljettaja + auto, kantoapu ja kuljetus', () => {
    expect(smallMove({ movingPackage: 'driver_with_vehicle' })).toBe(PRICE_FROM.driverWithVehicle);
    expect(smallMove({ movingPackage: 'carrying_help' })).toBe(PRICE_FROM.carryingHelp);
    expect(smallMove({ serviceType: 'transport', furnitureItems: { box_standard: 1 } })).toBe(PRICE_FROM.transport);
    expect(smallMove({ serviceType: 'transport', driverCount: '2', furnitureItems: { box_standard: 1 } })).toBe(PRICE_FROM.transportTwoDrivers);
  });

  it('muuttosiivous on kiinteä lisä muuton päälle', () => {
    expect(smallMove({ needsCleaning: true }) - smallMove({})).toBe(PRICE_FROM.cleaning['1h']);
  });

  it('lauseet käyttävät samoja lukuja', () => {
    expect(PRICE_FROM_TEXT.fullService).toContain(`yksiö alkaen ${PRICE_FROM.fullService['1h']} €`);
    expect(PRICE_FROM_TEXT.lighterPackages).toContain(`kantoapu alkaen ${PRICE_FROM.carryingHelp} €`);
  });
});
