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
  customerStreet: string | null;
  customerPostalCode: string | null;
  customerCity: string | null;
  customerEmail: string | null;
  items: InvoiceLineItem[];
  dueDate: string | null; // ISO-päivämäärä
  serviceDate: string | null; // ISO-päivämäärä
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
      customerStreet: input.customerStreet?.trim() || null,
      customerPostalCode: input.customerPostalCode?.trim() || null,
      customerCity: input.customerCity?.trim() || null,
      customerEmail: input.customerEmail?.trim() || null,
      items,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
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
      customerStreet: input.customerStreet?.trim() || null,
      customerPostalCode: input.customerPostalCode?.trim() || null,
      customerCity: input.customerCity?.trim() || null,
      customerEmail: input.customerEmail?.trim() || null,
      items,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
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
      customerStreet: source.customerStreet,
      customerPostalCode: source.customerPostalCode,
      customerCity: source.customerCity,
      customerEmail: source.customerEmail,
      items: parseInvoiceItems(source.items),
      dueDate: source.dueDate,
      serviceDate: source.serviceDate,
    },
  });

  return { id: invoice.id };
}

// Luo uuden, muokattavan laskun erääntyneen laskun pohjalta lisäämällä sille
// viivästyskorkorivin. Korko lasketaan yksinkertaisena (ei korkoa korolle) päiväkohtaisena
// korkona alkuperäisen laskun loppusummalle: pääoma × (vuosikorko/100) × päivät/365 —
// korkolain (633/1982) 4 §:n mukainen laskentatapa. Vuosikorko syötetään käsin sivulla, koska
// se riippuu Suomen Pankin kulloinkin voimassa olevasta viitekorosta + lakisääteisestä
// lisästä, eikä sitä pidä kovakoodata (viitekorko muuttuu puolivuosittain).
export async function createLateFeeInvoice(
  invoiceId: string,
  ratePercent: number,
): Promise<{ id: string; amount: number; days: number }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!Number.isFinite(ratePercent) || ratePercent <= 0) {
    throw new Error('Anna kelvollinen vuosikorko (%).');
  }

  const source = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!source) {
    throw new Error('Laskua ei löytynyt.');
  }
  if (!source.dueDate) {
    throw new Error('Laskulla ei ole eräpäivää — viivästyskorkoa ei voi laskea.');
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((now.getTime() - source.dueDate.getTime()) / msPerDay);
  if (days <= 0) {
    throw new Error('Laskun eräpäivä ei ole vielä ohittunut.');
  }

  const sourceItems = parseInvoiceItems(source.items);
  const principal = sourceItems.reduce((sum, item) => sum + item.amount, 0);
  const rawAmount = principal * (ratePercent / 100) * (days / 365);
  const amount = Math.round(rawAmount * 100) / 100;

  const dueDateFi = source.dueDate.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
  const lateFeeItem = {
    description: `Viivästyskorko ${ratePercent} % p.a., ${days} pv (alkuperäinen eräpäivä ${dueDateFi}, lasku #${source.invoiceNumber})`,
    amount,
    vatRate: 0, // Viivästyskorko ei ole arvonlisäverollista (AVL 78 §).
  };

  const invoice = await prisma.invoice.create({
    data: {
      contactId: source.contactId,
      customerName: source.customerName,
      customerStreet: source.customerStreet,
      customerPostalCode: source.customerPostalCode,
      customerCity: source.customerCity,
      customerEmail: source.customerEmail,
      items: [...sourceItems, lateFeeItem],
      dueDate: null,
      serviceDate: source.serviceDate,
    },
  });

  await createLog({
    entityType: 'Invoice',
    entityId: invoice.id,
    action: 'invoice.late_fee_created',
    message: `Maksumuistutus viivästyskorolla luotu laskusta #${source.invoiceNumber} (${ratePercent} %, ${days} pv, ${amount} €)`,
    data: { sourceInvoiceId: source.id, sourceInvoiceNumber: source.invoiceNumber, ratePercent, days, amount },
    actorId: session.user?.email ?? null,
  });

  return { id: invoice.id, amount, days };
}

const STATUS_LABELS_FI: Record<InvoiceStatus, string> = {
  DRAFT: 'Luonnos',
  SENT: 'Lähetetty',
  UNPAID: 'Ei maksettu',
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
