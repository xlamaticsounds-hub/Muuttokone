import { FURNITURE_CATALOG, RECYCLING_WASTE_TYPES, CalculatorSchema, calculateMovingPrice } from '@/features/calculator/pricing';
import { BOX_RENTAL, calculateBoxRental, describeBoxRental } from '@/features/calculator/boxRental';
import { computePartnerDiscount, discountLabel, type PartnerDiscount } from '@/features/calculator/discount';

// Shared between the hallinta lead detail page and the quote email sender — both need to
// turn a lead's raw formData JSON (calculator ids like "sofa_3": 2) into human-readable text.

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  moving: 'Muutto',
  transport: 'Kuljetus',
  recycling: 'Kierrätys',
  yritysmuutto: 'Yritysmuutto',
  tyoapu: 'Työapu',
  vuokraus: 'Vuokraus',
};

export const PACKAGE_LABELS: Record<string, string> = {
  full_service: 'Täyspalvelu',
  driver_with_vehicle: 'Vain kuljettaja ajoneuvolla',
  carrying_help: 'Vain kantoapu',
};

export type InventoryEntry = { icon: string; label: string; qty: number };

export function getInventoryEntries(data: unknown): InventoryEntry[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const entries: InventoryEntry[] = [];

  const furnitureItems = record.furnitureItems;
  if (furnitureItems && typeof furnitureItems === 'object') {
    for (const [id, qty] of Object.entries(furnitureItems as Record<string, unknown>)) {
      const n = Number(qty);
      if (!n || n <= 0) continue;
      const item = FURNITURE_CATALOG.find((f) => f.id === id);
      entries.push(item ? { icon: item.icon, label: item.label, qty: n } : { icon: '📦', label: id, qty: n });
    }
  }

  if (Array.isArray(record.customItems)) {
    for (const custom of record.customItems as Array<{ label?: string; qty?: number }>) {
      const n = Number(custom?.qty);
      if (custom?.label && n > 0) entries.push({ icon: '➕', label: `${custom.label} (ei katalogissa)`, qty: n });
    }
  }

  return entries;
}

export function getWasteTypeLabels(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.selectedWasteTypes)) return [];
  return record.selectedWasteTypes
    .map((id) => RECYCLING_WASTE_TYPES.find((w) => w.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getPhotoUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.photos)) return [];
  return record.photos.filter((url): url is string => typeof url === 'string' && url.length > 0);
}

export function getExtraServices(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const extras: string[] = [];
  if (Array.isArray(record.services) && record.services.includes('Purkupalvelu')) {
    extras.push('Purkupalvelu (huonekalujen purku ja kasaus)');
  }
  if (record.needsPacking) extras.push('Pakkauspalvelu (pakkaamme tavarat)');
  if (record.needsCleaning) extras.push('Muuttosiivous');
  if (record.needsBoxRental === true && (record.serviceType === undefined || record.serviceType === 'moving')) {
    const rental = describeBoxRental(
      calculateBoxRental({
        count: Number(record.boxRentalCount),
        days: Number(record.boxRentalDays) || BOX_RENTAL.defaultDays,
        withMove: true,
      }),
    );
    if (rental) extras.push(rental);
  }
  if (Array.isArray(record.additionalStops) && record.additionalStops.length > 0) {
    if (record.serviceType === 'moving') {
      // Muutossa lisäosoitteet ovat lisäkohteita (useampi kohdeosoite) — näytetään osoitteet myös
      const stops = record.additionalStops.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
      if (stops.length > 0) extras.push(`Lisäkohteet (${stops.length}): ${stops.map((s) => s.trim()).join('; ')}`);
    } else {
      extras.push(`${record.additionalStops.length} välipysähdystä`);
    }
  }
  return extras;
}

