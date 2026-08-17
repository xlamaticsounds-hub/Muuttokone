'use server';

import { safeFormAction, createSuccessResult } from '@/lib/form-helpers';
import { quoteSchema, quickQuoteSchema } from '@/features/quote/schemas';
import { contactSchema } from '@/features/contact/schemas';
import { upsertContactByEmail } from './repo/contacts';
import { createLead } from './repo/leads';
import { createLog } from './repo/logs';
import { LeadSource, LeadStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { rateLimit } from '@/server/rate-limit';

import type { NextRequest } from 'next/server';

// Extract client IP from NextRequest headers (x-forwarded-for, x-real-ip, etc.)
export async function ipFromHeaders(request?: NextRequest): Promise<string | null> {
  if (!request) return null;
  const forwarded =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip');
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list
    return String(forwarded).split(',')[0].trim();
  }
  return null;
}

export async function submitContact(formData: FormData) {
  return safeFormAction(
    contactSchema,
    async (data) => {
      const ip = await ipFromHeaders();
      if (ip) await rateLimit(ip, 'lead.create', 5, 15);

      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        notes: data.message ?? null,
      });

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
        formData: { kind: 'contact', payload: data },
        notes: data.message ?? null,
      });

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Contact form submitted',
        data: { email: data.email },
        ip,
      });

      return createSuccessResult({ leadId: lead.id }, 'Kiitos! Otamme yhteyttä pian.');
    },
    formData,
  );
}

export async function submitQuickQuote(formData: FormData) {
  return safeFormAction(
    quickQuoteSchema,
    async (data: any) => {
      const ip = await ipFromHeaders();
      if (ip) await rateLimit(ip, 'lead.create', 5, 15);

      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        city: data.fromCity ?? null, // optional mapping
        gdprConsent: true,
      });

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.QUICK_QUOTE,
        formData: { kind: 'quick-quote', payload: data },
        requestedDate: data.moveDate ? new Date(data.moveDate) : null,
        fromAddress: [data.fromStreet, data.fromPostalCode, data.fromCity]
          .filter(Boolean)
          .join(', '),
        toAddress: [data.toStreet, data.toPostalCode, data.toCity].filter(Boolean).join(', '),
        volumeM3: data.estimatedVolumeM3 ?? null,
        notes: data.description ?? null,
      });

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Quick quote submitted',
        data: { email: data.email },
        ip,
      });

      return createSuccessResult({ leadId: lead.id }, 'Pikatarjous vastaanotettu – palaamme pian!');
    },
    formData,
  );
}

export async function submitQuote(formData: FormData) {
  return safeFormAction(
    quoteSchema,
    async (data: any) => {
      const ip = await ipFromHeaders();
      if (ip) await rateLimit(ip, 'lead.create', 5, 15);

      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        city: data.fromCity ?? null,
        gdprConsent: true,
      });

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.STEP_FORM,
        formData: { kind: 'quote-full', payload: data },
        requestedDate: data.moveDate ? new Date(data.moveDate) : null,
        fromAddress: [data.fromStreet, data.fromPostalCode, data.fromCity]
          .filter(Boolean)
          .join(', '),
        toAddress: [data.toStreet, data.toPostalCode, data.toCity].filter(Boolean).join(', '),
        volumeM3: data.estimatedVolumeM3 ?? null,
        notes: data.description ?? null,
      });

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Full quote submitted',
        data: { email: data.email },
        ip,
      });

      return createSuccessResult({ leadId: lead.id }, 'Kiitos! Tarjouspyyntö vastaanotettu.');
    },
    formData,
  );
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const { prisma } = await import('@/server/db');
  await prisma.lead.update({
    where: { id: leadId },
    data: { status },
  });
  
  return { success: true };
}

