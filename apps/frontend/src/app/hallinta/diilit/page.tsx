import Link from 'next/link';
import { prisma } from '@/server/db';
import { Lead, Contact, LeadStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATUS_ORDER: LeadStatus[] = [
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'SCHEDULED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Uusi',
  QUALIFIED: 'Kelpuutettu',
  CONTACTED: 'Oltu yhteydessä',
  SCHEDULED: 'Aikataulutettu',
  PROPOSAL_SENT: 'Tarjous lähetetty',
  WON: 'Voitettu',
  LOST: 'Hävitty',
  ARCHIVED: 'Arkistoitu',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  QUALIFIED: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  CONTACTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  SCHEDULED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  PROPOSAL_SENT: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  WON: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  LOST: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

type LeadWithContact = Lead & { contact: Contact };

export default async function DiilitPage() {
  let dbUnavailable = false;
  let leads: LeadWithContact[] = [];

  try {
    leads = await prisma.lead.findMany({
      where: { status: { not: 'ARCHIVED' } },
      include: { contact: true },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/diilit] Database unavailable, showing fallback view', error);
  }

  const columns = STATUS_ORDER.map((status) => ({
    status,
    leads: leads.filter((lead) => lead.status === status),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diilit</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Avoimet ja suljetut kaupat, ryhmiteltynä tilan mukaan.
        </p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta diilidata ei päivity.
        </div>
      )}

      {!dbUnavailable && leads.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ei aktiivisia diilejä.</p>
        </div>
      )}

      {leads.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 sm:overflow-x-auto sm:pb-2">
          {columns.map(({ status, leads: columnLeads }) => (
            <div
              key={status}
              className="rounded-lg border border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/40 sm:w-72 sm:flex-shrink-0"
            >
              <div
                className={`flex items-center justify-between rounded-t-lg border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide dark:border-gray-700 ${STATUS_COLORS[status]}`}
              >
                <span>{STATUS_LABELS[status]}</span>
                <span>{columnLeads.length}</span>
              </div>
              <div className="space-y-2 p-2">
                {columnLeads.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500">
                    Ei diilejä tässä vaiheessa.
                  </p>
                ) : (
                  columnLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/hallinta/liidit/${lead.id}`}
                      className="block rounded-md border border-gray-200 bg-white p-2.5 text-sm shadow-sm hover:border-blue-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-800"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lead.contact.firstName || '-'} {lead.contact.lastName || ''}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {lead.fromAddress || '-'} {'->'} {lead.toAddress || '-'}
                      </p>
                      {lead.requestedDate && (
                        <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          {new Date(lead.requestedDate).toLocaleDateString('fi-FI')}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