export function parseLeadFormData(formData: unknown): Record<string, unknown> {
  if (!formData) return {};
  try {
    const parsed = typeof formData === 'string' ? JSON.parse(formData) : formData;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getServiceLabel(pfd: Record<string, unknown>): string | null {
  // Laskurin liideillä tyyppi on juuritasolla (serviceType), /api/submit-lomakkeiden
  // (yrityssivu, työapu) liideillä payload.service_type:ssa.
  const payload = pfd.payload && typeof pfd.payload === 'object' ? (pfd.payload as Record<string, unknown>) : null;
  const raw = typeof pfd.serviceType === 'string' ? pfd.serviceType : payload?.service_type;
  return typeof raw === 'string' ? SERVICE_TYPE_LABELS[raw] ?? raw : null;
}

export function getPackageLabel(pfd: Record<string, unknown>): string | null {
  return typeof pfd.movingPackage === 'string' ? PACKAGE_LABELS[pfd.movingPackage] ?? pfd.movingPackage : null;
}

export type RecomputedLeadPrice = {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  // Vain kun liidillä on voimassa ollut kumppanikoodi: price ja haarukka ovat jo alennettuja.
  discount: PartnerDiscount | null;
};

// Laskee liidin hinta-arvion uudelleen formData:n pohjalta — käytetään sekä laskurin varausta
// tallennettaessa (selaimen lähettämään hintaan ei luoteta) että kun hallinnassa muokataan
// hintaan vaikuttavia kenttiä jälkikäteen. Palauttaa null jos formData ei sisällä tarpeeksi
// laskuripohjaisia kenttiä (esim. yhteydenottolomakkeelta tullut liidi ei ole koskaan käynyt
// muuttolaskurin kautta) — silloin olemassa oleva hinta jätetään koskematta.
// discountPercent = liidille tallennettu kumppanialennus (Lead.discountPercent), jottei
// alennus katoa kun liidiä muokataan.
export function recomputeLeadPrice(
  pfd: Record<string, unknown>,
  discountPercent: number | null = null,
): RecomputedLeadPrice | null {
  try {
    // Yhteystiedot eivät vaikuta hintaan, mutta esim. tyhjä contactEmail kaataisi skeeman
    // email-tarkistuksen; null-arvot (JSON) eivät kelpaa skeeman optional-kenttiin.
    const { contactName, contactEmail, contactPhone, ...priceFields } = pfd;
    const input: Record<string, unknown> = Object.fromEntries(
      Object.entries(priceFields).filter(([, value]) => value !== null),
    );
    const date = typeof pfd.date === 'string' || pfd.date instanceof Date ? new Date(pfd.date as string) : undefined;
    input.date = date && !Number.isNaN(date.getTime()) ? date : undefined;

    const result = calculateMovingPrice(CalculatorSchema.parse(input));
    if (!discountPercent || discountPercent <= 0) {
      return { price: result.total, priceRangeLow: result.priceRangeLow, priceRangeHigh: result.priceRangeHigh, discount: null };
    }
    const discount = computePartnerDiscount(result, discountPercent);
    return {
      price: discount.priceAfterDiscount,
      priceRangeLow: result.priceRangeLow - discount.discountAmount,
      priceRangeHigh: result.priceRangeHigh - discount.discountAmount,
      discount,
    };
  } catch {
    return null;
  }
}

export function getStoredPrice(pfd: Record<string, unknown>): {
  confirmed: string | null;
  exact: number | null;
  low: number | null;
  high: number | null;
} {
  return {
    // Ihmisen hallintapaneelissa vahvistama kiinteä hinta — jos asetettu, tämä korvaa
    // laskurin nettisivulla näyttämän arvion lopullisessa, sähköpostitse lähetettävässä tarjouksessa.
    // Merkkijono (ei numero) koska tämä voi olla myös haarukka, esim. "99–129" — vanhat liidit
    // joilla arvo on vielä tallennettu numerona (ennen tätä muutosta) tuetaan silti.
    confirmed:
      typeof pfd.confirmedPrice === 'string'
        ? pfd.confirmedPrice
        : typeof pfd.confirmedPrice === 'number'
          ? String(pfd.confirmedPrice)
          : null,
    exact: typeof pfd.price === 'number' ? pfd.price : null,
    low: typeof pfd.priceRangeLow === 'number' ? pfd.priceRangeLow : null,
    high: typeof pfd.priceRangeHigh === 'number' ? pfd.priceRangeHigh : null,
  };
}

/** "1 124,50 €" / "1124.5" / 648 -> 1124.5 (senteiksi pyöristettynä). null jos ei kelpaa. */
export function parseEuroAmount(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) / 100 : null;
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[\s €]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100) / 100;
}

/**
 * "Merkitse toteutuneeksi" -lomakkeen oletushinta: ihmisen vahvistama kiinteä hinta, muuten
 * kumppanialennuksen jälkeinen hinta, muuten laskurin arvio. Jo toteutuneella liidillä sen
 * tallennettu lopullinen hinta. Haarukkaa (esim. "99–129") ei voi käyttää oletuksena.
 */
export function defaultFinalPrice(lead: {
  status: string;
  finalPrice: number | null;
  priceAfterDiscount: number | null;
  formData: unknown;
}): number | null {
  // Kumotun toteutumisen vanha hinta ei ohita myöhemmin vahvistettua hintaa.
  if (lead.status === 'COMPLETED' && lead.finalPrice != null) return lead.finalPrice;
  const { confirmed, exact } = getStoredPrice(parseLeadFormData(lead.formData));
  const confirmedAmount = confirmed !== null ? parseEuroAmount(confirmed) : null;
  if (confirmedAmount !== null && confirmedAmount > 0) return confirmedAmount;
  if (lead.priceAfterDiscount != null) return lead.priceAfterDiscount;
  return exact !== null ? Math.round(exact) : null;
}

/**
 * Tarjous- ja vahvistussähköpostin huomautus kumppanikoodilla tulleelle liidille, esim.
 * "Hinnassa on huomioitu Kiinteistömaailma-etu -10 % (-72 €)." Summa näytetään vain laskurin
 * arviolle — ihmisen vahvistamaan hintaan etu on jo laskettu, eikä summaa tiedetä.
 */
export function partnerDiscountNote(
  lead: { discountCode: string | null; discountPercent: number | null; discountAmount: number | null },
  partner: string | null,
  withAmount: boolean,
): string | null {
  // discountAmount puuttuu jos palvelin ei saanut laskettua hintaa varauksessa — silloin
  // tallennettu hinta on alentamaton, eikä asiakkaalle saa väittää edun olevan mukana.
  if (!lead.discountCode || !lead.discountPercent || lead.discountAmount == null) return null;
  const label = discountLabel(partner || 'Kumppani', lead.discountPercent);
  const amount = withAmount && lead.discountAmount ? ` (-${lead.discountAmount} €)` : '';
  return `Hinnassa on huomioitu ${label}${amount}.`;
}
