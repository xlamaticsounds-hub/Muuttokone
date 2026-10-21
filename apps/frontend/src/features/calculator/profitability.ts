import { CalculatorSchema, VAT_RATE, calculateMovingPrice, estimateDriveHours, type CalculatorData } from './pricing';

/**
 * Kannattavuusmalli: kuinka paljon laskurin hinnasta jää voittoa kun kustannukset otetaan huomioon.
 *
 * Malli ajetaan laskurin OIKEALLA hinnoittelufunktiolla (calculateMovingPrice), joten analyysi ei vanhene
 * kun hintoja muutetaan — toisin kuin aiemmat Python-laskelmat, jotka toistivat vanhaa hinnoittelua.
 *
 * Tärkeää: tämä on KUSTANNUSMALLI, jonka luvut ovat oletuksia. Oikeat luvut (palkat, auton kulut, ALV-tila)
 * kuuluvat COST_PRESETS-vakioihin. Paras tulos on kuitenkin `breakEvenWage`: se kertoo, kuinka suuri
 * työntekijän tuntikustannus (€/h/henkilö) saa kussakin skenaariossa olla, ennen kuin voitto menee nollaan.
 * Se ei riipu palkkaoletuksesta, joten sitä voi verrata suoraan todellisiin kustannuksiin.
 */

export type CostModel = {
  name: string;
  /** ALV-velvollinen: hinnan sisältämä ALV tilitetään valtiolle, joten tuotto = hinta / 1,255. */
  vatLiable: boolean;
  /** Työntekijän kokonaiskustannus €/h (palkka + sivukulut + lomakorvaukset, tai alihankkijan tuntihinta). */
  moverCostPerHour: number;
  /** Montako työntekijää täydessä palvelussa on mukana (kantoapu 2, kuljettaja+auto 1, kuljetus 1–2). */
  moversInFullService: number;
  /** Auton kiinteät kulut per käyttötunti (liising/poisto, vakuutus, vero). */
  vehicleFixedPerHour: number;
  /** Auton muuttuvat kulut per ajettu km (polttoaine, renkaat, huolto). */
  vehicleCostPerKm: number;
  /** Todellinen ajoaika: ensimmäiset `urbanKm` km taajamassa keskinopeudella `urbanKmh`, loput valtatiellä `highwayKmh`.
   *  Erillään hinnoittelukaavan ajoaika-arviosta, jotta kustannukset eivät muutu kun hintakaavaa muutetaan. */
  urbanKm: number;
  urbanKmh: number;
  highwayKmh: number;
  /** Kuinka suuri osa menomatkasta ajetaan tyhjänä takaisin (1 = koko matka, 0 = paluukuorma). */
  returnTripFactor: number;
  /** Laskuttamaton lisäaika per työ (matka varikolta ja takaisin, tauot). */
  deadheadHours: number;
  /** Laskuttamaton lisäajo per työ (km). */
  deadheadKm: number;
  /** Laskutus, asiakaspalvelu ym. kiinteä kulu per työ. */
  adminPerJob: number;
  /** Suojamateriaalit ym. per työ (vain täysi palvelu). */
  suppliesPerJob: number;
  /** Markkinointi/liidit, % tuotosta. */
  marketingPercent: number;
  /** Maksuliikenteen kulut, % bruttohinnasta. */
  paymentFeePercent: number;
};

/**
 * Oletukset. KONSERVATIIVINEN on vanhan analyysin (pricing_optimization.py) palkka- ja markkinointiarvojen
 * mukainen mutta realistisemmilla auton kuluilla ja paluumatkalla; KEVYT vastaa pientä, omistajavetoista
 * yritystä. Päivitä luvut todellisilla — älä luota näihin sellaisenaan.
 */
