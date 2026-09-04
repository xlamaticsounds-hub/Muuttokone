'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { parseInvoiceItems, type InvoiceLineItem } from '@/lib/invoice';
import type { InvoiceStatus } from '@prisma/client';

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

export type UpdateInvoiceInput = CreateInvoiceInput;

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<{ id: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!existing) {
    throw new Error('Laskua ei löytynyt.');
  }
  if (existing.sentAt) {
    throw new Error('Lähetettyä laskua ei voi enää muokata.');
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

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      contactId: input.contactId || null,
      customerName,
      items,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  return { id: invoice.id };
}

// Luo uuden, muokattavan (lähettämättömän) laskun jo lähetetyn laskun tiedoista.
// Tarkoitus: lähetettyä laskua ei saa enää muokata, mutta samat tiedot halutaan
// usein pohjaksi seuraavalle laskulle ilman että kukaan kirjoittaa koko laskua
// uusiksi — kopiossa ei näy mitään "kopio"-merkintää, se on ihan tavallinen uusi lasku.
export async function duplicateInvoice(invoiceId: string): Promise<{ id: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const source = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!source) {
    throw new Error('Laskua ei löytynyt.');
  }

  const invoice = await prisma.invoice.create({
    data: {
      contactId: source.contactId,
      customerName: source.customerName,
      items: parseInvoiceItems(source.items),
      dueDate: source.dueDate,
    },
  });

  return { id: invoice.id };
}

const STATUS_LABELS_FI: Record<InvoiceStatus, string> = {
  DRAFT: 'Luonnos',
  SENT: 'Lähetetty',
  PAID: 'Maksettu',
  OVERDUE: 'Maksu myöhässä',
};

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });

  await createLog({
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'invoice.status_changed',
    message: `Laskun tila muutettu: ${STATUS_LABELS_FI[status]}`,
    data: { status },
    actorId: session.user?.email ?? null,
  });

  return { id: invoice.id, status: invoice.status };
}

// Poistaa laskun pysyvästi — ei pehmeää poistoa (Invoice-mallilla ei ole deletedAt-saraketta,
// toisin kuin Leadillä). Lokimerkintä jää talteen erikseen ennen poistoa, koska Log-rivi
// viittaa entityId:hen joka ei enää löydy Invoice-taulusta poiston jälkeen.
export async function deleteInvoice(invoiceId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    throw new Error('Laskua ei löytynyt.');
  }

  await createLog({
    entityType: 'Invoice',
    entityId: invoiceId,
    action: 'invoice.deleted',
    message: `Lasku #${invoice.invoiceNumber} (${invoice.customerName}) poistettu`,
    data: { invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName },
    actorId: session.user?.email ?? null,
  });

  await prisma.invoice.delete({ where: { id: invoiceId } });

  return { success: true };
}
