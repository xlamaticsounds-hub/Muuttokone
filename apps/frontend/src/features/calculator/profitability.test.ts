import { describe, expect, it } from 'vitest';
import { CalculatorSchema, VAT_RATE, estimateDriveHours } from './pricing';
import { COST_PRESETS, TARGET_MARGIN, analyzeScenario, realDriveHours, standardScenarios, summarizeByGroup, type CostModel } from './profitability';

const studio = { sofa_2: 1, bed_140: 1, wardrobe_assembled: 1, coffee_table: 1, bookshelf: 1, nightstand: 1, dresser_small: 1, box_standard: 10 };
const move = (over: Record<string, unknown> = {}) =>
  CalculatorSchema.parse({ addressFrom: 'A', addressTo: 'B', serviceType: 'moving', movingPackage: 'full_service', distanceKm: 19, apartmentSize: '1h', elevatorFrom: true, elevatorTo: true, floorFrom: 2, floorTo: 2, furnitureItems: studio, ...over });

const lean = COST_PRESETS.lean;
const withModel = (over: Partial<CostModel>): CostModel => ({ ...lean, ...over });

describe('analyzeScenario', () => {
  it('ALV-velvollisella tuotto on hinta / 1,255, muuten koko hinta', () => {
    const liable = analyzeScenario(move(), withModel({ vatLiable: true }));
    const notLiable = analyzeScenario(move(), withModel({ vatLiable: false }));
    expect(liable.price).toBe(notLiable.price);
    expect(liable.net).toBeCloseTo(liable.price / (1 + VAT_RATE), 6);
    expect(notLiable.net).toBeCloseTo(notLiable.price, 6);
    expect(notLiable.profit).toBeGreaterThan(liable.profit);
  });

  it('voitto = tuotto - kustannukset ja kate = voitto / tuotto', () => {
    const r = analyzeScenario(move(), lean);
    expect(r.totalCost).toBeCloseTo(r.laborCost + r.vehicleCost + r.otherCosts, 6);
    expect(r.profit).toBeCloseTo(r.net - r.totalCost, 6);
    expect(r.margin).toBeCloseTo(r.profit / r.net, 6);
  });

  it('break-even-palkalla voitto on nolla ja tavoitepalkalla kate on tavoitekate', () => {
    for (const data of [move(), move({ distanceKm: 180 }), move({ movingPackage: 'driver_with_vehicle' }), move({ movingPackage: 'carrying_help', distanceKm: 100 })]) {
      const base = analyzeScenario(data, lean);
      const atBreakEven = analyzeScenario(data, withModel({ moverCostPerHour: base.breakEvenWage }));
      expect(atBreakEven.profit).toBeCloseTo(0, 6);
      const atTarget = analyzeScenario(data, withModel({ moverCostPerHour: base.targetWage }));
      expect(atTarget.margin).toBeCloseTo(TARGET_MARGIN, 6);
    }
  });

  it('korkeampi palkka pienentää voittoa ja break-even ei riipu palkasta', () => {
    const cheap = analyzeScenario(move(), withModel({ moverCostPerHour: 20 }));
    const expensive = analyzeScenario(move(), withModel({ moverCostPerHour: 40 }));
    expect(expensive.profit).toBeLessThan(cheap.profit);
    expect(expensive.breakEvenWage).toBeCloseTo(cheap.breakEvenWage, 9);
  });

  it('kantoavussa ei ole auton kuluja, muissa on', () => {
    expect(analyzeScenario(move({ movingPackage: 'carrying_help' }), lean).vehicleCost).toBe(0);
    expect(analyzeScenario(move({ movingPackage: 'driver_with_vehicle' }), lean).vehicleCost).toBeGreaterThan(0);
    expect(analyzeScenario(move(), lean).vehicleCost).toBeGreaterThan(0);
  });

  it('henkilömäärät: täysi 2, kuljettaja 1, kantoapu 2, kuljetus 1–2', () => {
    expect(analyzeScenario(move(), lean).crew).toBe(2);
    expect(analyzeScenario(move({ movingPackage: 'driver_with_vehicle' }), lean).crew).toBe(1);
    expect(analyzeScenario(move({ movingPackage: 'carrying_help' }), lean).crew).toBe(2);
    expect(analyzeScenario(move({ serviceType: 'transport', driverCount: '2' }), lean).crew).toBe(2);
    expect(analyzeScenario(move({ serviceType: 'transport', driverCount: '1' }), lean).crew).toBe(1);
  });

  it('tyhjä paluumatka lisää työtunteja täsmälleen todellisen ajoajan verran', () => {
    const far = move({ distanceKm: 180 });
    const withReturn = analyzeScenario(far, withModel({ returnTripFactor: 1 }));
    const noReturn = analyzeScenario(far, withModel({ returnTripFactor: 0 }));
    expect(withReturn.staffHours - noReturn.staffHours).toBeCloseTo(realDriveHours(180, lean), 9);
    expect(realDriveHours(180, lean)).toBeGreaterThan(2);
    expect(noReturn.profit).toBeGreaterThan(withReturn.profit);
  });

  it('todellinen ajoaika on riippumaton hinnoittelukaavan ajoaika-arviosta: kustannus ei muutu vaikka laskutettu aika muuttuu', () => {
    // 180 km: hinnoittelukaava laskuttaa 3,0 h ajoa, todellinen ajo on noin 2,4 h — työtunnit perustuvat jälkimmäiseen
    const r = analyzeScenario(move({ distanceKm: 180 }), lean);
    const workHours = r.billedHours - estimateDriveHours(180);
    expect(r.staffHours).toBeCloseTo(workHours + realDriveHours(180, lean) * 2 + lean.deadheadHours, 9);
  });

  it('realDriveHours: taajamassa 35 km/h, valtatiellä 85 km/h', () => {
    expect(realDriveHours(0, lean)).toBe(0);
    expect(realDriveHours(15, lean)).toBeCloseTo(15 / 35, 9);
    expect(realDriveHours(185, lean)).toBeCloseTo(15 / 35 + 170 / 85, 9);
    expect(realDriveHours(-5, lean)).toBe(0);
  });

  it('pitkä matka kuluttaa enemmän kuin lyhyt samalla tavaralistalla', () => {
    expect(analyzeScenario(move({ distanceKm: 180 }), lean).totalCost).toBeGreaterThan(analyzeScenario(move({ distanceKm: 19 }), lean).totalCost);
  });
});

describe('standardScenarios', () => {
  const scenarios = standardScenarios();

  it('id:t ovat yksilöllisiä ja kaikki tulokset ovat äärellisiä lukuja', () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
    for (const preset of Object.values(COST_PRESETS)) {
      for (const s of scenarios) {
        const r = analyzeScenario(s.data, preset);
        for (const value of [r.price, r.net, r.staffHours, r.totalCost, r.profit, r.margin, r.breakEvenWage, r.targetWage]) {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });

  it('kattaa kaikki palvelut ja paketit', () => {
    const groups = summarizeByGroup(scenarios, lean).map((g) => g.group).sort();
    expect(groups).toEqual(['Kantoapu', 'Kuljetus', 'Kuljettaja + auto', 'Täysi palvelu'].sort());
  });

  it('yhteenvedon luvut täsmäävät: tappiolliset ovat myös tavoitekatteen alapuolella', () => {
    for (const g of summarizeByGroup(scenarios, COST_PRESETS.conservative)) {
      expect(g.lossMaking).toBeLessThanOrEqual(g.belowTarget);
      expect(g.belowTarget).toBeLessThanOrEqual(g.scenarios);
    }
  });
});