export const COST_PRESETS: Record<'conservative' | 'lean', CostModel> = {
  conservative: {
    name: 'Konservatiivinen',
    vatLiable: true,
    moverCostPerHour: 30,
    moversInFullService: 2,
    vehicleFixedPerHour: 12,
    vehicleCostPerKm: 0.3,
    urbanKm: 15,
    urbanKmh: 35,
    highwayKmh: 85,
    returnTripFactor: 1,
    deadheadHours: 0.25,
    deadheadKm: 10,
    adminPerJob: 15,
    suppliesPerJob: 8,
    marketingPercent: 8,
    paymentFeePercent: 1.5,
  },
  lean: {
    name: 'Kevyt',
    vatLiable: true,
    moverCostPerHour: 22,
    moversInFullService: 2,
    vehicleFixedPerHour: 7,
    vehicleCostPerKm: 0.25,
    urbanKm: 15,
    urbanKmh: 35,
    highwayKmh: 85,
    returnTripFactor: 1,
    deadheadHours: 0.25,
    deadheadKm: 10,
    adminPerJob: 8,
    suppliesPerJob: 5,
    marketingPercent: 4,
    paymentFeePercent: 1,
  },
};

/** Tavoitekate: alle tämän skenaario on "ohut". */
export const TARGET_MARGIN = 0.15;

export type ProfitResult = {
  /** Asiakkaan maksama hinta (sis. alv). */
  price: number;
  /** Yrityksen tuotto (hinta ilman ALV:ia jos ALV-velvollinen). */
  net: number;
  /** Henkilöitä työssä. */
  crew: number;
  /** Työtunnit per henkilö: varsinainen työ + todellinen ajo + tyhjä paluumatka + laskuttamaton lisäaika. */
  staffHours: number;
  billedHours: number;
  laborCost: number;
  vehicleCost: number;
  /** Muut kulut (admin, tarvikkeet, markkinointi, maksukulut). */
  otherCosts: number;
  totalCost: number;
  profit: number;
  /** Kate = voitto / tuotto (-1 … 1). */
  margin: number;
  /** Suurin työntekijän tuntikustannus (€/h/henkilö), jolla voitto on vielä vähintään nolla. */
  breakEvenWage: number;
  /** Suurin tuntikustannus, jolla tavoitekate (TARGET_MARGIN) vielä täyttyy. */
  targetWage: number;
};

/** Todellinen yhdensuuntainen ajoaika (h) kustannusmallin nopeuksilla. */
export function realDriveHours(distanceKm: number, model: Pick<CostModel, 'urbanKm' | 'urbanKmh' | 'highwayKmh'>): number {
  const km = Math.max(0, distanceKm);
  return Math.min(km, model.urbanKm) / model.urbanKmh + Math.max(0, km - model.urbanKm) / model.highwayKmh;
}

function staffing(data: CalculatorData, model: CostModel): { crew: number; usesVehicle: boolean; usesSupplies: boolean } {
  if (data.serviceType === 'transport') return { crew: data.driverCount === '2' ? 2 : 1, usesVehicle: true, usesSupplies: false };
  if (data.serviceType === 'recycling') return { crew: model.moversInFullService, usesVehicle: true, usesSupplies: false };
  switch (data.movingPackage ?? 'full_service') {
    case 'driver_with_vehicle':
      return { crew: 1, usesVehicle: true, usesSupplies: false };
    case 'carrying_help':
      return { crew: 2, usesVehicle: false, usesSupplies: false };
    default:
      return { crew: model.moversInFullService, usesVehicle: true, usesSupplies: true };
  }
}

