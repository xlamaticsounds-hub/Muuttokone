import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { SELECTABLE_LEAD_STATUSES } from '@/lib/lead-status';
import LeadsTable from '../LeadsTable';
import LeadFilters from './LeadFilters';
import { requirePageAccess } from '@/server/access';
import { teamWhere } from '@/lib/access';
import { isTeamId } from '@/lib/teams';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function LiiditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tila?: string; koodi?: string; tiimi?: string }>;
}) {
  const actor = await requirePageAccess('/hallinta/liidit');
  const isOwner = actor.role === 'OWNER';
  const { page: pageParam, tila, koodi, tiimi } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  // Suodattimet URL:ssa (?tila=COMPLETED&koodi=1), jotta näkymän voi jakaa linkkinä ja
  // selaimen takaisin-painike toimii myös puhelimella.
  const status = SELECTABLE_LEAD_STATUSES.includes(tila as LeadStatus) ? (tila as LeadStatus) : null;
  const onlyDiscount = koodi === '1';
  // Tiimisuodatin vain omistajille (?tiimi=tampere / jakamaton); aluevastaava näkee aina vain oman tiiminsä
  const team = isOwner && (tiimi === 'jakamaton' || isTeamId(tiimi)) ? tiimi : null;
  const where: Prisma.LeadWhereInput = {
    ...teamWhere(actor),
    ...(team && { teamId: team === 'jakamaton' ? null : team }),
    ...(status && { status }),
    ...(onlyDiscount && { discountCode: { not: null } }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        contact: true,
        discount: { select: { partner: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterQuery = new URLSearchParams({
    ...(status && { tila: status }),
    ...(onlyDiscount && { koodi: '1' }),
    ...(team && { tiimi: team }),
  }).toString();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liidit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hallinnoi saapuneita tarjouspyyntöjä.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 sm:inline dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
            {total} {status || onlyDiscount || team ? 'osumaa' : 'yhteensä'}
          </span>
          <Link
            href="/hallinta/liidit/uusi"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Keikka muualta
          </Link>
        </div>
      </div>

      <LeadFilters status={status} onlyDiscount={onlyDiscount} team={team} showTeams={isOwner} />

      <LeadsTable
        leads={leads}
        showTeam={isOwner}
        pagination={{
          page,
          totalPages,
          total,
          pageSize: PAGE_SIZE,
          basePath: filterQuery ? `/hallinta/liidit?${filterQuery}` : '/hallinta/liidit',
        }}
      />
    </div>
  );
}
