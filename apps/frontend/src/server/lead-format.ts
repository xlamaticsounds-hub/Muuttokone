import { FURNITURE_CATALOG, RECYCLING_WASTE_TYPES } from '@/features/calculator/pricing';

// Shared between the hallinta lead detail page and the quote email sender — both need to
// turn a lead's raw formData JSON (calculator ids like "sofa_3": 2) into human-readable text.

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  moving: 'Muutto',
  transport: 'Kuljetus',
  recycling: 'Kierrätys',
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

export function getExtraServices(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const extras: string[] = [];
  if (Array.isArray(record.services) && record.services.includes('Purkupalvelu')) {
    extras.push('Purkupalvelu (huonekalujen purku ja kasaus)');
  }
  if (record.needsPacking) extras.push('Pakkauspalvelu (pakkaamme tavarat)');
  if (record.needsCleaning) extras.push('Muuttosiivous');
  if (Array.isArray(record.additionalStops) && record.additionalStops.length > 0) {
    extras.push(`${record.additionalStops.length} välipysähdystä`);
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
  return typeof pfd.serviceType === 'string' ? SERVICE_TYPE_LABELS[pfd.serviceType] ?? pfd.serviceType : null;
}

export function getPackageLabel(pfd: Record<string, unknown>): string | null {
  return typeof pfd.movingPackage === 'string' ? PACKAGE_LABELS[pfd.movingPackage] ?? pfd.movingPackage : null;
}

export function getStoredPrice(pfd: Record<string, unknown>): { exact: number | null; low: number | null; high: number | null } {
  return {
    exact: typeof pfd.price === 'number' ? pfd.price : null,
    low: typeof pfd.priceRangeLow === 'number' ? pfd.priceRangeLow : null,
    high: typeof pfd.priceRangeHigh === 'number' ? pfd.priceRangeHigh : null,
  };
}
