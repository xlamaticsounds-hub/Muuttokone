import { CalculatorSchema, VAT_RATE, calculateMovingPrice, estimateDriveHours } from '@/features/calculator/pricing';
import { realDriveHours } from '@/features/calculator/profitability';
import { leadBaseTripAdvice } from '@/lib/base-trip';

// Hintalattia: tarjouksen alaraja, jonka alle keikkaa ei myydä (tiimipalaverin päätös 4.11.2026).
// Lattia = (palkat + auto + tarvikkeet + Muuttomaailman provisio + omistajien vähimmäistuntiansio) × ALV.
//
// Kululuvut ovat yrityksen omia, eivätkä ne kuulu julkiseen koodiin: ne tallennetaan hallinnassa
// AppState-tauluun (PRICE_FLOOR_COSTS_KEY). Ilman tallennettuja lukuja hintalattiaa ei lasketa.

export const PRICE_FLOOR_COSTS_KEY = 'price-floor-costs';

export type PriceFloorCosts = {
  /** Palkatun tekijän kokonaiskustannus €/h. */
  hiredPerHour: number;
  /** Auton muuttuva kulu €/km ilman ALV:ia (polttoaine + kuluminen). */
  kmCost: number;
  /** Tarvikkeet per keikka (€). */
  suppliesPerJob: number;
  /** Muuttomaailman provisio per voitettu keikka (€). */
  muuttomaailmaFee: number;
  /** Omistajalle vähintään jäävä €/h. */
  ownerFloorPerHour: number;
};

export const PRICE_FLOOR_COST_FIELDS: { key: keyof PriceFloorCosts; label: string; unit: string; max: number }[] = [
  { key: 'hiredPerHour', label: 'Palkattu tekijä', unit: '€/h', max: 200 },
  { key: 'kmCost', label: 'Auto (ilman ALV:ia)', unit: '€/km', max: 10 },
  { key: 'suppliesPerJob', label: 'Tarvikkeet', unit: '€/keikka', max: 500 },
  { key: 'muuttomaailmaFee', label: 'Muuttomaailman provisio', unit: '€/keikka', max: 500 },
  { key: 'ownerFloorPerHour', label: 'Omistajalle vähintään', unit: '€/h', max: 500 },
];

/** Tarkistaa tallennetut tai lomakkeelta tulleet luvut. null, jos jokin puuttuu tai on virheellinen. */
export function parsePriceFloorCosts(value: unknown): PriceFloorCosts | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const result: Partial<PriceFloorCosts> = {};
  for (const field of PRICE_FLOOR_COST_FIELDS) {
    const raw = record[field.key];
    const num = typeof raw === 'string' ? Number(raw.replace(',', '.')) : raw;
    if (typeof num !== 'number' || !Number.isFinite(num) || num < 0 || num > field.max) return null;
    result[field.key] = num;
  }
  return result as PriceFloorCosts;
}

export type PriceFloorJob = {
  /** Työtunnit henkeä kohden ajoineen (myös tyhjä ajo ja varikko). */
  hoursPerPerson: number;
  /** Ajetut km yhteensä. */
  kmDriven: number;
  hired: number;
  owners: number;
  muuttomaailma: boolean;
};

export type PriceFloorResult = {
  /** Hintalattia € sis. ALV, pyöristetty ylös 5 €:oon. */
  floor: number;
  /** Kulut ilman omistajien osuutta (€, ilman ALV:ia). */
  costs: number;
};

export function computePriceFloor(job: PriceFloorJob, costs: PriceFloorCosts): PriceFloorResult {
  const hours = Math.max(0, job.hoursPerPerson);
  const jobCosts =
    Math.max(0, job.hired) * costs.hiredPerHour * hours +
    Math.max(0, job.kmDriven) * costs.kmCost +
    costs.suppliesPerJob +
    (job.muuttomaailma ? costs.muuttomaailmaFee : 0);
  const ownerShare = costs.ownerFloorPerHour * Math.max(0, job.owners) * hours;
  return { floor: Math.ceil(((jobCosts + ownerShare) * (1 + VAT_RATE)) / 5) * 5, costs: jobCosts };
}

