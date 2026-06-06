import { z } from 'zod';

export const FURNITURE_CATALOG = [
  // Olohuone
  { id: 'plant_small', label: 'Huonekasvi', icon: '🪴', category: 'Olohuone', minutesEach: 3 },
  { id: 'plant_large', label: 'Huonekasvi iso', icon: '🌿', category: 'Olohuone', minutesEach: 8 },
  { id: 'bookshelf', label: 'Kirjahylly', icon: '📚', category: 'Olohuone', minutesEach: 15 },
  { id: 'shoe_cabinet', label: 'Kenkäkaappi', icon: '👞', category: 'Olohuone', minutesEach: 12 },
  { id: 'shoe_rack', label: 'Kenkäteline', icon: '👟', category: 'Olohuone', minutesEach: 5 },
  { id: 'sofa_2', label: 'Sohva 2-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 15 },
  { id: 'sofa_3', label: 'Sohva 3-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 22 },
  { id: 'sofa_4', label: 'Sohva 4-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 30 },
  { id: 'sofa_divan', label: 'Divaanisohva', icon: '🛏️', category: 'Olohuone', minutesEach: 25 },
  { id: 'corner_sofa_small', label: 'Kulmasohva pieni', icon: '🛋️', category: 'Olohuone', minutesEach: 28 },
  { id: 'corner_sofa_large', label: 'Kulmasohva iso', icon: '🛋️', category: 'Olohuone', minutesEach: 40 },
  { id: 'armchair', label: 'Nojatuoli', icon: '💺', category: 'Olohuone', minutesEach: 10 },
  { id: 'ottoman_small', label: 'Rahi / jakkara', icon: '🪑', category: 'Olohuone', minutesEach: 5 },
  { id: 'ottoman_large', label: 'Rahi / jakkara iso', icon: '🎁', category: 'Olohuone', minutesEach: 10 },
  { id: 'tv_stand_small', label: 'TV-taso pieni', icon: '📺', category: 'Olohuone', minutesEach: 8 },
  { id: 'tv_stand_large', label: 'TV-taso iso', icon: '🎬', category: 'Olohuone', minutesEach: 15 },
  { id: 'display_cabinet', label: 'Vitriinikaappi', icon: '🪟', category: 'Olohuone', minutesEach: 15 },
  { id: 'entrance_bench', label: 'Eteispenkki', icon: '🛖', category: 'Olohuone', minutesEach: 10 },
  { id: 'side_table', label: 'Sivupöytä', icon: '🪣', category: 'Olohuone', minutesEach: 5 },
  { id: 'wall_cabinet', label: 'Seinäkaappi', icon: '🗄️', category: 'Olohuone', minutesEach: 12 },
  { id: 'floor_lamp', label: 'Lattiavalaisin', icon: '💡', category: 'Olohuone', minutesEach: 3 },
  { id: 'coffee_table', label: 'Sohvapöytä', icon: '☕', category: 'Olohuone', minutesEach: 8 },
  { id: 'tv_small', label: 'Televisio pieni (32–43")', icon: '📺', category: 'Olohuone', minutesEach: 8 },
  { id: 'tv_55', label: 'Televisio 55"', icon: '🖥️', category: 'Olohuone', minutesEach: 12 },
  { id: 'tv_65', label: 'Televisio 65"', icon: '🎥', category: 'Olohuone', minutesEach: 15 },
  { id: 'tv_75', label: 'Televisio 75"', icon: '📹', category: 'Olohuone', minutesEach: 20 },
  { id: 'tv_85plus', label: 'Televisio 85"+', icon: '🎞️', category: 'Olohuone', minutesEach: 25 },
  { id: 'painting_large', label: 'Taulu (iso)', icon: '🖼️', category: 'Olohuone', minutesEach: 5 },
  { id: 'speaker', label: 'Kaiutin', icon: '🔊', category: 'Olohuone', minutesEach: 3 },
  
  // Makuuhuone
  { id: 'wardrobe_assembled', label: 'Vaatekaappi koottu', icon: '🚪', category: 'Makuuhuone', minutesEach: 30 },
  { id: 'wardrobe_disassembled', label: 'Vaatekaappi purettu', icon: '🪟', category: 'Makuuhuone', minutesEach: 25 },
  { id: 'mirror_full', label: 'Peili (kokovartalo)', icon: '🪞', category: 'Makuuhuone', minutesEach: 8 },
  { id: 'nightstand', label: 'Yöpöytä', icon: '🌙', category: 'Makuuhuone', minutesEach: 5 },
  { id: 'dresser_small', label: 'Lipasto pieni', icon: '🗄️', category: 'Makuuhuone', minutesEach: 10 },
  { id: 'dresser_large', label: 'Lipasto iso', icon: '💼', category: 'Makuuhuone', minutesEach: 18 },
  { id: 'bean_bag', label: 'Säkkituoli', icon: '💺', category: 'Makuuhuone', minutesEach: 8 },
  { id: 'bed_headboard', label: 'Sängynpääty', icon: '🎨', category: 'Makuuhuone', minutesEach: 10 },
  { id: 'bed_80', label: 'Sänky 80 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 12 },
  { id: 'bed_120', label: 'Sänky 120 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 15 },
  { id: 'bed_140', label: 'Sänky 140 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 18 },
  { id: 'bed_160', label: 'Sänky 160 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 20 },
  { id: 'bed_180', label: 'Sänky 180 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 22 },
  { id: 'mattress_80', label: 'Patja 80–90 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 10 },
  { id: 'mattress_120', label: 'Patja 120–160 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 15 },
  { id: 'mattress_180', label: 'Patja 180 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 18 },
  { id: 'desk_bedroom', label: 'Kirjoitus/Työpöytä', icon: '📚', category: 'Makuuhuone', minutesEach: 12 },

  // Laatikot ja pakkaukset
  { id: 'box_standard', label: 'Muuttolaatikko (vakio)', icon: '📦', category: 'Laatikot ja pakkaukset', minutesEach: 2 },
  { id: 'box_clothes', label: 'Vaatelaatikko', icon: '👕', category: 'Laatikot ja pakkaukset', minutesEach: 2 },
  { id: 'storage_box_small', label: 'Säilytyslaatikko pieni', icon: '🟦', category: 'Laatikot ja pakkaukset', minutesEach: 2 },
  { id: 'storage_box_medium', label: 'Säilytyslaatikko keskikokoinen', icon: '🟪', category: 'Laatikot ja pakkaukset', minutesEach: 3 },
  { id: 'storage_box_large', label: 'Säilytyslaatikko iso', icon: '🟩', category: 'Laatikot ja pakkaukset', minutesEach: 4 },
  { id: 'suitcase', label: 'Matkalaukku', icon: '🧳', category: 'Laatikot ja pakkaukset', minutesEach: 3 },
  { id: 'plastic_bag', label: 'Muovisäkki', icon: '🛍️', category: 'Laatikot ja pakkaukset', minutesEach: 1 },
  { id: 'chest', label: 'Arkku', icon: '⚱️', category: 'Laatikot ja pakkaukset', minutesEach: 8 },

  // Keittiö
  { id: 'kitchen_cabinet', label: 'Astiakaappi', icon: '🍳', category: 'Keittiö', minutesEach: 15 },
  { id: 'microwave', label: 'Mikroaaltouuni', icon: '🔥', category: 'Keittiö', minutesEach: 8 },
  { id: 'glass_table', label: 'Lasipöytä', icon: '🥃', category: 'Keittiö', minutesEach: 10 },
  { id: 'coffee_maker', label: 'Kahvikone', icon: '☕', category: 'Keittiö', minutesEach: 3 },
  { id: 'sink', label: 'Senkki', icon: '🚰', category: 'Keittiö', minutesEach: 20 },
  { id: 'dining_table_small', label: 'Ruokapöytä pieni', icon: '🍽️', category: 'Keittiö', minutesEach: 12 },
  { id: 'dining_table_large', label: 'Ruokapöytä iso', icon: '🍴', category: 'Keittiö', minutesEach: 18 },
  { id: 'dining_table_extendable', label: 'Jatkettava ruokapöytä', icon: '🔧', category: 'Keittiö', minutesEach: 20 },
  { id: 'bar_stool', label: 'Baarituoli', icon: '🍹', category: 'Keittiö', minutesEach: 5 },
  { id: 'kitchen_chair', label: 'Tuoli', icon: '🪑', category: 'Keittiö', minutesEach: 5 },
  { id: 'table_top', label: 'Pöytälevy', icon: '🪨', category: 'Keittiö', minutesEach: 8 },

  // Kodinkoneet
  { id: 'washing_machine', label: 'Pesukone', icon: '🫧', category: 'Kodinkoneet', minutesEach: 20 },
  { id: 'dryer', label: 'Kuivausrumpu', icon: '🌀', category: 'Kodinkoneet', minutesEach: 15 },
  { id: 'dishwasher', label: 'Astianpesukone', icon: '🍽️', category: 'Kodinkoneet', minutesEach: 15 },
  { id: 'stove', label: 'Liesi', icon: '🔥', category: 'Kodinkoneet', minutesEach: 18 },
  { id: 'oven', label: 'Uuni', icon: '🌡️', category: 'Kodinkoneet', minutesEach: 15 },
  { id: 'fridge', label: 'Jääkaappi', icon: '🧊', category: 'Kodinkoneet', minutesEach: 20 },
  { id: 'freezer', label: 'Pakastin', icon: '❄️', category: 'Kodinkoneet', minutesEach: 20 },
  { id: 'fridge_freezer', label: 'Jääkaappi–pakastin', icon: '🧊', category: 'Kodinkoneet', minutesEach: 25 },
  { id: 'wine_cooler', label: 'Viinikaappi', icon: '🍷', category: 'Kodinkoneet', minutesEach: 12 },
  { id: 'laundry_basket', label: 'Pyykkikori', icon: '🧺', category: 'Kodinkoneet', minutesEach: 3 },
  { id: 'laundry_rack', label: 'Pyykkiteline', icon: '👕', category: 'Kodinkoneet', minutesEach: 5 },

  // Toimisto
  { id: 'electric_desk', label: 'Sähköpöytä', icon: '⚡', category: 'Toimisto', minutesEach: 15 },
  { id: 'work_desk', label: 'Työpöytä', icon: '💼', category: 'Toimisto', minutesEach: 12 },
  { id: 'office_chair', label: 'Toimistotuoli', icon: '🪑', category: 'Toimisto', minutesEach: 8 },
  { id: 'printer', label: 'Tulostin', icon: '🖨️', category: 'Toimisto', minutesEach: 5 },
  { id: 'monitor', label: 'Tietokonenäyttö', icon: '🖥️', category: 'Toimisto', minutesEach: 5 },
  { id: 'filing_cabinet_small', label: 'Arkistokaappi pieni', icon: '🗂️', category: 'Toimisto', minutesEach: 12 },
  { id: 'filing_cabinet_large', label: 'Arkistokaappi iso', icon: '🗃️', category: 'Toimisto', minutesEach: 20 },

  // Lasten tavarat
  { id: 'crib', label: 'Lastensänky', icon: '👶', category: 'Lasten tavarat', minutesEach: 10 },
  { id: 'bunk_bed', label: 'Pinnasänky', icon: '🛏️', category: 'Lasten tavarat', minutesEach: 18 },
  { id: 'high_chair', label: 'Syöttötuoli', icon: '🍼', category: 'Lasten tavarat', minutesEach: 8 },
  { id: 'stroller', label: 'Lastenvaunut / rattaat', icon: '🚼', category: 'Lasten tavarat', minutesEach: 5 },
  { id: 'toy_box', label: 'Lelulaatikko', icon: '🧸', category: 'Lasten tavarat', minutesEach: 5 },
  { id: 'small_bath', label: 'Pieni amme', icon: '🛁', category: 'Lasten tavarat', minutesEach: 5 },

  // Erikoistavarat
  { id: 'speaker_large', label: 'Kaiutin iso', icon: '🎵', category: 'Erikoistavarat', minutesEach: 8 },
  { id: 'rug_rolled', label: 'Matto rullattuna', icon: '🧵', category: 'Erikoistavarat', minutesEach: 12 },
  { id: 'aquarium_empty', label: 'Akvaario (tyhjä)', icon: '🐠', category: 'Erikoistavarat', minutesEach: 10 },
  { id: 'coat_rack', label: 'Pystynaulakko', icon: '🧥', category: 'Erikoistavarat', minutesEach: 5 },
  { id: 'curtains_packed', label: 'Verhot (pakattu)', icon: '🪟', category: 'Erikoistavarat', minutesEach: 5 },
  { id: 'flower_pot', label: 'Kukkaruukku', icon: '🌺', category: 'Erikoistavarat', minutesEach: 2 },
  { id: 'dog_cage', label: 'Koirahäkki', icon: '🐕', category: 'Erikoistavarat', minutesEach: 10 },
  { id: 'cat_tree', label: 'Kissan kiipeilypuu', icon: '🐱', category: 'Erikoistavarat', minutesEach: 12 },

  // Ulkokalusteet ja varasto
  { id: 'grill', label: 'Grilli', icon: '🍖', category: 'Ulkokalusteet ja varasto', minutesEach: 15 },
  { id: 'garden_chair', label: 'Puutarhatuoli', icon: '🌻', category: 'Ulkokalusteet ja varasto', minutesEach: 5 },
  { id: 'garden_table', label: 'Puutarhapöytä', icon: '🌳', category: 'Ulkokalusteet ja varasto', minutesEach: 12 },
  { id: 'bicycle', label: 'Polkupyörä', icon: '🚲', category: 'Ulkokalusteet ja varasto', minutesEach: 5 },
  { id: 'scooter', label: 'Potkulauta', icon: '🛴', category: 'Ulkokalusteet ja varasto', minutesEach: 2 },
  { id: 'tire_set', label: 'Rengassarja', icon: '🛞', category: 'Ulkokalusteet ja varasto', minutesEach: 8 },
  { id: 'lawn_mower', label: 'Ruohonleikkuri', icon: '🌾', category: 'Ulkokalusteet ja varasto', minutesEach: 12 },
  { id: 'snow_shovel', label: 'Lumilinko', icon: '❄️', category: 'Ulkokalusteet ja varasto', minutesEach: 2 },
  { id: 'treadmill', label: 'Juoksumatta', icon: '🏃', category: 'Ulkokalusteet ja varasto', minutesEach: 30 },
  { id: 'fitness_equipment', label: 'Kuntolaite', icon: '💪', category: 'Ulkokalusteet ja varasto', minutesEach: 20 },
  { id: 'workbench', label: 'Työpöytä (verstas)', icon: '🔧', category: 'Ulkokalusteet ja varasto', minutesEach: 25 },
  { id: 'metal_shelf', label: 'Metallinen hylly', icon: '⛓️', category: 'Ulkokalusteet ja varasto', minutesEach: 12 },

  // Raskaat tavarat
  { id: 'safe_large', label: 'Kassakaappi iso', icon: '🏋️', category: 'Raskaat tavarat', minutesEach: 45 },
  { id: 'piano_large', label: 'Piano', icon: '🎹', category: 'Raskaat tavarat', minutesEach: 90 },
  { id: 'grand_piano', label: 'Flyygeli', icon: '🎼', category: 'Raskaat tavarat', minutesEach: 120 },
] as const;

export type FurnitureId = typeof FURNITURE_CATALOG[number]['id'];

export const CalculatorSchema = z.object({
  // Service type
  serviceType: z.enum(['moving', 'transport', 'recycling']).default('moving'),
  movingPackage: z.enum(['full_service', 'driver_with_vehicle', 'carrying_help']).optional(),
  
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
  heavyItems: z.array(z.string()).default([]),
  furnitureItems: z.record(z.string(), z.number()).default({}),
  
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
    serviceType = 'moving',
    distanceKm,
    apartmentSize,
    elevatorFrom,
    elevatorTo,
    floorFrom,
    floorTo,
    heavyItems,
    needsPacking,
    furnitureItems = {},
  } = data;

  // 1. Distance Cost
  // Route: Finlandia -> A -> B -> Finlandia
  // We approximate this as: distance(A->B) + overhead
  // In a real app, we'd sum the actual segments.
  const totalDistance = distanceKm + PRICING_CONSTANTS.finlandiaLoopKm; // Adding base loop distance
  const distanceCost = totalDistance * PRICING_CONSTANTS.ratePerKm;

  // For transport (kuljetus) service: simplified pricing with minimal labor
  if (serviceType === 'transport') {
    // Transport = only driver + van, no movers
    // Minimal time: just drive time + loading/unloading by driver only
    const driveTime = (distanceKm / 40) + 0.25;
    const driverLoadTime = 0.5; // Driver handles loading themselves
    const driverUnloadTime = 0.25; // Quick unload
    
    let totalLaborHours = driveTime + driverLoadTime + driverUnloadTime;
    totalLaborHours = Math.ceil(totalLaborHours * 2) / 2;
    
    const hourlyRate = PRICING_CONSTANTS.hourlyRateDefault; // Standard rate for transport
    const laborCost = totalLaborHours * hourlyRate;
    
    let subtotal = distanceCost + laborCost;
    
    // Minimum Charge for transport (lower than moving)
    const transportMinimum = 199; // €
    if (subtotal < transportMinimum) {
      subtotal = transportMinimum;
    }
    
    const total = subtotal;
    const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));
    
    return {
      distanceCost,
      laborCost,
      extrasCost: 0,
      subtotal: total - vat,
      vat,
      total,
      estimatedDurationHours: totalLaborHours,
      details: {
        distanceKm: totalDistance,
        laborHours: totalLaborHours,
        laborRate: hourlyRate,
        crewSize: 1, // Only driver
      },
    };
  }

  // MOVING SERVICE (muutto) - standard pricing with 2 movers

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

  // Furniture items - add time based on catalog
  let furnitureMinutes = 0;
  for (const [id, qty] of Object.entries(furnitureItems)) {
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    if (item && qty > 0) {
      furnitureMinutes += item.minutesEach * qty;
    }
  }
  totalLaborHours += furnitureMinutes / 60;

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
