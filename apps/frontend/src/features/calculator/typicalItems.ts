// Tyypillinen tavaramäärä asunnon koon mukaan. Sama lista on laskurin pikavalinnoissa ja
// kaupunkisivujen hintaesimerkeissä, jotta sivuilla näkyvät hinnat vastaavat laskurin tulosta.
export const TYPICAL_ITEMS = {
  '1h': { sofa_2: 1, bed_140: 1, wardrobe_assembled: 1, coffee_table: 1, bookshelf: 1, nightstand: 1, dresser_small: 1, box_standard: 10 },
  '2h': {
    sofa_3: 1,
    bed_140: 1,
    bed_80: 1,
    wardrobe_assembled: 2,
    coffee_table: 1,
    bookshelf: 2,
    nightstand: 2,
    dresser_small: 1,
    dining_table_small: 1,
    kitchen_chair: 4,
    box_standard: 20,
  },
  '3h': {
    sofa_3: 1,
    sofa_2: 1,
    bed_140: 1,
    bed_80: 2,
    wardrobe_assembled: 3,
    coffee_table: 1,
    bookshelf: 3,
    nightstand: 2,
    dresser_large: 1,
    dining_table_large: 1,
    kitchen_chair: 6,
    box_standard: 35,
  },
} as const satisfies Record<'1h' | '2h' | '3h', Record<string, number>>;
