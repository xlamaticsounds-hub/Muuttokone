import { prisma } from '@/server/db';
import { Lead, Contact, LeadStatus } from '@prisma/client';
import KeikatTable from './KeikatTable';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const SIDE_LIST_LIMIT = 20; // menneet ja päivättömät: tärkeimmät näkyviin, loput liidilistasta
// Perutut ja toteutuneet eivät ole enää tulevia keikkoja (ks. lib/lead-status.ts).
const INACTIVE_STATUSES: LeadStatus[] = INACTIVE_JOB_STATUSES;
const ACTIVE_WHERE = {
  status: {
    notIn: INACTIVE_STATUSES,
  },
};

export default async function KeikatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  // requestedDate tallennetaan UTC-keskiyönä, joten "tänään" on Suomen päivä UTC-keskiyönä.
  const today = new Date(`${toHelsinkiDateInput(new Date())}T00:00:00Z`);
  const UPCOMING_WHERE = { ...ACTIVE_WHERE, requestedDate: { gte: today } };
  const PAST_WHERE = { ...ACTIVE_WHERE, requestedDate: { lt: today } };
  const UNDATED_WHERE = { ...ACTIVE_WHERE, requestedDate: null };

  let dbUnavailable = false;
  let upcoming: (Lead & { contact: Contact })[] = [];
  let past: (Lead & { contact: Contact })[] = [];
  let undated: (Lead & { contact: Contact })[] = [];
  let upcomingTotal = 0;
  let pastTotal = 0;
  let undatedTotal = 0;

  try {
    [upcoming, past, undated, upcomingTotal, pastTotal, undatedTotal] = await Promise.all([
      // Tulevat: lähin päivä ensin (aiemmin vanhimmat, siivoamatta jääneet keikat tulivat ensin)
      prisma.lead.findMany({
        include: { contact: true },
        where: UPCOMING_WHERE,
        orderBy: [{ requestedDate: 'asc' }, { createdAt: 'desc' }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      // Menneet mutta yhä aktiivisessa tilassa: tuorein ensin
      prisma.lead.findMany({
        include: { contact: true },
        where: PAST_WHERE,
        orderBy: [{ requestedDate: 'desc' }],
        take: SIDE_LIST_LIMIT,
      }),
      prisma.lead.findMany({
        include: { contact: true },
        where: UNDATED_WHERE,
        orderBy: [{ createdAt: 'desc' }],
        take: SIDE_LIST_LIMIT,
      }),
      prisma.lead.count({ where: UPCOMING_WHERE }),
      prisma.lead.count({ where: PAST_WHERE }),
      prisma.lead.count({ where: UNDATED_WHERE }),
    ]);
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/keikat] Database unavailable, showing fallback view', error);
  }

  const totalPages = Math.max(1, Math.ceil(upcomingTotal / PAGE_SIZE));
  const chip = 'rounded-full border px-3 py-1 text-sm font-medium';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keikat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tulevat muutot lähimmästä päivästä alkaen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${chip} border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400`}>
            {upcomingTotal} tulevaa
          </span>
          {pastTotal > 0 && (
            <a href="#menneet" className={`${chip} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300`}>
              {pastTotal} menneenä käsittelemättä
            </a>
          )}
          {undatedTotal > 0 && (
            <a href="#ilman-paivaa" className={`${chip} border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300`}>
              {undatedTotal} ilman päivää
            </a>
          )}
        </div>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta keikkadata ei päivity.
        </div>
      )}

      <KeikatTable
        jobs={upcoming}
        emptyMessage="Ei tulevia keikkoja."
        pagination={
          dbUnavailable
            ? undefined
            : { page, totalPages, total: upcomingTotal, pageSize: PAGE_SIZE, basePath: '/hallinta/keikat' }
        }
      />

      {past.length > 0 && (
        <section id="menneet" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menneet, ei käsitelty</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Muuttopäivä on mennyt, mutta liidi ei ole Tehty, Hävitty tai Peruttu. Merkitse keikka tehdyksi tai sulje liidi.
              {pastTotal > past.length && ` Näytetään ${past.length} tuoreinta (${pastTotal} yhteensä).`}
            </p>
          </div>
          <KeikatTable jobs={past} />
        </section>
      )}

      {undated.length > 0 && (
        <section id="ilman-paivaa" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ilman muuttopäivää</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Näitä ei näy kalenterissa ennen kuin päivä on sovittu.
              {undatedTotal > undated.length && ` Näytetään ${undated.length} tuoreinta (${undatedTotal} yhteensä).`}
            </p>
          </div>
          <KeikatTable jobs={undated} />
        </section>
      )}
    </div>
  );
}
