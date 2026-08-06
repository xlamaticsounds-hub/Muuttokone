'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import type { InvoiceLineItem } from '@/lib/invoice';

export type CreateInvoiceInput = {
  contactId: string | null;
  customerName: string;
  items: InvoiceLineItem[];
  dueDate: string | null; // ISO-päivämäärä
};

export async function createInvoice(input: CreateInvoiceInput): Promise<{ id: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const customerName = input.customerName.trim();
  if (!customerName) {
    throw new Error('Asiakkaan nimi vaaditaan.');
  }

  const items = input.items
    .map((item) => ({ description: item.description.trim(), amount: item.amount, vatRate: item.vatRate }))
    .filter((item) => item.description && Number.isFinite(item.amount) && item.amount > 0);

  if (items.length === 0) {
    throw new Error('Lisää vähintään yksi rivi, jossa on selite ja summa.');
  }

  const invoice = await prisma.invoice.create({
    data: {
      contactId: input.contactId || null,
      customerName,
      items,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  return { id: invoice.id };
}