/** Omistajalle jäävä €/h annetulla hinnalla (sis. ALV). null, kun keikalla ei ole omistajatunteja. */
export function ownerHourlyAt(price: number, job: PriceFloorJob, costs: PriceFloorCosts): number | null {
  const ownerHours = Math.max(0, job.owners) * Math.max(0, job.hoursPerPerson);
  if (ownerHours <= 0) return null;
  return (price / (1 + VAT_RATE) - computePriceFloor(job, costs).costs) / ownerHours;
}

// Todellinen ajo (sama malli kuin kannattavuusanalyysissä) ja varikkoajo pääkaupunkiseudulla.
const SPEED = { urbanKm: 15, urbanKmh: 35, highwayKmh: 85 };
const DEPOT_HOURS = 0.5;
const DEPOT_KM = 20;
/** Kun liidillä ei ole laskurin tietoja (esim. Muuttomaailma), lomake alkaa näistä. */
const DEFAULT_JOB: Omit<PriceFloorJob, 'muuttomaailma'> = { hoursPerPerson: 4, kmDriven: 40, hired: 1, owners: 2 };

export type EstimatedFloorJob = PriceFloorJob & { fromCalculator: boolean };

function crewFor(data: { serviceType?: string; movingPackage?: string; driverCount?: string }): { hired: number; owners: number } {
  if (data.serviceType === 'transport') return data.driverCount === '2' ? { hired: 1, owners: 1 } : { hired: 0, owners: 1 };
  if (data.serviceType === 'recycling') return { hired: 1, owners: 1 };
  switch (data.movingPackage ?? 'full_service') {
    case 'driver_with_vehicle':
      return { hired: 0, owners: 1 };
    case 'carrying_help':
      return { hired: 1, owners: 1 };
    default:
      // Perusmalli 4.11.2026: 2 omistajaa + 1 palkattu (tavoite 1 omistaja + 2 palkattua)
      return { hired: 1, owners: 2 };
  }
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Arvio keikan tunneista ja kilometreistä hintalattiaa varten. Laskurin liidistä tunnit tulevat
 * laskurin arviosta (laskurin ajoaika vaihdetaan todelliseen ajoon), ja kilometreihin lasketaan
 * tyhjä ajo tukikohdasta ja takaisin. Muille liideille palautetaan oletukset, joita muokataan käsin.
 */
export function estimateFloorJob(
  lead: { fromAddress?: string | null; toAddress?: string | null; formData?: unknown },
  muuttomaailma: boolean,
): EstimatedFloorJob {
  let pfd: Record<string, unknown> = {};
  try {
    const parsed = typeof lead.formData === 'string' ? JSON.parse(lead.formData) : lead.formData;
    if (parsed && typeof parsed === 'object') pfd = parsed as Record<string, unknown>;
  } catch {
    // ei laskurin tietoja
  }
  const fallback: EstimatedFloorJob = { ...DEFAULT_JOB, muuttomaailma, fromCalculator: false };
  if (pfd.external || typeof pfd.serviceType !== 'string' || !['moving', 'transport', 'recycling'].includes(pfd.serviceType)) {
    return fallback;
  }

  try {
    const { contactName, contactEmail, contactPhone, ...fields } = pfd;
    const input: Record<string, unknown> = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
    const date = typeof pfd.date === 'string' ? new Date(pfd.date) : undefined;
    input.date = date && !Number.isNaN(date.getTime()) ? date : undefined;
    const data = CalculatorSchema.parse(input);
    const price = calculateMovingPrice(data);
    const km = data.distanceKm;

    const advice = leadBaseTripAdvice(lead);
    let driveHours: number;
    let kmDriven: number;
    if (advice) {
      kmDriven = advice.fromKm + advice.loadedKm + advice.toKm;
      driveHours = realDriveHours(advice.fromKm, SPEED) + realDriveHours(advice.loadedKm, SPEED) + realDriveHours(advice.toKm, SPEED);
    } else {
      const withReturn = km > 30;
      kmDriven = km * (withReturn ? 2 : 1) + DEPOT_KM;
      driveHours = realDriveHours(km, SPEED) * (withReturn ? 2 : 1) + DEPOT_HOURS;
    }
    const workHours = Math.max(0, price.estimatedDurationHours - estimateDriveHours(km));
    return {
      hoursPerPerson: round1(workHours + driveHours),
      kmDriven: Math.round(kmDriven),
      ...crewFor(data),
      muuttomaailma,
      fromCalculator: true,
    };
  } catch {
    return fallback;
  }
}
