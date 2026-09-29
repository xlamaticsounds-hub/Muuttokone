'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { buildLateFeeItem, parseInvoiceItems, type InvoiceLineItem } from '@/lib/invoice';
import type { InvoiceStatus } from '@prisma/client';
import { getPackageLabel, getServiceLabel, getStoredPrice, parseLeadFormData } from '@/server/lead-format';

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

// Luo laskuluonnoksen liidin tiedoista (asiakas, osoite, sähköposti, palvelu, hinta ja
// muuttopäivä suorituspäiväksi), jotta mitään ei tarvitse kirjoittaa uudelleen käsin.
// Summa otetaan vahvistetusta hinnasta tai laskurin tarkasta hinnasta — jos hinta on vain
// haarukka (esim. "99–129"), summa jätetään nollaksi ja täytetään muokkaussivulla.
export async function createInvoiceFromLead(leadId: string): Promise<{ id: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    throw new Error('Liidiä ei löytynyt.');
  }

  const pfd = parseLeadFormData(lead.formData);
  const { confirmed, exact } = getStoredPrice(pfd);
  const confirmedNumber = confirmed !== null ? Number(confirmed.replace(/[\s€]/g, '').replace(',', '.')) : NaN;
  const amount = Number.isFinite(confirmedNumber) && confirmedNumber > 0 ? confirmedNumber : exact ?? 0;

  const service = [getServiceLabel(pfd) ?? 'Muutto', getPackageLabel(pfd)].filter(Boolean).join(' · ');
  const route = [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → ');
  const description = route ? `${service}: ${route}` : service;

  const contact = lead.contact;
  const customerName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.companyName || 'Nimetön asiakas';

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const invoice = await prisma.invoice.create({
    data: {
      contactId: contact.id,
      customerName,
      customerStreet: contact.street,
      customerPostalCode: contact.postalCode,
      customerCity: contact.city,
      customerEmail: contact.email,
      items: [{ description, amount, vatRate: 0.255 }],
      dueDate,
      serviceDate: lead.requestedDate,
    },
  });

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.invoice_created',
    message: `Laskuluonnos #${invoice.invoiceNumber} luotu liidistä`,
    data: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amount },
    actorId: session.user?.email ?? null,
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

  // Alkuperäinen eräpäivä on kopioitaessa yleensä jo mennyt — säilytetään sama maksuaika
  // (esim. 14 pv) laskettuna tästä päivästä.
  const dueDate = source.dueDate
    ? new Date(Date.now() + Math.max(0, source.dueDate.getTime() - source.createdAt.getTime()))
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      contactId: source.contactId,
      customerName: source.customerName,
      customerStreet: source.customerStreet,
      customerPostalCode: source.customerPostalCode,
      customerCity: source.customerCity,
      customerEmail: source.customerEmail,
      items: parseInvoiceItems(source.items),
      dueDate,
      serviceDate: source.serviceDate,
    },
  });

  return { id: invoice.id };
}

// Luo uuden laskun erääntyneen laskun pohjalta lisäämällä sille viivästyskorkorivin
// (laskenta: lib/invoice.ts:buildLateFeeItem). Vuosikorko syötetään käsin sivulla, koska
// se riippuu Suomen Pankin kulloinkin voimassa olevasta viitekorosta + lakisääteisestä
// lisästä, eikä sitä pidä kovakoodata (viitekorko muuttuu puolivuosittain).
export async function createLateFeeInvoice(
  invoiceId: string,
  ratePercent: number,
  dueDate: string | null = null, // ISO-päivämäärä uudelle laskulle
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

  const sourceItems = parseInvoiceItems(source.items);
  const { item: lateFeeItem, days, amount } = buildLateFeeItem({
    items: sourceItems,
    dueDate: source.dueDate,
    ratePercent,
    invoiceNumber: source.invoiceNumber,
  });
  if (days <= 0) {
    throw new Error('Laskun eräpäivä ei ole vielä ohittunut.');
  }

  const invoice = await prisma.invoice.create({
    data: {
      contactId: source.contactId,
      customerName: source.customerName,
      customerStreet: source.customerStreet,
      customerPostalCode: source.customerPostalCode,
      customerCity: source.customerCity,
      customerEmail: source.customerEmail,
      sourceInvoiceId: source.id,
      items: [...sourceItems, lateFeeItem],
      dueDate: dueDate ? new Date(dueDate) : null,
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
  SUPERSEDED: 'Korvattu muistutuksella',
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
