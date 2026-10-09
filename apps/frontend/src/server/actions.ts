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

  // Toteutuneeksi merkitään vain lopullisen hinnan kanssa (lead-completion-actions.ts), jotta
  // kumppaniraportin completedAt + finalPrice ovat aina olemassa.
  if (status === 'COMPLETED') {
    throw new Error('Käytä "Merkitse toteutuneeksi" -toimintoa, jossa annetaan lopullinen hinta.');
  }

  const { prisma } = await import('@/server/db');
  const previous = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
  // Pois toteutuneesta (esim. vahingossa merkitty): completedAt/finalPrice säilyvät historiana,
  // mutta kuukausiraportti ja hallinta käyttävät niitä vain tilassa COMPLETED. Säilynyt
  // completedAt estää tuplapalkkion jos liidi merkitään uudelleen toteutuneeksi (ks.
  // lead-completion-actions.ts).
  const lead = await prisma.lead.update({ where: { id: leadId }, data: { status } });

  if (previous && previous.status !== status) {
    await createLog({
      entityType: 'Lead',
      entityId: leadId,
      action: 'lead.status_changed',
      message: `Tila vaihdettu hallinnassa: ${previous.status} -> ${status}`,
      data: { from: previous.status, to: status },
      actorId: session.user?.email ?? null,
    });
  }

  // Sama kalenterisynkronointi kuin Discord-reaktiossa — ennen tätä hallinnasta
  // voitetuksi/hävityksi merkitty liidi jätti kalenteritapahtuman alustavaksi.
  const { syncCalendarWithLeadStatus, recreateConfirmedLeadEvent } = await import('@/server/google-calendar');
  await syncCalendarWithLeadStatus(lead, status);
  // Peruttu/hävitty poisti kalenterimerkinnän — vahvistetuksi palautettaessa luodaan uusi.
  if (status === 'WON' && !lead.calendarEventId && lead.requestedDate) {
    await recreateConfirmedLeadEvent(lead.id);
  }

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
  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { formData: true, calendarEventId: true, requestedDate: true, contactId: true, discountPercent: true },
  });
  const existingFormData = parseLeadFormData(existingLead?.formData ?? null);
  const confirmedPriceRaw = typeof data.confirmedPrice === 'string' ? data.confirmedPrice.trim() : data.confirmedPrice;
  const updatedFormData = { ...existingFormData };
  if (confirmedPriceRaw === '' || confirmedPriceRaw === undefined || confirmedPriceRaw === null) {
    delete updatedFormData.confirmedPrice;
  } else {
    // Sallitaan myös haarukka (esim. "99-129") kiinteän hinnan sijaan — tallennetaan
    // merkkijonona sellaisenaan, väliviiva normalisoituna ajatusviivaksi ("–") jotta
    // se näyttää samalta kuin laskurin oman arvion haarukka sähköpostissa.
    updatedFormData.confirmedPrice = String(confirmedPriceRaw).replace(/\s*-\s*/g, '–');
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
  // laskurin näyttämä hinta-arvio vastaamaan uusia tietoja. Kumppanikoodilla tulleen liidin
  // alennus lasketaan uudelleen samalla varaushetken prosentilla, ettei se katoa muokatessa.
  const recomputed = recomputeLeadPrice(updatedFormData, existingLead?.discountPercent ?? null);
  if (recomputed) {
    updatedFormData.price = recomputed.price;
    updatedFormData.priceRangeLow = recomputed.priceRangeLow;
    updatedFormData.priceRangeHigh = recomputed.priceRangeHigh;
  }
  const discountPrices = recomputed?.discount
    ? {
        priceBeforeDiscount: recomputed.discount.priceBeforeDiscount,
        discountAmount: recomputed.discount.discountAmount,
        priceAfterDiscount: recomputed.discount.priceAfterDiscount,
      }
    : {};

  const newRequestedDate = data.requestedDate ? new Date(data.requestedDate) : null;

  // Basic mapping of fields
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      requestedDate: newRequestedDate,
      volumeM3: data.volumeM3 ? parseFloat(data.volumeM3) : null,
      squareMeters: data.squareMeters ? parseFloat(data.squareMeters) : null,
      floor: data.floor !== undefined && data.floor !== '' ? parseInt(data.floor) : null,
      hasElevator: hasElevatorValue,
      boxCount: data.boxCount ? parseInt(data.boxCount) : null,
      notes: data.notes,
      formData: JSON.stringify(updatedFormData),
      ...discountPrices,
    },
  });

  if (existingLead?.contactId && typeof data.customerName === 'string') {
    const customerName = data.customerName.trim();
    await prisma.contact.update({
      where: { id: existingLead.contactId },
      data: {
        firstName: customerName.split(' ')[0] || null,
        lastName: customerName.split(' ').slice(1).join(' ') || null,
      },
    });
  }

  // Keep an already-created calendar event in sync if the moving date changed
  // here — best-effort, same "never throw" rule as the rest of the Discord
  // bot / Calendar integration (see google-calendar.ts).
  if (
    existingLead?.calendarEventId &&
    newRequestedDate &&
    newRequestedDate.getTime() !== existingLead.requestedDate?.getTime()
  ) {
    const { updateCalendarEventTime } = await import('@/server/google-calendar');
    const preferredTime = typeof existingFormData.preferredTime === 'string' ? existingFormData.preferredTime : null;
    await updateCalendarEventTime(leadId, existingLead.calendarEventId, newRequestedDate, preferredTime);
  }

  return { success: true };
}
