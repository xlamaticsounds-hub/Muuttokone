'use client';

import { useRouter } from 'next/navigation';
import { Lead, Contact } from '@prisma/client';
import { UniversalTable, Column, TablePagination } from '@/components/ui/UniversalTable';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES } from '@/lib/lead-status';
import BaseTripBadge from '../BaseTripBadge';

type JobWithContact = Lead & { contact: Contact };

export default function KeikatTable({
  jobs,
  pagination,
  emptyMessage = 'Ei aktiivisia keikkoja.',
}: {
  jobs: JobWithContact[];
  pagination?: TablePagination;
  emptyMessage?: string;
}) {
  const router = useRouter();

  const columns: Column<JobWithContact>[] = [
    {
      header: 'Asiakas',
      cell: (job) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {[job.contact.firstName, job.contact.lastName].filter(Boolean).join(' ') || job.contact.companyName || '-'}
        </span>
      ),
    },
    {
      header: 'Muuttopäivä',
      cell: (job) => (
        // requestedDate on tallennettu UTC-keskiyönä, joten päivä luetaan UTC:nä (muuten ilta-aikavyöhyke voisi siirtää sen)
        <span>{job.requestedDate ? new Date(job.requestedDate).toLocaleDateString('fi-FI', { timeZone: 'UTC' }) : '-'}</span>
      ),
    },
    {
      header: 'Reitti',
      cell: (job) => (
        <div className="max-w-md">
          <div className="truncate">
            {job.fromAddress || '-'} {'->'} {job.toAddress || '-'}
          </div>
          <BaseTripBadge lead={job} />
        </div>
      ),
    },
    {
      header: 'Tila',
      cell: (job) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${LEAD_STATUS_PILL_CLASSES[job.status]}`}>
          {LEAD_STATUS_LABELS[job.status]}
        </span>
      ),
    },
    {
      header: 'Yhteys',
      cell: (job) => <span>{job.contact.phone || job.contact.email || '-'}</span>,
    },
  ];

  return (
    <UniversalTable
      data={jobs}
      columns={columns}
      pagination={pagination}
      emptyMessage={emptyMessage}
      onRowClick={(job) => router.push(`/hallinta/liidit/${job.id}`)}
    />
  );
}