/** Yhden skenaarion kannattavuus: laskurin hinta vs. kustannukset annetulla kustannusmallilla. */
export function analyzeScenario(data: CalculatorData, model: CostModel): ProfitResult {
  const price = calculateMovingPrice(data);
  const { crew, usesVehicle, usesSupplies } = staffing(data, model);

  const km = Math.max(0, data.distanceKm);
  const billedHours = price.estimatedDurationHours;
  // Varsinainen työ = laskutettu aika miinus hinnoittelukaavan oma ajoaika-arvio (sisältää pyöristyksen, eli on varovainen).
  // Sen tilalle tulee todellinen ajoaika sekä tyhjä paluumatka, jotta kustannus ei riipu hintakaavan oletuksista.
  const workHours = Math.max(0, billedHours - estimateDriveHours(km));
  const driveHours = realDriveHours(km, model);
  const returnHours = model.returnTripFactor * driveHours;
  const staffHours = workHours + driveHours + returnHours + model.deadheadHours;

  const net = model.vatLiable ? price.total / (1 + VAT_RATE) : price.total;
  const laborCost = crew * staffHours * model.moverCostPerHour;
  const kmDriven = km * (1 + model.returnTripFactor) + model.deadheadKm;
  const vehicleCost = usesVehicle ? staffHours * model.vehicleFixedPerHour + kmDriven * model.vehicleCostPerKm : 0;
  const otherCosts =
    model.adminPerJob +
    (usesSupplies ? model.suppliesPerJob : 0) +
    (net * model.marketingPercent) / 100 +
    (price.total * model.paymentFeePercent) / 100;

  const totalCost = laborCost + vehicleCost + otherCosts;
  const profit = net - totalCost;
  const crewHours = crew * staffHours;

  return {
    price: price.total,
    net,
    crew,
    staffHours,
    billedHours,
    laborCost,
    vehicleCost,
    otherCosts,
    totalCost,
    profit,
    margin: net > 0 ? profit / net : 0,
    breakEvenWage: crewHours > 0 ? (net - vehicleCost - otherCosts) / crewHours : 0,
    targetWage: crewHours > 0 ? (net * (1 - TARGET_MARGIN) - vehicleCost - otherCosts) / crewHours : 0,
  };
}

// ---------- Vakioskenaariot ----------

export type Scenario = { id: string; label: string; group: string; data: CalculatorData };

const SIZES = ['1h', '2h', '3h', '4h+'] as const;
type Size = (typeof SIZES)[number];

// Laskurin "Tyypillinen Xh" -pikavalinnat (Calculator.tsx); 4h+ vastaa isoa kotitaloutta.
const ITEMS_BY_SIZE: Record<Size, Record<string, number>> = {
  '1h': { sofa_2: 1, bed_140: 1, wardrobe_assembled: 1, coffee_table: 1, bookshelf: 1, nightstand: 1, dresser_small: 1, box_standard: 10 },
  '2h': { sofa_3: 1, bed_140: 1, bed_80: 1, wardrobe_assembled: 2, coffee_table: 1, bookshelf: 2, nightstand: 2, dresser_small: 1, dining_table_small: 1, kitchen_chair: 4, box_standard: 20 },
  '3h': { sofa_3: 1, sofa_2: 1, bed_140: 1, bed_80: 2, wardrobe_assembled: 3, coffee_table: 1, bookshelf: 3, nightstand: 2, dresser_large: 1, dining_table_large: 1, kitchen_chair: 6, box_standard: 35 },
  '4h+': { sofa_3: 1, sofa_2: 1, bed_140: 2, bed_80: 2, wardrobe_assembled: 4, coffee_table: 1, bookshelf: 4, nightstand: 3, dresser_large: 2, dining_table_large: 1, kitchen_chair: 6, box_standard: 55 },
};

export const SCENARIO_DISTANCES = [5, 19, 40, 100, 180, 300] as const;

// Lauantai 28.11.2026 = ei alennusta; tiistai 10.11.2026 = suurin alennus (edullinen päivä + kuun keskivaihe, -15 %)
const DATES = { normal: new Date(2026, 10, 28), discounted: new Date(2026, 10, 10) } as const;

const ACCESS = {
  easy: { floorFrom: 2, elevatorFrom: true, floorTo: 2, elevatorTo: true },
  hard: { floorFrom: 4, elevatorFrom: false, floorTo: 4, elevatorTo: false },
} as const;

