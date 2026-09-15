'use client';

import { Prisma } from '@prisma/client';
import { UniversalTable, Column, TablePagination } from '@/components/ui/UniversalTable';

export type CustomerWithLeads = Prisma.ContactGetPayload<{
  include: {
    _count: { select: { leads: true } };
    leads: {
      take: 1;
      orderBy: { createdAt: 'desc' };
      select: { status: true; requestedDate: true; createdAt: true };
    };
  };
}>;

export default function AsiakkaatTable({
  customers,
  pagination,
}: {
  customers: CustomerWithLeads[];
  pagination?: TablePagination;
}) {
  const columns: Column<CustomerWithLeads>[] = [
    {
      header: 'Nimi',
      cell: (customer) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {customer.firstName || '-'} {customer.lastName || ''}
        </span>
      ),
    },
    {
      header: 'Yhteystiedot',
      cell: (customer) => (
        <div>
          <div>{customer.phone || '-'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Yritys',
      cell: (customer) => <span>{customer.companyName || '-'}</span>,
    },
    {
      header: 'Keikkoja',
      cell: (customer) => <span>{customer._count.leads}</span>,
    },
    {
      header: 'Viimeisin status',
      cell: (customer) => <span>{customer.leads[0] ? customer.leads[0].status : '-'}</span>,
    },
  ];

  return (
    <UniversalTable
      data={customers}
      columns={columns}
      pagination={pagination}
      emptyMessage="Ei asiakkaita vielä."
    />
  );
}
