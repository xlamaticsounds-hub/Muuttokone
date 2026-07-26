// English labels for the Muuttolaskuri furniture/category/waste-type catalog defined in
// src/features/calculator/pricing.ts. Kept separate from pricing.ts on purpose — pricing.ts
// is also used server-side (send-quote.ts, lead-format.ts) where locale doesn't apply, so the
// underlying Finnish ids/labels there stay the source of truth; this is a display-only overlay
// keyed by the same catalog ids, applied in Calculator.tsx when locale === 'en'.

export const CATEGORY_LABELS_EN: Record<string, string> = {
  'Olohuone': 'Living room',
  'Makuuhuone': 'Bedroom',
  'Laatikot ja pakkaukset': 'Boxes & packing',
  'Keittiö': 'Kitchen',
  'Kodinkoneet': 'Appliances',
  'Toimisto': 'Office',
  'Lasten tavarat': "Children's items",
  'Erikoistavarat': 'Special items',
  'Ulkokalusteet ja varasto': 'Outdoor & storage',
  'Raskaat tavarat': 'Heavy items',
};

export const FURNITURE_LABELS_EN: Record<string, string> = {
  // Olohuone / Living room
  plant_small: 'Small houseplant',
  plant_large: 'Large houseplant',
  bookshelf: 'Bookshelf',
  shoe_cabinet: 'Shoe cabinet',
  shoe_rack: 'Shoe rack',
  sofa_2: '2-seat sofa',
  sofa_3: '3-seat sofa',
  sofa_4: '4-seat sofa',
  sofa_divan: 'Divan sofa',
  corner_sofa_small: 'Corner sofa (small)',
  corner_sofa_large: 'Corner sofa (large)',
  armchair: 'Armchair',
  ottoman_small: 'Ottoman / stool',
  ottoman_large: 'Ottoman / stool (large)',
  tv_stand_small: 'TV stand (small)',
  tv_stand_large: 'TV stand (large)',
  display_cabinet: 'Display cabinet',
  entrance_bench: 'Entryway bench',
  side_table: 'Side table',
  wall_cabinet: 'Wall cabinet',
  floor_lamp: 'Floor lamp',
  coffee_table: 'Coffee table',
  tv_small: 'TV (32–43")',
  tv_55: 'TV 55"',
  tv_65: 'TV 65"',
  tv_75: 'TV 75"',
  tv_85plus: 'TV 85"+',
  painting_large: 'Painting (large)',
  speaker: 'Speaker',

  // Makuuhuone / Bedroom
  wardrobe_assembled: 'Wardrobe (assembled)',
  wardrobe_disassembled: 'Wardrobe (disassembled)',
  mirror_full: 'Mirror (full-length)',
  nightstand: 'Nightstand',
  dresser_small: 'Dresser (small)',
  dresser_large: 'Dresser (large)',
  bean_bag: 'Bean bag chair',
  bed_headboard: 'Headboard',
  bed_80: 'Bed 80 cm',
  bed_120: 'Bed 120 cm',
  bed_140: 'Bed 140 cm',
  bed_160: 'Bed 160 cm',
  bed_180: 'Bed 180 cm',
  mattress_80: 'Mattress 80–90 cm',
  mattress_120: 'Mattress 120–160 cm',
  mattress_180: 'Mattress 180 cm',
  desk_bedroom: 'Desk',

  // Laatikot ja pakkaukset / Boxes & packing
  box_standard: 'Moving box (standard)',
  box_clothes: 'Clothes box',
  storage_box_small: 'Storage box (small)',
  storage_box_medium: 'Storage box (medium)',
  storage_box_large: 'Storage box (large)',
  suitcase: 'Suitcase',
  plastic_bag: 'Plastic bag',
  chest: 'Chest',

  // Keittiö / Kitchen
  kitchen_cabinet: 'Kitchen cabinet',
  microwave: 'Microwave',
  glass_table: 'Glass table',
  coffee_maker: 'Coffee maker',
  sink: 'Sideboard',
  dining_table_small: 'Dining table (small)',
  dining_table_large: 'Dining table (large)',
  dining_table_extendable: 'Extendable dining table',
  bar_stool: 'Bar stool',
  kitchen_chair: 'Chair',
  table_top: 'Table top',

  // Kodinkoneet / Appliances
  washing_machine: 'Washing machine',
  dryer: 'Dryer',
  washer_dryer_tower: 'Washer-dryer tower',
  dishwasher: 'Dishwasher',
  stove: 'Stove',
  oven: 'Oven',
  fridge: 'Fridge',
  freezer: 'Freezer',
  fridge_freezer: 'Fridge-freezer',
  fridge_us: 'American-style fridge-freezer',
  wine_cooler: 'Wine cooler',
  laundry_basket: 'Laundry basket',
  laundry_rack: 'Drying rack',

  // Toimisto / Office
  electric_desk: 'Standing desk',
  work_desk: 'Desk',
  office_chair: 'Office chair',
  printer: 'Printer',
  monitor: 'Monitor',
  filing_cabinet_small: 'Filing cabinet (small)',
  filing_cabinet_large: 'Filing cabinet (large)',

  // Lasten tavarat / Children's items
  crib: "Child's bed",
  bunk_bed: 'Crib',
  high_chair: 'High chair',
  stroller: 'Stroller',
  toy_box: 'Toy box',
  small_bath: 'Small bathtub',

  // Erikoistavarat / Special items
  speaker_large: 'Speaker (large)',
  rug_rolled: 'Rug (rolled)',
  aquarium_empty: 'Aquarium (empty)',
  coat_rack: 'Coat rack',
  curtains_packed: 'Curtains (packed)',
  flower_pot: 'Flower pot',
  dog_cage: 'Dog crate',
  cat_tree: 'Cat tree',

  // Ulkokalusteet ja varasto / Outdoor & storage
  grill: 'Grill',
  garden_chair: 'Garden chair',
  garden_table: 'Garden table',
  bicycle: 'Bicycle',
  scooter: 'Kick scooter',
  tire_set: 'Set of tires',
  lawn_mower: 'Lawn mower',
  snow_shovel: 'Snow shovel',
  treadmill: 'Treadmill',
  fitness_equipment: 'Fitness equipment',
  workbench: 'Workbench',
  metal_shelf: 'Metal shelf',

  // Raskaat tavarat / Heavy items
  safe_large: 'Safe (large)',
  piano_large: 'Piano',
  grand_piano: 'Grand piano',
};

export const WASTE_TYPE_LABELS_EN: Record<string, { label: string; description: string }> = {
  suurjate: { label: 'Bulky waste', description: 'Furniture, rugs, mattresses' },
  puujate: { label: 'Wood waste', description: 'Wood, boards, wooden furniture' },
  sekajate: { label: 'Mixed waste', description: 'Mixed waste, not sortable' },
  metallit: { label: 'Metal', description: 'Scrap metal, metal appliances' },
  elektroniikka: { label: 'Electronics (WEEE)', description: 'TVs, home electronics — WEEE take-back' },
  rakennusjate: { label: 'Construction waste', description: 'Renovation waste, brick, drywall, concrete' },
};
