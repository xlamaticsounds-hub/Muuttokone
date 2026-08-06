'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';

export type CreateInvoiceInput = {
  contactId: string | null;
  customerName: string;
  description: string;
  amount: number;
  vatRate: number;
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
  if (!input.description.trim()) {
    throw new Error('Selite vaaditaan.');
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Summan pitää olla positiivinen luku.');
  }

  const invoice = await prisma.invoice.create({
    data: {
      contactId: input.contactId || null,
      customerName,
      description: input.description.trim(),
      amount: input.amount,
      vatRate: input.vatRate,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  return { id: invoice.id };
}
