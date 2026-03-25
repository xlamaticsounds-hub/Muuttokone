import { z } from 'zod';

export const CalculatorSchema = z.object({
  // Locations
  addressFrom: z.string().min(1, 'Lähtöosoite vaaditaan'),
  addressTo: z.string().min(1, 'Kohdeosoite vaaditaan'),
  distanceKm: z.number().min(0).default(0), // Calculated or input

  // Apartment details
  apartmentSize: z.enum(['1h', '2h', '3h', '4h+', 'office']),
  squareMeters: z.number().optional(),
  
  // Access details
  floorFrom: z.number().default(0),
  elevatorFrom: z.boolean().default(false),
  floorTo: z.number().default(0),
  elevatorTo: z.boolean().default(false),
  
  // Inventory
  boxCount: z.number().default(0),
  heavyItems: z.array(z.string()).default([]), // e.g., 'piano', 'safe'
  
  // Service level
  needsPacking: z.boolean().default(false),
  needsCleaning: z.boolean().default(false),
  services: z.array(z.string()).default([]),
  
  // Timing
  date: z.date().optional(),

  // Contact (captured at booking stage)
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export type CalculatorData = z.infer<typeof CalculatorSchema>;

export interface PriceBreakdown {
  distanceCost: number;
  laborCost: number;
  extrasCost: number;
  subtotal: number;
  vat: number;
  total: number;
  estimatedDurationHours: number;
  details: {
    distanceKm: number;
    laborHours: number;
    laborRate: number;
    crewSize: number; // 2 movers + van usually
  };
}

const PRICING_CONSTANTS = {
  ratePerKm: 0.59,
  finlandiaLoopKm: 5, // Rough estimate for Finlandia -> A -> B -> Finlandia base overhead
  hourlyRateDefault: 120, // €/h
  hourlyRateComplex: 140, // €/h
  minimumCharge: 299, // €
  vatRate: 0.255, // 25.5% VAT
};

/**
 * Calculates the moving price based on the provided data.
 */
export function calculateMovingPrice(data: CalculatorData): PriceBreakdown {
  const {
    distanceKm,
    apartmentSize,
    elevatorFrom,
    elevatorTo,
    floorFrom,
    floorTo,
    heavyItems,
    needsPacking,
  } = data;

  // 1. Distance Cost
  // Route: Finlandia -> A -> B -> Finlandia
  // We approximate this as: distance(A->B) + overhead
  // In a real app, we'd sum the actual segments.
  const totalDistance = distanceKm + PRICING_CONSTANTS.finlandiaLoopKm; // Adding base loop distance
  const distanceCost = totalDistance * PRICING_CONSTANTS.ratePerKm;

  // 2. Labor Time Estimation
  let baseLoadTime = 0;
  let baseUnloadTime = 0;

  // Base times based on apartment size
  switch (apartmentSize) {
    case '1h':
      baseLoadTime = 1.0;
      baseUnloadTime = 0.75;
      break;
    case '2h':
      baseLoadTime = 1.5;
      baseUnloadTime = 1.25;
      break;
    case '3h':
      baseLoadTime = 2.5;
      baseUnloadTime = 2.0;
      break;
    case '4h+':
    case 'office':
      baseLoadTime = 3.5;
      baseUnloadTime = 3.0;
      break;
  }

  // Adjust for elevators/stairs
  const loadStairFactor = !elevatorFrom && floorFrom > 0 ? floorFrom * 0.25 : 0;
  const unloadStairFactor = !elevatorTo && floorTo > 0 ? floorTo * 0.25 : 0;

  // Packing service adds significant time
  const packingTime = needsPacking ? (apartmentSize === '1h' ? 2 : 4) : 0;

  // Drive time (assume 50km/h average in city + buffer)
  const driveTime = (distanceKm / 40) + 0.25; 

  // Admin/Prep time
  const adminTime = 0.5;

  let totalLaborHours = 
    baseLoadTime + loadStairFactor + 
    baseUnloadTime + unloadStairFactor + 
    driveTime + packingTime + adminTime;

  // Heavy items add time and potential extra crew cost (simplified here as time)
  if (heavyItems.length > 0) {
    totalLaborHours += heavyItems.length * 0.5;
  }

  // Round up to nearest 0.5 hour
  totalLaborHours = Math.ceil(totalLaborHours * 2) / 2;

  // Determine Hourly Rate
  let hourlyRate = PRICING_CONSTANTS.hourlyRateDefault;
  // Increase rate for complex moves (high floors no elevator, or large moves)
  if ((!elevatorFrom && floorFrom > 2) || (!elevatorTo && floorTo > 2) || apartmentSize === '4h+') {
    hourlyRate = PRICING_CONSTANTS.hourlyRateComplex;
  }

  const laborCost = totalLaborHours * hourlyRate;

  // 3. Extras
  let extrasCost = 0;
  // Example: if specific heavy item fee was separate, add here.
  // For now, included in labor/complexity.

  // 4. Totals
  let subtotal = distanceCost + laborCost + extrasCost;

  // Minimum Charge
  if (subtotal < PRICING_CONSTANTS.minimumCharge) {
    subtotal = PRICING_CONSTANTS.minimumCharge;
  }

  // VAT
  // Assuming the rates above are VAT 0% or VAT included? 
  // Usually B2C prices include VAT.
  // Let's assume the Calculated Subtotal is VAT Inclusive for B2C display simplicity, 
  // or add VAT on top if rates are excl VAT.
  // The prompt implies "€100-150 / hour", usually B2C prices in Finland are quoted with VAT.
  // Let's assume the result should be the final price to customer.
  
  // If we treat the rates as VAT inclusive (common for consumers):
  const total = subtotal; 
  const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));
  
  return {
    distanceCost,
    laborCost,
    extrasCost,
    subtotal: total - vat,
    vat,
    total,
    estimatedDurationHours: totalLaborHours,
    details: {
      distanceKm: totalDistance,
      laborHours: totalLaborHours,
      laborRate: hourlyRate,
      crewSize: 3, // Van + 2 movers
    },
  };
}
