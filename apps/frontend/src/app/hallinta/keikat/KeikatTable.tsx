'use client';

import { Lead, Contact } from '@prisma/client';
import { UniversalTable, Column, TablePagination } from '@/components/ui/UniversalTable';

type JobWithContact = Lead & { contact: Contact };

export default function KeikatTable({
  jobs,
  pagination,
}: {
  jobs: JobWithContact[];
  pagination?: TablePagination;
}) {
  const columns: Column<JobWithContact>[] = [
    {
      header: 'Asiakas',
      cell: (job) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {job.contact.firstName || '-'} {job.contact.lastName || ''}
        </span>
      ),
    },
    {
      header: 'Muuttopäivä',
      cell: (job) => (
        <span>{job.requestedDate ? new Date(job.requestedDate).toLocaleDateString('fi-FI') : '-'}</span>
      ),
    },
    {
      header: 'Reitti',
      cell: (job) => (
        <div className="max-w-md truncate">
          {job.fromAddress || '-'} {'->'} {job.toAddress || '-'}
        </div>
      ),
    },
    {
      header: 'Tila',
      cell: (job) => (
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {job.status}
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
      emptyMessage="Ei aktiivisia keikkoja."
    />
  );
}
