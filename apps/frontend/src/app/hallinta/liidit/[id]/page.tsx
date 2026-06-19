import { prisma } from '@/server/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, User, Phone, Mail, FileText, Globe } from 'lucide-react';
import { LeadStatus } from '@prisma/client';
import StatusSelector from './StatusSelector';
import LeadDetailActions from './LeadDetailActions';

export const dynamic = 'force-dynamic';

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
  if (lead.formData) {
    try {
      const parsed = typeof lead.formData === 'string' ? JSON.parse(lead.formData) : lead.formData;
      formDataDisplay = JSON.stringify(parsed, null, 2);
    } catch {
      formDataDisplay = String(lead.formData);
    }
  }

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
