import { prisma } from '@/server/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, User, Phone, Mail, FileText, Globe, Package } from 'lucide-react';
import { LeadStatus } from '@prisma/client';
import { FURNITURE_CATALOG, RECYCLING_WASTE_TYPES } from '@/features/calculator/pricing';
import StatusSelector from './StatusSelector';
import LeadDetailActions from './LeadDetailActions';

export const dynamic = 'force-dynamic';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  moving: 'Muutto',
  transport: 'Kuljetus',
  recycling: 'Kierrätys',
};

const PACKAGE_LABELS: Record<string, string> = {
  full_service: 'Täyspalvelu',
  driver_with_vehicle: 'Vain kuljettaja ajoneuvolla',
  carrying_help: 'Vain kantoapu',
};

type InventoryEntry = { icon: string; label: string; qty: number };

// Laskurin lomake tallentaa tavaralistan formData-JSONiin id:einä (esim. "sofa_3": 2), ei
// ihmisluettavina nimin — täällä käännetään ne samasta katalogista jota Muuttolaskuri käyttää,
// jotta hallintapaneeli näyttää täsmälleen sen mitä asiakas ilmoitti eikä pelkkiä id-koodeja.
function getInventoryEntries(data: unknown): InventoryEntry[] {
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

function getWasteTypeLabels(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.selectedWasteTypes)) return [];
  return record.selectedWasteTypes
    .map((id) => RECYCLING_WASTE_TYPES.find((w) => w.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}

function getExtraServices(data: unknown): string[] {
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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      contact: true,
    },
  });

  if (!lead) {
    notFound();
  }

  // formData is stored as a JSON-stringified string by some submit paths (calculator,
  // /api/submit) but as a raw object by others (submitContact/submitQuickQuote/submitQuote
  // in server/actions.ts) — Prisma's Json column returns whichever shape was actually
  // stored, so this has to handle both instead of always assuming a string.
  let formDataDisplay = '{}';
  let parsedFormData: unknown = null;
  if (lead.formData) {
    try {
      parsedFormData = typeof lead.formData === 'string' ? JSON.parse(lead.formData) : lead.formData;
      formDataDisplay = JSON.stringify(parsedFormData, null, 2);
    } catch {
      formDataDisplay = String(lead.formData);
    }
  }

  const inventoryEntries = getInventoryEntries(parsedFormData);
  const wasteTypeLabels = getWasteTypeLabels(parsedFormData);
  const extraServices = getExtraServices(parsedFormData);
  const pfd = (parsedFormData && typeof parsedFormData === 'object' ? parsedFormData : {}) as Record<string, unknown>;
  const serviceTypeLabel = typeof pfd.serviceType === 'string' ? SERVICE_TYPE_LABELS[pfd.serviceType] ?? pfd.serviceType : null;
  const packageLabel = typeof pfd.movingPackage === 'string' ? PACKAGE_LABELS[pfd.movingPackage] ?? pfd.movingPackage : null;
  const totalItemCount = inventoryEntries.reduce((sum, e) => sum + e.qty, 0);

  // Helper to format date
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/hallinta/liidit"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lead.contact.firstName} {lead.contact.lastName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>ID: {lead.id}</span>
              <span>•</span>
              <span>Luotu {formatDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <StatusSelector leadId={lead.id} initialStatus={lead.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Contact & Move Info */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Contact Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <User className="h-5 w-5 text-gray-400" />
              Yhteystiedot
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Nimi</label>
                <p className="font-medium text-gray-900 dark:text-white">{lead.contact.firstName} {lead.contact.lastName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Sähköposti</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${lead.contact.email}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {lead.contact.email || '-'}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Puhelin</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.contact.phone}`} className="text-gray-900 hover:text-blue-600 dark:text-white">
                    {lead.contact.phone || '-'}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Yritys</label>
                <p className="text-gray-900 dark:text-white">{lead.contact.companyName || '-'}</p>
              </div>
            </div>
          </div>

          {/* Move Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <MapPin className="h-5 w-5 text-gray-400" />
              Muuton tiedot
            </h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Mistä</label>
                  <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{lead.fromAddress || '-'}</p>
                  {/* City/Postal placeholers if we had separate fields */}
                </div>
                <div className="hidden h-12 w-px bg-gray-200 dark:bg-gray-700 sm:block"></div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Minne</label>
                  <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{lead.toAddress || '-'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                 <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Muuttopäivä</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(lead.requestedDate)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tilavuus / Koko</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{lead.volumeM3 ? `${lead.volumeM3} m³` : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Pinta-ala</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{lead.squareMeters ? `${lead.squareMeters} m²` : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Kerros</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{lead.floor !== null ? `${lead.floor}. krs` : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Hissi</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {lead.hasElevator === true ? 'Kyllä' : lead.hasElevator === false ? 'Ei' : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Laatikot (arvio)</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{lead.boxCount ? `${lead.boxCount} kpl` : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ilmoitetut tavarat (muuttolaskurin tavaralista) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Package className="h-5 w-5 text-gray-400" />
                Ilmoitetut tavarat
              </h2>
              {(serviceTypeLabel || packageLabel) && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {[serviceTypeLabel, packageLabel].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>

            {inventoryEntries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tälle liidille ei ole tallennettu tavaralistaa (esim. yleinen yhteydenotto tai muu lomake kuin muuttolaskuri).
              </p>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {inventoryEntries.map((entry, i) => (
                    <div
                      key={`${entry.label}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50"
                    >
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span>{entry.icon}</span>
                        {entry.label}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">× {entry.qty}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium uppercase text-gray-400">
                  {totalItemCount} tavaraa yhteensä ({inventoryEntries.length} nimikettä)
                </p>
              </>
            )}

            {wasteTypeLabels.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                <label className="text-xs font-medium uppercase text-gray-500">Jätetyypit</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{wasteTypeLabels.join(', ')}</p>
              </div>
            )}

            {extraServices.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                <label className="text-xs font-medium uppercase text-gray-500">Lisäpalvelut</label>
                <ul className="mt-1 list-inside list-disc text-sm text-gray-900 dark:text-white">
                  {extraServices.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Additional Notes */}
           <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-gray-400" />
              Lisätiedot & Viesti
            </h2>
            <div className="rounded-md bg-gray-50 p-4 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 whitespace-pre-wrap">
              {lead.notes || 'Ei lisätietoja.'}
            </div>
          </div>
        </div>

        {/* Right Column: Meta & Actions */}
        <div className="space-y-6">
           {/* System Info */}
           <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Järjestelmätiedot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Lähde</span>
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {lead.source}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Luotu</span>
                <span className="text-gray-900 dark:text-white">{formatDate(lead.createdAt)}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-gray-500">Päivitetty</span>
                <span className="text-gray-900 dark:text-white">{formatDate(lead.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Raw Data (JSON) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Raakadata (JSON)</h3>
            <pre className="max-h-60 overflow-y-auto rounded bg-gray-900 p-3 text-xs text-green-400 font-mono">
              {formDataDisplay}
            </pre>
          </div>
          
          {/* Actions */}
           <LeadDetailActions lead={lead} />
        </div>
      </div>
    </div>
  );
}
