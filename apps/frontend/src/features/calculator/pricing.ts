import { z } from 'zod';

// v2.1-kalibrointi: minuutit kuvaavat tavaran OSUUTTA koko muuton kestoon, ei sen
// yksittäistä siirtoaikaa. Ammattimuuttaja kantaa useita tavaroita per kierros, käyttää
// nokkakärryjä ja tekee työvaiheita rinnakkain — siksi arvot ovat huomattavasti pienempiä
// kuin "yhden tavaran yksin kantaminen" antaisi olettaa.
export const FURNITURE_CATALOG = [
  // Olohuone
  { id: 'plant_small', label: 'Huonekasvi', icon: '🪴', category: 'Olohuone', minutesEach: 0.5 },
  { id: 'plant_large', label: 'Huonekasvi iso', icon: '🌿', category: 'Olohuone', minutesEach: 2 },
  { id: 'bookshelf', label: 'Kirjahylly', icon: '📚', category: 'Olohuone', minutesEach: 5 },
  { id: 'shoe_cabinet', label: 'Kenkäkaappi', icon: '👞', category: 'Olohuone', minutesEach: 3 },
  { id: 'shoe_rack', label: 'Kenkäteline', icon: '👟', category: 'Olohuone', minutesEach: 1 },
  { id: 'sofa_2', label: 'Sohva 2-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 10 },
  { id: 'sofa_3', label: 'Sohva 3-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 14 },
  { id: 'sofa_4', label: 'Sohva 4-istuttava', icon: '🛋️', category: 'Olohuone', minutesEach: 18 },
  { id: 'sofa_divan', label: 'Divaanisohva', icon: '🛏️', category: 'Olohuone', minutesEach: 14 },
  { id: 'corner_sofa_small', label: 'Kulmasohva pieni', icon: '🛋️', category: 'Olohuone', minutesEach: 15 },
  { id: 'corner_sofa_large', label: 'Kulmasohva iso', icon: '🛋️', category: 'Olohuone', minutesEach: 20 },
  { id: 'armchair', label: 'Nojatuoli', icon: '💺', category: 'Olohuone', minutesEach: 4 },
  { id: 'ottoman_small', label: 'Rahi / jakkara', icon: '🪑', category: 'Olohuone', minutesEach: 1 },
  { id: 'ottoman_large', label: 'Rahi / jakkara iso', icon: '🎁', category: 'Olohuone', minutesEach: 4 },
  { id: 'tv_stand_small', label: 'TV-taso pieni', icon: '📺', category: 'Olohuone', minutesEach: 3 },
  { id: 'tv_stand_large', label: 'TV-taso iso', icon: '🎬', category: 'Olohuone', minutesEach: 8 },
  { id: 'display_cabinet', label: 'Vitriinikaappi', icon: '🪟', category: 'Olohuone', minutesEach: 10 },
  { id: 'entrance_bench', label: 'Eteispenkki', icon: '🛖', category: 'Olohuone', minutesEach: 4 },
  { id: 'side_table', label: 'Sivupöytä', icon: '🪣', category: 'Olohuone', minutesEach: 2 },
  { id: 'wall_cabinet', label: 'Seinäkaappi', icon: '🗄️', category: 'Olohuone', minutesEach: 6 },
  { id: 'floor_lamp', label: 'Lattiavalaisin', icon: '💡', category: 'Olohuone', minutesEach: 1 },
  { id: 'coffee_table', label: 'Sohvapöytä', icon: '☕', category: 'Olohuone', minutesEach: 3 },
  { id: 'tv_small', label: 'Televisio pieni (32–43")', icon: '📺', category: 'Olohuone', minutesEach: 2 },
  { id: 'tv_55', label: 'Televisio 55"', icon: '🖥️', category: 'Olohuone', minutesEach: 4 },
  { id: 'tv_65', label: 'Televisio 65"', icon: '🎥', category: 'Olohuone', minutesEach: 5 },
  { id: 'tv_75', label: 'Televisio 75"', icon: '📹', category: 'Olohuone', minutesEach: 6 },
  { id: 'tv_85plus', label: 'Televisio 85"+', icon: '🎞️', category: 'Olohuone', minutesEach: 8 },
  { id: 'painting_large', label: 'Taulu (iso)', icon: '🖼️', category: 'Olohuone', minutesEach: 1 },
  { id: 'speaker', label: 'Kaiutin', icon: '🔊', category: 'Olohuone', minutesEach: 1 },

  // Makuuhuone
  { id: 'wardrobe_assembled', label: 'Vaatekaappi koottu', icon: '🚪', category: 'Makuuhuone', minutesEach: 18 },
  { id: 'wardrobe_disassembled', label: 'Vaatekaappi purettu', icon: '🪟', category: 'Makuuhuone', minutesEach: 12 },
  { id: 'mirror_full', label: 'Peili (kokovartalo)', icon: '🪞', category: 'Makuuhuone', minutesEach: 2 },
  { id: 'nightstand', label: 'Yöpöytä', icon: '🌙', category: 'Makuuhuone', minutesEach: 1 },
  { id: 'dresser_small', label: 'Lipasto pieni', icon: '🗄️', category: 'Makuuhuone', minutesEach: 4 },
  { id: 'dresser_large', label: 'Lipasto iso', icon: '💼', category: 'Makuuhuone', minutesEach: 8 },
  { id: 'bean_bag', label: 'Säkkituoli', icon: '💺', category: 'Makuuhuone', minutesEach: 2 },
  { id: 'bed_headboard', label: 'Sängynpääty', icon: '🎨', category: 'Makuuhuone', minutesEach: 3 },
  { id: 'bed_80', label: 'Sänky 80 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 6 },
  { id: 'bed_120', label: 'Sänky 120 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 8 },
  { id: 'bed_140', label: 'Sänky 140 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 10 },
  { id: 'bed_160', label: 'Sänky 160 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 11 },
  { id: 'bed_180', label: 'Sänky 180 cm', icon: '🛏️', category: 'Makuuhuone', minutesEach: 12 },
  { id: 'mattress_80', label: 'Patja 80–90 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 3 },
  { id: 'mattress_120', label: 'Patja 120–160 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 5 },
  { id: 'mattress_180', label: 'Patja 180 cm', icon: '🧵', category: 'Makuuhuone', minutesEach: 6 },
  { id: 'desk_bedroom', label: 'Kirjoitus/Työpöytä', icon: '📚', category: 'Makuuhuone', minutesEach: 7 },

  // Laatikot ja pakkaukset
  // Laatikoita ei kanneta yksitellen — ammattimuuttaja siirtää useita laatikoita kerralla
  // nokkakärryllä (n. 4 laatikkoa/kuorma), joten minuuttiarvo on laatikon OSUUS
  // kärryllisen kokonaisajasta, ei yhden laatikon erillinen kantomatka.
  { id: 'box_standard', label: 'Muuttolaatikko (vakio)', icon: '📦', category: 'Laatikot ja pakkaukset', minutesEach: 0.7 },
  { id: 'box_clothes', label: 'Vaatelaatikko', icon: '👕', category: 'Laatikot ja pakkaukset', minutesEach: 0.7 },
  { id: 'storage_box_small', label: 'Säilytyslaatikko pieni', icon: '🟦', category: 'Laatikot ja pakkaukset', minutesEach: 0.5 },
  { id: 'storage_box_medium', label: 'Säilytyslaatikko keskikokoinen', icon: '🟪', category: 'Laatikot ja pakkaukset', minutesEach: 0.6 },
  { id: 'storage_box_large', label: 'Säilytyslaatikko iso', icon: '🟩', category: 'Laatikot ja pakkaukset', minutesEach: 0.8 },
  { id: 'suitcase', label: 'Matkalaukku', icon: '🧳', category: 'Laatikot ja pakkaukset', minutesEach: 0.8 },
  { id: 'plastic_bag', label: 'Muovisäkki', icon: '🛍️', category: 'Laatikot ja pakkaukset', minutesEach: 0.3 },
  { id: 'chest', label: 'Arkku', icon: '⚱️', category: 'Laatikot ja pakkaukset', minutesEach: 4 },

  // Keittiö
  { id: 'kitchen_cabinet', label: 'Astiakaappi', icon: '🍳', category: 'Keittiö', minutesEach: 10 },
  { id: 'microwave', label: 'Mikroaaltouuni', icon: '🔥', category: 'Keittiö', minutesEach: 2 },
  { id: 'glass_table', label: 'Lasipöytä', icon: '🥃', category: 'Keittiö', minutesEach: 6 },
  { id: 'coffee_maker', label: 'Kahvikone', icon: '☕', category: 'Keittiö', minutesEach: 0.5 },
  { id: 'sink', label: 'Senkki', icon: '🚰', category: 'Keittiö', minutesEach: 10 },
  { id: 'dining_table_small', label: 'Ruokapöytä pieni', icon: '🍽️', category: 'Keittiö', minutesEach: 6 },
  { id: 'dining_table_large', label: 'Ruokapöytä iso', icon: '🍴', category: 'Keittiö', minutesEach: 8 },
  { id: 'dining_table_extendable', label: 'Jatkettava ruokapöytä', icon: '🔧', category: 'Keittiö', minutesEach: 10 },
  { id: 'bar_stool', label: 'Baarituoli', icon: '🍹', category: 'Keittiö', minutesEach: 1 },
  { id: 'kitchen_chair', label: 'Tuoli', icon: '🪑', category: 'Keittiö', minutesEach: 1 },
  { id: 'table_top', label: 'Pöytälevy', icon: '🪨', category: 'Keittiö', minutesEach: 3 },

  // Kodinkoneet
  { id: 'washing_machine', label: 'Pesukone', icon: '🫧', category: 'Kodinkoneet', minutesEach: 10 },
  { id: 'dryer', label: 'Kuivausrumpu', icon: '🌀', category: 'Kodinkoneet', minutesEach: 8 },
  { id: 'washer_dryer_tower', label: 'Pesutorni (pesukone + kuivausrumpu)', icon: '🌀', category: 'Kodinkoneet', minutesEach: 16 },
  { id: 'dishwasher', label: 'Astianpesukone', icon: '🍽️', category: 'Kodinkoneet', minutesEach: 6 },
  { id: 'stove', label: 'Liesi', icon: '🔥', category: 'Kodinkoneet', minutesEach: 8 },
  { id: 'oven', label: 'Uuni', icon: '🌡️', category: 'Kodinkoneet', minutesEach: 5 },
  { id: 'fridge', label: 'Jääkaappi', icon: '🧊', category: 'Kodinkoneet', minutesEach: 10 },
  { id: 'freezer', label: 'Pakastin', icon: '❄️', category: 'Kodinkoneet', minutesEach: 10 },
  { id: 'fridge_freezer', label: 'Jääkaappi–pakastin', icon: '🧊', category: 'Kodinkoneet', minutesEach: 14 },
  { id: 'fridge_us', label: 'Jenkkikaappi (amerikkalainen jääkaappi-pakastin)', icon: '🧊', category: 'Kodinkoneet', minutesEach: 20 },
  { id: 'wine_cooler', label: 'Viinikaappi', icon: '🍷', category: 'Kodinkoneet', minutesEach: 5 },
  { id: 'laundry_basket', label: 'Pyykkikori', icon: '🧺', category: 'Kodinkoneet', minutesEach: 0.5 },
  { id: 'laundry_rack', label: 'Pyykkiteline', icon: '👕', category: 'Kodinkoneet', minutesEach: 1 },

  // Toimisto
  { id: 'electric_desk', label: 'Sähköpöytä', icon: '⚡', category: 'Toimisto', minutesEach: 10 },
  { id: 'work_desk', label: 'Työpöytä', icon: '💼', category: 'Toimisto', minutesEach: 6 },
  { id: 'office_chair', label: 'Toimistotuoli', icon: '🪑', category: 'Toimisto', minutesEach: 2 },
  { id: 'printer', label: 'Tulostin', icon: '🖨️', category: 'Toimisto', minutesEach: 1 },
  { id: 'monitor', label: 'Tietokonenäyttö', icon: '🖥️', category: 'Toimisto', minutesEach: 1 },
  { id: 'filing_cabinet_small', label: 'Arkistokaappi pieni', icon: '🗂️', category: 'Toimisto', minutesEach: 6 },
  { id: 'filing_cabinet_large', label: 'Arkistokaappi iso', icon: '🗃️', category: 'Toimisto', minutesEach: 10 },

  // Lasten tavarat
  { id: 'crib', label: 'Lastensänky', icon: '👶', category: 'Lasten tavarat', minutesEach: 5 },
  { id: 'bunk_bed', label: 'Pinnasänky', icon: '🛏️', category: 'Lasten tavarat', minutesEach: 8 },
  { id: 'high_chair', label: 'Syöttötuoli', icon: '🍼', category: 'Lasten tavarat', minutesEach: 2 },
  { id: 'stroller', label: 'Lastenvaunut / rattaat', icon: '🚼', category: 'Lasten tavarat', minutesEach: 3 },
  { id: 'toy_box', label: 'Lelulaatikko', icon: '🧸', category: 'Lasten tavarat', minutesEach: 2 },
  { id: 'small_bath', label: 'Pieni amme', icon: '🛁', category: 'Lasten tavarat', minutesEach: 1 },

  // Erikoistavarat
  { id: 'speaker_large', label: 'Kaiutin iso', icon: '🎵', category: 'Erikoistavarat', minutesEach: 3 },
  { id: 'rug_rolled', label: 'Matto rullattuna', icon: '🧵', category: 'Erikoistavarat', minutesEach: 2 },
  { id: 'aquarium_empty', label: 'Akvaario (tyhjä)', icon: '🐠', category: 'Erikoistavarat', minutesEach: 6 },
  { id: 'coat_rack', label: 'Pystynaulakko', icon: '🧥', category: 'Erikoistavarat', minutesEach: 1 },
  { id: 'curtains_packed', label: 'Verhot (pakattu)', icon: '🪟', category: 'Erikoistavarat', minutesEach: 0.5 },
  { id: 'flower_pot', label: 'Kukkaruukku', icon: '🌺', category: 'Erikoistavarat', minutesEach: 0.5 },
  { id: 'dog_cage', label: 'Koirahäkki', icon: '🐕', category: 'Erikoistavarat', minutesEach: 2 },
  { id: 'cat_tree', label: 'Kissan kiipeilypuu', icon: '🐱', category: 'Erikoistavarat', minutesEach: 6 },

  // Ulkokalusteet ja varasto
  { id: 'grill', label: 'Grilli', icon: '🍖', category: 'Ulkokalusteet ja varasto', minutesEach: 6 },
  { id: 'garden_chair', label: 'Puutarhatuoli', icon: '🌻', category: 'Ulkokalusteet ja varasto', minutesEach: 1 },
  { id: 'garden_table', label: 'Puutarhapöytä', icon: '🌳', category: 'Ulkokalusteet ja varasto', minutesEach: 4 },
  { id: 'bicycle', label: 'Polkupyörä', icon: '🚲', category: 'Ulkokalusteet ja varasto', minutesEach: 2 },
  { id: 'scooter', label: 'Potkulauta', icon: '🛴', category: 'Ulkokalusteet ja varasto', minutesEach: 0.5 },
  { id: 'tire_set', label: 'Rengassarja', icon: '🛞', category: 'Ulkokalusteet ja varasto', minutesEach: 2 },
  { id: 'lawn_mower', label: 'Ruohonleikkuri', icon: '🌾', category: 'Ulkokalusteet ja varasto', minutesEach: 4 },
  { id: 'snow_shovel', label: 'Lumilinko', icon: '❄️', category: 'Ulkokalusteet ja varasto', minutesEach: 6 },
  { id: 'treadmill', label: 'Juoksumatta', icon: '🏃', category: 'Ulkokalusteet ja varasto', minutesEach: 16 },
  { id: 'fitness_equipment', label: 'Kuntolaite', icon: '💪', category: 'Ulkokalusteet ja varasto', minutesEach: 12 },
  { id: 'workbench', label: 'Työpöytä (verstas)', icon: '🔧', category: 'Ulkokalusteet ja varasto', minutesEach: 12 },
  { id: 'metal_shelf', label: 'Metallinen hylly', icon: '⛓️', category: 'Ulkokalusteet ja varasto', minutesEach: 5 },

  // Raskaat tavarat
  { id: 'safe_large', label: 'Kassakaappi iso', icon: '🏋️', category: 'Raskaat tavarat', minutesEach: 45 },
  { id: 'piano_large', label: 'Piano', icon: '🎹', category: 'Raskaat tavarat', minutesEach: 90 },
  { id: 'grand_piano', label: 'Flyygeli', icon: '🎼', category: 'Raskaat tavarat', minutesEach: 120 },
] as const;

export type FurnitureId = typeof FURNITURE_CATALOG[number]['id'];

// Tavarat joiden kanto-osuuteen sovelletaan korotettua kerroskerrointa
// (porraskäynti ilman hissiä rasittaa raskaiden tavaroiden kantoa enemmän kuin kevyiden).
export const HEAVY_ITEM_IDS = new Set<FurnitureId>([
  'piano_large',
  'grand_piano',
  'safe_large',
  'treadmill',
  'fitness_equipment',
  'fridge_us',
  'washer_dryer_tower',
]);

// Kategoriakohtaiset kertoimet joista johdetaan jokaisen tavaran kanto- ja tilavaikutus
// käsittelyajasta (minutesEach). Kategoriatason kertoimet (ei käsin viritettyjä arvoja
// jokaiselle ~100 tavaralle) pitävät katalogin ylläpidettävänä.
//
// HUOM volumeM3PerMin: tilavuus on tavaran FYYSINEN ominaisuus, ei riipu siitä kuinka
// nopeasti se käsitellään — minutesEach-arvoja on leikattu useaan otteeseen (trolley-
// batching laatikoille, v2.1-kalibrointi kauttaaltaan), eikä volumeM3PerMin saa enää
// johtaa suoraan minutesEach:sta kertoimena vaan kalibroitu erikseen REALISTISIIN
// m³-arvoihin per kategoria (esim. vakiolaatikko ~0.1 m³, ei minutesEach × vanha kerroin).
const CATEGORY_FACTORS: Record<string, { carryRatio: number; volumeM3PerMin: number }> = {
  'Olohuone': { carryRatio: 0.40, volumeM3PerMin: 0.10 },
  'Makuuhuone': { carryRatio: 0.45, volumeM3PerMin: 0.10 },
  'Laatikot ja pakkaukset': { carryRatio: 0.65, volumeM3PerMin: 0.14 },
  'Keittiö': { carryRatio: 0.40, volumeM3PerMin: 0.10 },
  'Kodinkoneet': { carryRatio: 0.40, volumeM3PerMin: 0.06 },
  'Toimisto': { carryRatio: 0.40, volumeM3PerMin: 0.08 },
  'Lasten tavarat': { carryRatio: 0.45, volumeM3PerMin: 0.08 },
  'Erikoistavarat': { carryRatio: 0.40, volumeM3PerMin: 0.08 },
  'Ulkokalusteet ja varasto': { carryRatio: 0.45, volumeM3PerMin: 0.08 },
  'Raskaat tavarat': { carryRatio: 0.55, volumeM3PerMin: 0.02 }, // painavat tavarat ovat tiheitä, eivät tilavuudeltaan jättimäisiä
};

function categoryFactors(category: string) {
  return CATEGORY_FACTORS[category] ?? { carryRatio: 0.40, volumeM3PerMin: 0.08 };
}

export type RecyclingWasteType = {
  id: string;
  label: string;
  icon: string;
  description: string;
  disposalCostPerLoad: number; // € per erä. 0 = ilmainen kierrätys.
};

// Jätetyyppikohtaiset kierrätysmaksut (HSY/Ämmässuo 2024 kaupalliset hinnat, per pieni erä).
export const RECYCLING_WASTE_TYPES: RecyclingWasteType[] = [
  { id: 'suurjate',      label: 'Suurjäte',          icon: '🛋️', description: 'Huonekalut, matot, patjat',              disposalCostPerLoad: 25 },
  { id: 'puujate',       label: 'Puujäte',            icon: '🪵', description: 'Puu, laudat, puiset huonekalut',         disposalCostPerLoad: 20 },
  { id: 'sekajate',      label: 'Sekajäte',           icon: '🗑️', description: 'Sekalainen jäte, ei lajiteltavissa',    disposalCostPerLoad: 50 },
  { id: 'metallit',      label: 'Metallit',           icon: '🔧', description: 'Metalliromut, kodinkoneet (metalli)',    disposalCostPerLoad: 0  },
  { id: 'elektroniikka', label: 'Elektroniikka (SER)', icon: '📺', description: 'TV, kodinelektroniikka — WEEE-velvoite', disposalCostPerLoad: 0  },
  { id: 'rakennusjate',  label: 'Rakennusjäte',       icon: '🧱', description: 'Remonttijäte, tiili, kipsilevy, betoni', disposalCostPerLoad: 60 },
];

export const CalculatorSchema = z.object({
  // Service type
  serviceType: z.enum(['moving', 'transport', 'recycling']).default('moving'),
  movingPackage: z.enum(['full_service', 'driver_with_vehicle', 'carrying_help']).optional(),

  // Locations
  addressFrom: z.string().min(1, 'Lähtöosoite vaaditaan'),
  addressTo: z.string().min(1, 'Kohdeosoite vaaditaan'),
  additionalStops: z.array(z.string()).default([]), // Välipysähdysten osoitteet (kuljetus)
  distanceKm: z.number().min(0).default(0), // Calculated or input

  // Kuljetus (transport) -spesifiset
  driverCount: z.enum(['1', '2']).default('1'),

  // Apartment details
  apartmentSize: z.enum(['1h', '2h', '3h', '4h+', 'office']),
  squareMeters: z.number().optional(),

  // Access details
  floorFrom: z.number().default(0),
  elevatorFrom: z.boolean().default(false),
  floorTo: z.number().default(0),
  elevatorTo: z.boolean().default(false),

  // Carry distance (kantomatka) from the door to the moving vehicle, each end
  carryDistanceFrom: z.enum(['<10', '10-30', '30-50', '50+']).default('<10'),
  carryDistanceTo: z.enum(['<10', '10-30', '30-50', '50+']).default('<10'),

  // Inventory
  boxCount: z.number().default(0),
  heavyItems: z.array(z.string()).default([]), // Legacy, kept for backward compatibility, no longer used in pricing
  furnitureItems: z.record(z.string(), z.number()).default({}),
  customItems: z.array(z.object({ label: z.string(), qty: z.number() })).default([]), // Tavarat joita ei löydy katalogista

  // Service level
  needsPacking: z.boolean().default(false),
  needsCleaning: z.boolean().default(false),
  services: z.array(z.string()).default([]),
  selectedWasteTypes: z.array(z.string()).default([]), // Kierrätys-jätetyypit

  // Timing
  date: z.date().optional(),

  // Contact (captured at booking stage)
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export type CalculatorData = z.infer<typeof CalculatorSchema>;
export type CarryDistance = CalculatorData['carryDistanceFrom'];

export interface PriceBreakdown {
  distanceCost: number;
  laborCost: number;
  extrasCost: number;
  disposalCost: number; // Kierrätysmaksut (jätetyypeistä), 0 muilla palvelutyypeillä
  subtotal: number;
  vat: number;
  total: number;
  normalPriceTotal: number; // Hinta ennen muuttopäivän alennusta
  dateDiscountFraction: number; // 0-1
  dateDiscountAmount: number; // €, normalPriceTotal - total
  dateDiscountLabel: string; // "Edullinen päivä" / "Normaali päivä" / "Suosittu päivä"
  dateDiscountEmoji: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  inventoryWarning?: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  estimatedDurationHours: number;
  details: {
    distanceKm: number;
    laborHours: number;
    laborRate: number;
    crewSize: number; // 2 movers + van usually
    totalVolumeM3: number;
    totalItemCount: number;
    rawHandlingMinutes: number; // ennen suuren tavaramäärän tehokkuuskerrointa
    crewEfficiencyApplied: boolean;
    itemBreakdown: { id: string; label: string; qty: number; minutes: number; catalogMinutesEach: number; isCustom?: boolean }[]; // debug-erittely tavaroittain
    // Täysi aikaerittely: nämä summattuna (minuutteina) ja pyöristettynä ylöspäin 15 min
    // tarkkuudella = estimatedDurationHours. Debug-näkymän tulee näyttää KAIKKI nämä,
    // ei vain käsittelyminuutteja, jotta "arvioitu työaika" on jäljitettävissä.
    timeBreakdown: {
      handlingMinutes: number; // tehokkuuskertoimen jälkeen (billed)
      carryExtraMinutes: number;
      assemblyMinutes: number;
      packingMinutes: number;
      driveTimeHours: number;
      baseTimeHours: number; // COORDINATION_TIME_HOURS — kiinteä koordinointiaika
    };
    impactBreakdown: {
      items: number; // Tavaramäärän (käsittelyajan) vaikutus, €
      floors: number; // Kerrosten/hissin vaikutus, €
      carryDistance: number; // Kantomatkan vaikutus, €
      distance: number; // Muuttomatkan vaikutus, €
      extras: number; // Purku/kasaus + pakkauspalvelun vaikutus, €
      base: number; // Perustyöaika (auton lastaus/purku, koordinointi), €. Nämä 6 summattuna = normalPriceTotal.
    };
  };
}

export const INCLUDED_DISTANCE_KM = 5;

const PRICING_CONSTANTS = {
  ratePerKm: 0.79,
  includedDistanceKm: INCLUDED_DISTANCE_KM,
  hourlyRateDefault: 129, // €/h
  hourlyRateComplex: 159, // €/h
  driverWithVehicleRate: 89, // €/h
  carryingHelpRate: 89.9, // €/h
  driverWithVehicleMinimum: 184, // €
  carryingHelpMinimum: 180, // €
  vatRate: 0.255, // 25.5% VAT
  // Kerroskertoimet (sovelletaan vain kun hissiä ei ole) — ks. v2-speksi
  floorFactorPerLevel: 0.12,
  heavyFloorFactorPerLevel: 0.18,
  carryDistanceFactors: {
    '<10': 1.00,
    '10-30': 1.10,
    '30-50': 1.20,
    '50+': 1.35,
  } as Record<CarryDistance, number>,
  assemblyRatio: 0.25, // "Purkupalvelu" lisää tämän verran käsittelyajasta
  packingMinutesPerBox: 3,
  packingMinutesPerOtherItem: 4,
  priceRangeNormal: 0.05, // ±5%
  priceRangeWarning: 0.10, // ±10% kun tavaralista vaikuttaa epätäydelliseltä
};

// Muuttopäivän alennus — ei koskaan korotusta, vain alennuksia hiljaisemmille päiville.
// Helposti muokattava konfiguraatio (v2-speksin lisäys).
type DateDiscountTier = { label: string; emoji: string; discount: number };
const WEEKDAY_DISCOUNTS: Record<number, DateDiscountTier> = {
  // JS Date.getDay(): 0 = sunnuntai ... 6 = lauantai
  0: { label: 'Suosittu päivä', emoji: '🔴', discount: 0 }, // Sunnuntai
  1: { label: 'Normaali päivä', emoji: '🟡', discount: 0.05 }, // Maanantai
  2: { label: 'Edullinen päivä', emoji: '🟢', discount: 0.10 }, // Tiistai
  3: { label: 'Edullinen päivä', emoji: '🟢', discount: 0.10 }, // Keskiviikko
  4: { label: 'Normaali päivä', emoji: '🟡', discount: 0.05 }, // Torstai
  5: { label: 'Suosittu päivä', emoji: '🔴', discount: 0 }, // Perjantai
  6: { label: 'Suosittu päivä', emoji: '🔴', discount: 0 }, // Lauantai
};
const MID_MONTH_BONUS_DISCOUNT = 0.05;
const MID_MONTH_RANGE: [number, number] = [8, 24];
const DEFAULT_DATE_DISCOUNT: DateDiscountTier = { label: 'Suosittu päivä', emoji: '🔴', discount: 0 };

function getDateDiscount(date: Date | undefined): DateDiscountTier {
  if (!date) return DEFAULT_DATE_DISCOUNT;
  const tier = WEEKDAY_DISCOUNTS[date.getDay()];
  const dayOfMonth = date.getDate();
  const midMonthBonus =
    dayOfMonth >= MID_MONTH_RANGE[0] && dayOfMonth <= MID_MONTH_RANGE[1] ? MID_MONTH_BONUS_DISCOUNT : 0;
  return { ...tier, discount: tier.discount + midMonthBonus };
}

// Odotettu tavaramäärän tilavuus (m³) asunnon koon mukaan — käytetään vain
// laadunvarmistukseen (varoitustekstiin), ei koskaan hinnan automaattiseen korjaukseen.
const EXPECTED_VOLUME_M3: Record<CalculatorData['apartmentSize'], [number, number]> = {
  '1h': [10, 25],
  '2h': [20, 40],
  '3h': [35, 60],
  '4h+': [55, 100],
  office: [0, 999],
};

const INVENTORY_WARNING_MESSAGE =
  'Tavaralista näyttää poikkeuksellisen pieneltä suhteessa ilmoitettuun asunnon kokoon. Tarkista, että kaikki suuret huonekalut ja laatikot on lisätty.';

// Tyypillinen käsittelyaika (min) tämän kokoiselle asunnolle — kalibroitu tyypillisistä
// tavaralistoista. Toimii vain kattona "normaalille" kuormalle: tämän ALLE oleva
// tavaramäärä hinnoitellaan täysin lineaarisesti (kuten ennenkin), mutta tämän YLI
// menevä osa hinnoitellaan tehokkuuskertoimella, koska kuljetusliike pystyy käytännössä
// käsittelemään suuren tavaramäärän tehokkaammin kuin suoraviivainen minuuttisumma antaisi
// ymmärtää (useita tavaroita kuljetetaan samalla kertaa, rutiini nopeutuu jne).
// Asunnon koko pysyy silti vain tarkistusmuuttujana: pieni tavaralista isossa asunnossa
// EI nosta hintaa, ja tämä mekanismi EI koskaan nosta hintaa — se vain estää tavaralistan
// ylihinnoittelua kun tavaramäärä on poikkeuksellisen suuri suhteessa asunnon kokoon.
// v2.1: katalogin minuuttiarvot puolittuivat suunnilleen edellisestä kalibroinnista,
// joten "tyypillinen" käsittelyaika tälle koolle puolitettiin samassa suhteessa.
const EXPECTED_HANDLING_MINUTES: Record<CalculatorData['apartmentSize'], number> = {
  '1h': 45,
  '2h': 105,
  '3h': 170,
  '4h+': 270,
  office: 170,
};
const EXCESS_HANDLING_EFFICIENCY = 0.20; // ylimenevästä osasta laskutetaan vain tämä osuus

function applyCrewEfficiency(rawHandlingMinutes: number, apartmentSize: CalculatorData['apartmentSize']): number {
  const baseline = EXPECTED_HANDLING_MINUTES[apartmentSize];
  if (rawHandlingMinutes <= baseline) return rawHandlingMinutes;
  return baseline + (rawHandlingMinutes - baseline) * EXCESS_HANDLING_EFFICIENCY;
}

// Kiinteä koordinointiaika (h) — sama KAIKILLE muutoille koosta riippumatta (auton
// positiointi, perusvalmistelut, paperityöt). Asunnon koko ei enää vaikuta tähän
// mitenkään — kaikki kokoero tulee tavaralistasta (käsittely + kerros/hissi/kantomatka)
// ja matkasta. Tämä toteuttaa puhtaasti alkuperäisen periaatteen: asunnon koko on
// vain tarkistusmuuttuja, ei hinnoitteluperuste.
const COORDINATION_TIME_HOURS = 0.25;

// v2.2 kalibrointikorjaus: täyden palvelun (full_service) kaksio (2h) hinnoiteltiin
// tavaralistapohjaisesti jäljelle jäävää markkinaa selvästi halvemmaksi (tyypillinen
// kalustettu kaksio ~2,75-3,75h laskurissa vs. kilpailijoiden tyypillinen 3-5h samasta
// työstä). Muita kokoluokkia EI kosketa — vain kaksio nostettiin, koska vain se oli
// alihinnoiteltu suhteessa markkinaan. Tämä on vähimmäisveloitus, ei korvaa
// tavaralistalaskentaa: iso kaksio joka jo ylittää tämän ajan hinnoitellaan normaalisti.
const FULL_SERVICE_MIN_LABOR_HOURS: Partial<Record<CalculatorData['apartmentSize'], number>> = {
  '2h': 4.5,
};

// Mukautetun (katalogin ulkopuolisen) tavaran oletuskäsittelyaika — keskikokoisen
// tavaran arvio, koska tarkkaa kokoa ei tunneta. Kanto-/tilavaikutus käyttää
// categoryFactors()-fallbackia (ei omaa kategoriaa).
const CUSTOM_ITEM_MINUTES_EACH = 5;

// Kuljetus (transport) -palvelun omat vakiot.
// v2.2: tuntihinta yhdistetty samaksi kuin Muutto-välilehden "Kuljettaja + auto"
// -paketin driverWithVehicleRate (ks. PRICING_CONSTANTS) — molemmat myyvät saman
// resurssin (1 kuljettaja + pakettiauto/kuorma-auto), joten sama työ ei saa maksaa
// kahta eri hintaa riippuen siitä kummalta välilehdeltä sen tilaa. Kilpailijavertailu
// (Avainmuutto: 87,90 €/h 1 kuljettaja, 119,20 €/h 2 kuljettajaa, alv sis.) tukee tätä tasoa.
const EXTRA_STOP_MINUTES = 15; // ylimääräisen välipysähdyksen lastaus/purku-aika
const DRIVER_COUNT_EFFICIENCY: Record<'1' | '2', number> = { '1': 1.0, '2': 0.65 };
const SECOND_DRIVER_RATE_ADDON = 30; // €/h, 2. kuljettajan lisähinta (89 + 30 = 119 €/h, ks. yllä)

function round5(value: number): number {
  return Math.round(value / 5) * 5;
}

function floorFactor(floor: number, hasElevator: boolean): number {
  return hasElevator ? 1 : 1 + floor * PRICING_CONSTANTS.floorFactorPerLevel;
}

function heavyFloorFactor(floor: number, hasElevator: boolean): number {
  return hasElevator ? 1 : 1 + floor * PRICING_CONSTANTS.heavyFloorFactorPerLevel;
}

interface CarrySideExtra {
  floorExtraMinutes: number;
  distanceExtraMinutes: number;
  totalExtraMinutes: number;
}

/**
 * Kanto-osuuden EXTRA-aika (minuuttia) tietyn pään (lähtö tai kohde) yli sen
 * baseline-tilanteen jossa on hissi ja kantomatka <10m (jolloin extra = 0,
 * koska minutesEach-käsittelyaika jo sisältää normaalin kannon).
 */
function carrySideExtra(
  normalCarryHalfMinutes: number,
  heavyCarryHalfMinutes: number,
  floor: number,
  hasElevator: boolean,
  carryDistance: CarryDistance,
): CarrySideExtra {
  const distanceFactor = PRICING_CONSTANTS.carryDistanceFactors[carryDistance];
  const normalFactor = floorFactor(floor, hasElevator);
  const heavyFactor = heavyFloorFactor(floor, hasElevator);

  const baseline = normalCarryHalfMinutes + heavyCarryHalfMinutes;
  const afterFloor = normalCarryHalfMinutes * normalFactor + heavyCarryHalfMinutes * heavyFactor;
  const final = afterFloor * distanceFactor;

  return {
    floorExtraMinutes: afterFloor - baseline,
    distanceExtraMinutes: final - afterFloor,
    totalExtraMinutes: final - baseline,
  };
}

/**
 * Calculates the moving price based on the provided data.
 */
export function calculateMovingPrice(data: CalculatorData): PriceBreakdown {
  const {
    serviceType = 'moving',
    movingPackage = 'full_service',
    distanceKm,
    apartmentSize,
    elevatorFrom,
    elevatorTo,
    floorFrom,
    floorTo,
    carryDistanceFrom,
    carryDistanceTo,
    needsPacking,
    services,
    furnitureItems = {},
    customItems = [],
    driverCount = '1',
    additionalStops = [],
    selectedWasteTypes = [],
    date,
  } = data;

  // 1. Distance Cost
  // The first 5 km are included in the move price.
  const billableDistanceKm = Math.max(0, distanceKm - PRICING_CONSTANTS.includedDistanceKm);
  const distanceCost = billableDistanceKm * PRICING_CONSTANTS.ratePerKm;
  const driveTime = (distanceKm / 40) + 0.25;

  // Muuttopäivän alennus (ei koskaan korotus) — sovelletaan kaikkiin palvelutyyppeihin/paketteihin.
  const dateDiscount = getDateDiscount(date);
  const applyDateDiscount = (normalPriceTotal: number) => {
    const dateDiscountAmount = normalPriceTotal * dateDiscount.discount;
    return { total: normalPriceTotal - dateDiscountAmount, dateDiscountAmount };
  };

  // Tavaralistan yhteenveto (käsittelyaika, kanto-osuus, tilavuus, tavaramäärä) lasketaan kerran
  // ja on käytettävissä kaikille palvelutyypeille/paketeille.
  let handlingMinutes = 0;
  let normalCarryMinutes = 0;
  let heavyCarryMinutes = 0;
  let totalVolumeM3 = 0;
  let boxItemCount = 0;
  let nonBoxItemCount = 0;
  const itemBreakdown: { id: string; label: string; qty: number; minutes: number; catalogMinutesEach: number; isCustom?: boolean }[] = [];

  for (const [id, qty] of Object.entries(furnitureItems)) {
    if (!qty || qty <= 0) continue;
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    if (!item) continue;

    const factors = categoryFactors(item.category);
    const itemMinutes = item.minutesEach * qty;
    handlingMinutes += itemMinutes;
    totalVolumeM3 += item.minutesEach * factors.volumeM3PerMin * qty;
    itemBreakdown.push({ id: item.id, label: item.label, qty, minutes: itemMinutes, catalogMinutesEach: item.minutesEach });

    const carry = item.minutesEach * factors.carryRatio * qty;
    if (HEAVY_ITEM_IDS.has(item.id)) {
      heavyCarryMinutes += carry;
    } else {
      normalCarryMinutes += carry;
    }

    if (item.category === 'Laatikot ja pakkaukset') {
      boxItemCount += qty;
    } else {
      nonBoxItemCount += qty;
    }
  }

  // Mukautetut tavarat (ei katalogissa) — vakio oletusaika per kappale, fallback-kerroin kanto/tilavaikutukseen.
  const customFactors = categoryFactors('__custom__');
  customItems.forEach((customItem, index) => {
    if (!customItem.qty || customItem.qty <= 0) return;
    const itemMinutes = CUSTOM_ITEM_MINUTES_EACH * customItem.qty;
    handlingMinutes += itemMinutes;
    totalVolumeM3 += CUSTOM_ITEM_MINUTES_EACH * customFactors.volumeM3PerMin * customItem.qty;
    itemBreakdown.push({
      id: `custom-${index}`,
      label: customItem.label,
      qty: customItem.qty,
      minutes: itemMinutes,
      catalogMinutesEach: CUSTOM_ITEM_MINUTES_EACH,
      isCustom: true,
    });
    normalCarryMinutes += CUSTOM_ITEM_MINUTES_EACH * customFactors.carryRatio * customItem.qty;
    nonBoxItemCount += customItem.qty;
  });

  const totalItemCount = boxItemCount + nonBoxItemCount;
  itemBreakdown.sort((a, b) => b.minutes - a.minutes);

  // Kuljetusliikkeen tehokkuus suurella tavaramäärällä: ylimenevä osa "tyypillisestä"
  // tavaramäärästä tälle asunnon koolle hinnoitellaan tehokkuuskertoimella (ks. yllä).
  // EI koske Kuljetusta — "asunnon koko" -käsite ei sovi yksittäisten tavaroiden kuljetukseen.
  const rawHandlingMinutes = handlingMinutes;
  let crewEfficiencyApplied = false;
  if (serviceType !== 'transport') {
    handlingMinutes = applyCrewEfficiency(rawHandlingMinutes, apartmentSize);
    crewEfficiencyApplied = handlingMinutes < rawHandlingMinutes;
    if (rawHandlingMinutes > 0) {
      const efficiencyRatio = handlingMinutes / rawHandlingMinutes;
      normalCarryMinutes *= efficiencyRatio;
      heavyCarryMinutes *= efficiencyRatio;
    }
  }

  // Kanto-osuuden extra-aika kerroksista/hississtä/kantomatkasta — käytössä Kuljetuksella JA Muutolla.
  const normalCarryHalf = normalCarryMinutes / 2;
  const heavyCarryHalf = heavyCarryMinutes / 2;

  const origin = carrySideExtra(normalCarryHalf, heavyCarryHalf, floorFrom, elevatorFrom, carryDistanceFrom);
  const dest = carrySideExtra(normalCarryHalf, heavyCarryHalf, floorTo, elevatorTo, carryDistanceTo);

  const floorsExtraMinutes = origin.floorExtraMinutes + dest.floorExtraMinutes;
  const carryDistanceExtraMinutes = origin.distanceExtraMinutes + dest.distanceExtraMinutes;
  const carryExtraMinutes = origin.totalExtraMinutes + dest.totalExtraMinutes;

  // Vaikeustaso — pelkkä UI-elementti, ei vaikuta hintaan. Käytössä Kuljetuksella JA Muutolla
  // (raskas tavara tai pitkä kantomatka voi tehdä kuljetuksestakin "vaativan").
  const noElevatorHighFloor = (!elevatorFrom && floorFrom >= 3) || (!elevatorTo && floorTo >= 3);
  const hasHeavyItems = heavyCarryMinutes > 0;
  const hasLongCarry = carryDistanceFrom === '50+' || carryDistanceTo === '50+';
  const hasShortCarryBothEnds =
    (carryDistanceFrom === '<10' || carryDistanceFrom === '10-30') &&
    (carryDistanceTo === '<10' || carryDistanceTo === '10-30');

  let difficultyLevel: PriceBreakdown['difficultyLevel'];
  if (noElevatorHighFloor || hasHeavyItems || hasLongCarry) {
    difficultyLevel = 'hard';
  } else if (elevatorFrom && elevatorTo && !hasHeavyItems && hasShortCarryBothEnds) {
    difficultyLevel = 'easy';
  } else {
    difficultyLevel = 'medium';
  }

  // For transport (kuljetus) service: tavaralistapohjainen, samalla periaatteella kuin Muutto,
  // mutta omalla miehityksellä (1-2 kuljettajaa) ja välipysähdystuella.
  if (serviceType === 'transport') {
    const additionalStopMinutes = additionalStops.length * EXTRA_STOP_MINUTES;
    const driverEfficiency = DRIVER_COUNT_EFFICIENCY[driverCount];

    const rawTransportMinutes = (handlingMinutes + carryExtraMinutes + additionalStopMinutes) * driverEfficiency;
    let totalLaborHours = rawTransportMinutes / 60 + driveTime + COORDINATION_TIME_HOURS;
    totalLaborHours = Math.ceil(totalLaborHours * 4) / 4;

    const hourlyRate = PRICING_CONSTANTS.driverWithVehicleRate + (driverCount === '2' ? SECOND_DRIVER_RATE_ADDON : 0);
    const laborCost = totalLaborHours * hourlyRate;

    let subtotal = distanceCost + laborCost;

    // Minimum Charge for transport, korkeampi 2 kuljettajalle
    const transportMinimum = driverCount === '2' ? 169 : 99; // €
    if (subtotal < transportMinimum) {
      subtotal = transportMinimum;
    }

    const normalPriceTotal = subtotal;
    const { total, dateDiscountAmount } = applyDateDiscount(normalPriceTotal);
    const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));

    // Erittely UI:lle (€) — sama rakenne kuin Muutossa
    const itemsImpact = (handlingMinutes * driverEfficiency / 60) * hourlyRate;
    const floorsImpact = (floorsExtraMinutes * driverEfficiency / 60) * hourlyRate;
    const carryDistanceImpact = (carryDistanceExtraMinutes * driverEfficiency / 60) * hourlyRate;
    const extrasImpact = (additionalStopMinutes * driverEfficiency / 60) * hourlyRate;
    const distanceImpact = distanceCost + driveTime * hourlyRate;
    // Käytetään normalPriceTotal:ia (ei raakaa laborCost:ia), jotta minimihintakorotus
    // (jos se laukesi) sisältyy "base"-erään ja erittely täsmää aina näytettyyn hintaan.
    const baseImpact = (normalPriceTotal - distanceCost) - itemsImpact - floorsImpact - carryDistanceImpact - extrasImpact - driveTime * hourlyRate;

    return {
      distanceCost,
      laborCost,
      extrasCost: 0,
      disposalCost: 0,
      subtotal: total - vat,
      vat,
      total,
      normalPriceTotal,
      dateDiscountFraction: dateDiscount.discount,
      dateDiscountAmount,
      dateDiscountLabel: dateDiscount.label,
      dateDiscountEmoji: dateDiscount.emoji,
      priceRangeLow: round5(total * (1 - PRICING_CONSTANTS.priceRangeNormal)),
      priceRangeHigh: round5(total * (1 + PRICING_CONSTANTS.priceRangeNormal)),
      difficultyLevel,
      estimatedDurationHours: totalLaborHours,
      details: {
        distanceKm: billableDistanceKm,
        laborHours: totalLaborHours,
        laborRate: hourlyRate,
        crewSize: driverCount === '2' ? 2 : 1,
        totalVolumeM3,
        totalItemCount,
        rawHandlingMinutes,
        crewEfficiencyApplied,
        itemBreakdown,
        timeBreakdown: {
          handlingMinutes: handlingMinutes * driverEfficiency,
          carryExtraMinutes: carryExtraMinutes * driverEfficiency,
          assemblyMinutes: 0,
          packingMinutes: additionalStopMinutes * driverEfficiency,
          driveTimeHours: driveTime,
          baseTimeHours: COORDINATION_TIME_HOURS,
        },
        impactBreakdown: {
          items: itemsImpact,
          floors: floorsImpact,
          carryDistance: carryDistanceImpact,
          distance: distanceImpact,
          extras: extrasImpact,
          base: baseImpact,
        },
      },
    };
  }

  // RECYCLING SERVICE (kierrätys) — sama työvoimalogiikka kuin Muutossa, lisäksi kierrätysmaksut.
  if (serviceType === 'recycling') {
    const disposalCost = selectedWasteTypes.reduce((sum, typeId) => {
      const wt = RECYCLING_WASTE_TYPES.find((w) => w.id === typeId);
      return sum + (wt?.disposalCostPerLoad ?? 0);
    }, 0);

    const rawMinutesR = handlingMinutes + carryExtraMinutes;
    let totalLaborHoursR = rawMinutesR / 60 + driveTime + COORDINATION_TIME_HOURS;
    totalLaborHoursR = Math.ceil(totalLaborHoursR * 4) / 4;

    const hourlyRateR = PRICING_CONSTANTS.hourlyRateDefault;
    const laborCostR = totalLaborHoursR * hourlyRateR;

    const subtotalR = distanceCost + laborCostR + disposalCost;
    const normalPriceTotalR = subtotalR;
    const { total: totalR, dateDiscountAmount: dateDiscountAmountR } = applyDateDiscount(normalPriceTotalR);
    const vatR = totalR - (totalR / (1 + PRICING_CONSTANTS.vatRate));

    const itemsImpactR = (handlingMinutes / 60) * hourlyRateR;
    const floorsImpactR = (floorsExtraMinutes / 60) * hourlyRateR;
    const carryDistanceImpactR = (carryDistanceExtraMinutes / 60) * hourlyRateR;
    const distanceImpactR = distanceCost + driveTime * hourlyRateR;
    const baseImpactR = laborCostR - itemsImpactR - floorsImpactR - carryDistanceImpactR - driveTime * hourlyRateR;

    return {
      distanceCost,
      laborCost: laborCostR,
      extrasCost: disposalCost,
      disposalCost,
      subtotal: totalR - vatR,
      vat: vatR,
      total: totalR,
      normalPriceTotal: normalPriceTotalR,
      dateDiscountFraction: dateDiscount.discount,
      dateDiscountAmount: dateDiscountAmountR,
      dateDiscountLabel: dateDiscount.label,
      dateDiscountEmoji: dateDiscount.emoji,
      priceRangeLow: round5(totalR * (1 - PRICING_CONSTANTS.priceRangeNormal)),
      priceRangeHigh: round5(totalR * (1 + PRICING_CONSTANTS.priceRangeNormal)),
      difficultyLevel,
      estimatedDurationHours: totalLaborHoursR,
      details: {
        distanceKm: billableDistanceKm,
        laborHours: totalLaborHoursR,
        laborRate: hourlyRateR,
        crewSize: 2,
        totalVolumeM3,
        totalItemCount,
        rawHandlingMinutes,
        crewEfficiencyApplied,
        itemBreakdown,
        timeBreakdown: {
          handlingMinutes,
          carryExtraMinutes,
          assemblyMinutes: 0,
          packingMinutes: 0,
          driveTimeHours: driveTime,
          baseTimeHours: COORDINATION_TIME_HOURS,
        },
        impactBreakdown: {
          items: itemsImpactR,
          floors: floorsImpactR,
          carryDistance: carryDistanceImpactR,
          distance: distanceImpactR,
          extras: disposalCost,
          base: baseImpactR,
        },
      },
    };
  }

  // MOVING SERVICE (muutto) - tavaralistapohjainen laskenta (v2)

  // Purku- ja kasauspalvelu (olemassa oleva "Purkupalvelu"-toggle, nyt kytketty hintaan)
  const assemblyMinutes = services.includes('Purkupalvelu') ? handlingMinutes * PRICING_CONSTANTS.assemblyRatio : 0;

  // Pakkauspalvelu: skaalataan tavaramäärästä, ei asunnon koosta
  const packingMinutes = needsPacking
    ? boxItemCount * PRICING_CONSTANTS.packingMinutesPerBox + nonBoxItemCount * PRICING_CONSTANTS.packingMinutesPerOtherItem
    : 0;

  // Koordinointiaika — kiinteä kaikille, ei riipu asunnon koosta (ks. yllä).
  const adminTime = COORDINATION_TIME_HOURS;

  const rawMinutes = handlingMinutes + carryExtraMinutes + assemblyMinutes + packingMinutes;
  let totalLaborHours = rawMinutes / 60 + driveTime + adminTime;

  // Round up to nearest 15 minutes (finer billing granularity than the old 30-minute steps,
  // so a single item more doesn't jump the price by a full half-hour of labor).
  totalLaborHours = Math.ceil(totalLaborHours * 4) / 4;

  if (movingPackage === 'driver_with_vehicle') {
    // v2.2: käyttää samaa tavaralistapohjaista totalLaborHours-arviota kuin muut paketit
    // (aiemmin oma kiinteä lightMoveHoursBySize-taulukko sivuutti tavaralistan kokonaan —
    // sama bugi joka aiheutti Kuljetus-välilehden kanssa ristiriitaisen hinnan samasta työstä).
    const hourlyRate = PRICING_CONSTANTS.driverWithVehicleRate;
    const laborCost = totalLaborHours * hourlyRate;
    let subtotal = distanceCost + laborCost;

    if (subtotal < PRICING_CONSTANTS.driverWithVehicleMinimum) {
      subtotal = PRICING_CONSTANTS.driverWithVehicleMinimum;
    }

    const normalPriceTotal = subtotal;
    const { total, dateDiscountAmount } = applyDateDiscount(normalPriceTotal);
    const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));

    // Erittely samalla kaavalla kuin täysi palvelu (ks. alempana), mutta normalPriceTotal:ia
    // vasten (ei raakaa laborCost:ia) — jos minimihintakorotus laukesi, se sisältyy
    // "base"-erään, jotta erittely täsmää aina näytettyyn hintaan (sama tekniikka kuin Kuljetuksessa).
    const itemsImpact = (handlingMinutes / 60) * hourlyRate;
    const floorsImpact = (floorsExtraMinutes / 60) * hourlyRate;
    const carryDistanceImpact = (carryDistanceExtraMinutes / 60) * hourlyRate;
    const extrasImpact = ((assemblyMinutes + packingMinutes) / 60) * hourlyRate;
    const distanceImpact = distanceCost + driveTime * hourlyRate;
    const baseImpact = (normalPriceTotal - distanceCost) - itemsImpact - floorsImpact - carryDistanceImpact - extrasImpact - driveTime * hourlyRate;

    return {
      distanceCost,
      laborCost,
      extrasCost: 0,
      disposalCost: 0,
      subtotal: total - vat,
      vat,
      total,
      normalPriceTotal,
      dateDiscountFraction: dateDiscount.discount,
      dateDiscountAmount,
      dateDiscountLabel: dateDiscount.label,
      dateDiscountEmoji: dateDiscount.emoji,
      priceRangeLow: round5(total * (1 - PRICING_CONSTANTS.priceRangeNormal)),
      priceRangeHigh: round5(total * (1 + PRICING_CONSTANTS.priceRangeNormal)),
      difficultyLevel,
      estimatedDurationHours: totalLaborHours,
      details: {
        distanceKm: billableDistanceKm,
        laborHours: totalLaborHours,
        laborRate: hourlyRate,
        crewSize: 1,
        totalVolumeM3,
        totalItemCount,
        rawHandlingMinutes,
        crewEfficiencyApplied,
        itemBreakdown,
        timeBreakdown: {
          handlingMinutes,
          carryExtraMinutes,
          assemblyMinutes,
          packingMinutes,
          driveTimeHours: driveTime,
          baseTimeHours: adminTime,
        },
        impactBreakdown: {
          items: itemsImpact,
          floors: floorsImpact,
          carryDistance: carryDistanceImpact,
          distance: distanceImpact,
          extras: extrasImpact,
          base: baseImpact,
        },
      },
    };
  }

  if (movingPackage === 'carrying_help') {
    const hourlyRate = PRICING_CONSTANTS.carryingHelpRate;
    const laborCost = totalLaborHours * hourlyRate;
    let subtotal = laborCost;

    if (subtotal < PRICING_CONSTANTS.carryingHelpMinimum) {
      subtotal = PRICING_CONSTANTS.carryingHelpMinimum;
    }

    const normalPriceTotal = subtotal;
    const { total, dateDiscountAmount } = applyDateDiscount(normalPriceTotal);
    const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));

    return {
      distanceCost: 0,
      laborCost,
      extrasCost: 0,
      disposalCost: 0,
      subtotal: total - vat,
      vat,
      total,
      normalPriceTotal,
      dateDiscountFraction: dateDiscount.discount,
      dateDiscountAmount,
      dateDiscountLabel: dateDiscount.label,
      dateDiscountEmoji: dateDiscount.emoji,
      priceRangeLow: round5(total * (1 - PRICING_CONSTANTS.priceRangeNormal)),
      priceRangeHigh: round5(total * (1 + PRICING_CONSTANTS.priceRangeNormal)),
      difficultyLevel: 'medium',
      estimatedDurationHours: totalLaborHours,
      details: {
        distanceKm: 0,
        laborHours: totalLaborHours,
        laborRate: hourlyRate,
        crewSize: 2,
        totalVolumeM3,
        totalItemCount,
        rawHandlingMinutes,
        crewEfficiencyApplied,
        itemBreakdown,
        timeBreakdown: {
          handlingMinutes,
          carryExtraMinutes,
          assemblyMinutes,
          packingMinutes,
          driveTimeHours: driveTime,
          baseTimeHours: adminTime,
        },
        impactBreakdown: { items: laborCost, floors: 0, carryDistance: 0, distance: 0, extras: 0, base: 0 },
      },
    };
  }

  // Determine Hourly Rate
  let hourlyRate = PRICING_CONSTANTS.hourlyRateDefault;
  // Increase rate for complex moves (high floors no elevator, or large moves)
  if ((!elevatorFrom && floorFrom > 2) || (!elevatorTo && floorTo > 2) || apartmentSize === '4h+') {
    hourlyRate = PRICING_CONSTANTS.hourlyRateComplex;
  }

  // Kalibrointikorjaus: vain full_service, vain kokoluokat joilla on FULL_SERVICE_MIN_LABOR_HOURS-arvo
  // (ks. määrittely yllä) — ei vaikuta driver_with_vehicle/carrying_help-paketteihin, jotka
  // palasivat jo omalla logiikallaan ennen tätä kohtaa.
  const minLaborHours = FULL_SERVICE_MIN_LABOR_HOURS[apartmentSize];
  if (minLaborHours) {
    totalLaborHours = Math.max(totalLaborHours, minLaborHours);
  }

  const laborCost = totalLaborHours * hourlyRate;

  // 3. Extras (reserved for future separately-priced add-ons; currently folded into labor)
  const extrasCost = 0;

  // 4. Totals — ei minimihintaa tavaralistapohjaisessa hinnoittelussa (v2-speksi)
  const subtotal = distanceCost + laborCost + extrasCost;
  const normalPriceTotal = subtotal;
  const { total, dateDiscountAmount } = applyDateDiscount(normalPriceTotal);
  const vat = total - (total / (1 + PRICING_CONSTANTS.vatRate));

  // 5. Laadunvarmistus: vertaa tavaramäärän tilavuutta asunnon kokoon (ei muuta hintaa)
  const [expectedMinVolume] = EXPECTED_VOLUME_M3[apartmentSize];
  const inventoryWarning = totalVolumeM3 < expectedMinVolume * 0.4 ? INVENTORY_WARNING_MESSAGE : undefined;

  // 6. Hintahaarukka — leveys riippuu automaattisesta laadunvarmistuksesta, ei käyttäjän syötteestä
  const rangeWidth = inventoryWarning ? PRICING_CONSTANTS.priceRangeWarning : PRICING_CONSTANTS.priceRangeNormal;
  const priceRangeLow = round5(total * (1 - rangeWidth));
  const priceRangeHigh = round5(total * (1 + rangeWidth));

  // 7. Vaikeustaso lasketaan jaetussa lohkossa ennen Kuljetus-haaraa (ks. yllä).

  // 8. Erittely UI:lle (€)
  const itemsImpact = (handlingMinutes / 60) * hourlyRate;
  const floorsImpact = (floorsExtraMinutes / 60) * hourlyRate;
  const carryDistanceImpact = (carryDistanceExtraMinutes / 60) * hourlyRate;
  const extrasImpact = ((assemblyMinutes + packingMinutes) / 60) * hourlyRate;
  const distanceImpact = distanceCost + driveTime * hourlyRate;
  // "Base" saa loput (perusaika + 15 min -pyöristyksen erotus), jotta erittely summautuu
  // AINA tarkalleen samaksi kuin näytetty hinta — ei pelkkää adminTime*hourlyRate-arviota.
  const baseImpact = laborCost - itemsImpact - floorsImpact - carryDistanceImpact - extrasImpact - driveTime * hourlyRate;

  return {
    distanceCost,
    laborCost,
    extrasCost,
    disposalCost: 0,
    subtotal: total - vat,
    vat,
    total,
    normalPriceTotal,
    dateDiscountFraction: dateDiscount.discount,
    dateDiscountAmount,
    dateDiscountLabel: dateDiscount.label,
    dateDiscountEmoji: dateDiscount.emoji,
    priceRangeLow,
    priceRangeHigh,
    inventoryWarning,
    difficultyLevel,
    estimatedDurationHours: totalLaborHours,
    details: {
      distanceKm: billableDistanceKm,
      laborHours: totalLaborHours,
      laborRate: hourlyRate,
      crewSize: 3, // Van + 2 movers
      totalVolumeM3,
      totalItemCount,
      rawHandlingMinutes,
      crewEfficiencyApplied,
      itemBreakdown,
      timeBreakdown: {
        handlingMinutes,
        carryExtraMinutes,
        assemblyMinutes,
        packingMinutes,
        driveTimeHours: driveTime,
        baseTimeHours: adminTime,
      },
      impactBreakdown: {
        items: itemsImpact,
        floors: floorsImpact,
        carryDistance: carryDistanceImpact,
        distance: distanceImpact,
        extras: extrasImpact,
        base: baseImpact,
      },
    },
  };
}