export async function updateLeadDetails(leadId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }

  const { prisma } = await import('@/server/db');
  const { parseLeadFormData, recomputeLeadPrice } = await import('@/server/lead-format');

  // Vahvistettu (kiinteä) hinta ei ole oma Prisma-sarake — se tallennetaan olemassa olevan
  // formData-JSONin sisään ("confirmedPrice"), jotta tämä ei vaadi tietokantamigraatiota.
  // sendQuoteEmail (send-quote.ts) suosii tätä arvoa laskurin hinta-arvion sijaan, kun se on
  // asetettu — juuri sitä varten että laskurin nettisivulla näkyvä ARVIO ja sähköpostitse
  // lähetetty lopullinen TARJOUS voivat olla eri asioita.
  const existingLead = await prisma.lead.findUnique({ where: { id: leadId }, select: { formData: true } });
  const existingFormData = parseLeadFormData(existingLead?.formData ?? null);
  const confirmedPriceRaw = typeof data.confirmedPrice === 'string' ? data.confirmedPrice.trim() : data.confirmedPrice;
  const updatedFormData = { ...existingFormData };
  if (confirmedPriceRaw === '' || confirmedPriceRaw === undefined || confirmedPriceRaw === null) {
    delete updatedFormData.confirmedPrice;
  } else {
    const parsed = parseFloat(confirmedPriceRaw);
    if (!Number.isNaN(parsed)) updatedFormData.confirmedPrice = parsed;
  }

  // Asunnon kokoluokka ja kohteen kerros/hissi eivät ole omia Prisma-sarakkeita (vain
  // lähtöosoitteella on floor/hasElevator-sarakkeet) — tallennetaan formData:aan samalla
  // periaatteella kuin confirmedPrice, koska calculateMovingPrice lukee ne juuri sieltä.
  if (typeof data.apartmentSize === 'string' && data.apartmentSize) {
    updatedFormData.apartmentSize = data.apartmentSize;
  }
  if (data.floorTo !== undefined && data.floorTo !== '') {
    const floorToNum = parseInt(data.floorTo);
    if (!Number.isNaN(floorToNum)) updatedFormData.floorTo = floorToNum;
  }
  if (data.elevatorTo === 'true' || data.elevatorTo === 'false') {
    updatedFormData.elevatorTo = data.elevatorTo === 'true';
  }
  // Peilataan lähtöosoitteen kerros/hissi formData:aan floorFrom/elevatorFrom-nimillä, koska
  // calculateMovingPrice lukee niitä nimillä eikä Lead-taulun floor/hasElevator-sarakkeista.
  const floorFromNum = data.floor !== undefined && data.floor !== '' ? parseInt(data.floor) : NaN;
  if (!Number.isNaN(floorFromNum)) updatedFormData.floorFrom = floorFromNum;
  if (data.hasElevator === 'true' || data.hasElevator === 'false') {
    updatedFormData.elevatorFrom = data.hasElevator === 'true';
  }

  // "null" (ei tiedossa) ei saa muuttua false:ksi — vain eksplisiittinen 'true'/'false' kirjataan.
  const hasElevatorValue = data.hasElevator === 'true' ? true : data.hasElevator === 'false' ? false : null;

  // Jos muokatut kentät riittävät hinnan uudelleenlaskentaan (liidi tuli alunperin
  // muuttolaskurista, formData sisältää mm. furnitureItems/distanceKm), päivitetään myös
  // laskurin näyttämä hinta-arvio vastaamaan uusia tietoja.
  const recomputed = recomputeLeadPrice(updatedFormData);
  if (recomputed) {
    updatedFormData.price = recomputed.price;
    updatedFormData.priceRangeLow = recomputed.priceRangeLow;
    updatedFormData.priceRangeHigh = recomputed.priceRangeHigh;
  }

  // Basic mapping of fields
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
      volumeM3: data.volumeM3 ? parseFloat(data.volumeM3) : null,
      squareMeters: data.squareMeters ? parseFloat(data.squareMeters) : null,
      floor: data.floor !== undefined && data.floor !== '' ? parseInt(data.floor) : null,
      hasElevator: hasElevatorValue,
      boxCount: data.boxCount ? parseInt(data.boxCount) : null,
      notes: data.notes,
      formData: JSON.stringify(updatedFormData),
    },
  });

  return { success: true };
}