const PACKAGE_LABELS = { full_service: 'Täysi palvelu', driver_with_vehicle: 'Kuljettaja + auto', carrying_help: 'Kantoapu' } as const;

/** Vakiojoukko skenaarioita: palvelu/paketti × koko × matka × päivä (normaali/alennus) × pääsy (helppo/vaikea). */
export function standardScenarios(): Scenario[] {
  const out: Scenario[] = [];
  const common = { addressFrom: 'A', addressTo: 'B' };

  for (const pkg of Object.keys(PACKAGE_LABELS) as (keyof typeof PACKAGE_LABELS)[]) {
    for (const size of SIZES) {
      for (const km of SCENARIO_DISTANCES) {
        for (const [dateKey, date] of Object.entries(DATES)) {
          for (const [accessKey, access] of Object.entries(ACCESS)) {
            out.push({
              id: `${pkg}|${size}|${km}|${dateKey}|${accessKey}`,
              label: `${PACKAGE_LABELS[pkg]} · ${size} · ${km} km · ${dateKey === 'normal' ? 'normaali päivä' : '-15 % päivä'} · ${accessKey === 'easy' ? 'hissi' : 'ei hissiä, 4. krs'}`,
              group: PACKAGE_LABELS[pkg],
              data: CalculatorSchema.parse({ ...common, serviceType: 'moving', movingPackage: pkg, distanceKm: km, apartmentSize: size, furnitureItems: ITEMS_BY_SIZE[size], date, ...access }),
            });
          }
        }
      }
    }
  }

  // Kuljetus: sohva + 5 laatikkoa
  for (const drivers of ['1', '2'] as const) {
    for (const km of [5, 19, 50, 180] as const) {
      for (const [dateKey, date] of Object.entries(DATES)) {
        out.push({
          id: `transport|${drivers}|${km}|${dateKey}`,
          label: `Kuljetus · ${drivers} kuljettaja${drivers === '2' ? 'a' : ''} · ${km} km · ${dateKey === 'normal' ? 'normaali päivä' : '-15 % päivä'}`,
          group: 'Kuljetus',
          data: CalculatorSchema.parse({ ...common, serviceType: 'transport', driverCount: drivers, distanceKm: km, apartmentSize: '1h', furnitureItems: { sofa_3: 1, box_standard: 5 }, date, ...ACCESS.easy }),
        });
      }
    }
  }
  return out;
}

export type GroupSummary = {
  group: string;
  scenarios: number;
  lossMaking: number;
  belowTarget: number;
  worst: { label: string; result: ProfitResult } | null;
  /** Pienin break-even-palkka ryhmässä: jos todellinen tuntikustannus on tätä suurempi, ainakin yksi skenaario tappiollinen. */
  minBreakEvenWage: number;
  medianMargin: number;
};

export function summarizeByGroup(scenarios: Scenario[], model: CostModel): GroupSummary[] {
  const groups = new Map<string, { label: string; result: ProfitResult }[]>();
  for (const s of scenarios) {
    const list = groups.get(s.group) ?? [];
    list.push({ label: s.label, result: analyzeScenario(s.data, model) });
    groups.set(s.group, list);
  }
  return [...groups.entries()].map(([group, rows]) => {
    const sorted = [...rows].sort((a, b) => a.result.margin - b.result.margin);
    const margins = rows.map((r) => r.result.margin).sort((a, b) => a - b);
    return {
      group,
      scenarios: rows.length,
      lossMaking: rows.filter((r) => r.result.profit < 0).length,
      belowTarget: rows.filter((r) => r.result.margin < TARGET_MARGIN).length,
      worst: sorted[0] ?? null,
      minBreakEvenWage: Math.min(...rows.map((r) => r.result.breakEvenWage)),
      medianMargin: margins[Math.floor(margins.length / 2)] ?? 0,
    };
  });
}
