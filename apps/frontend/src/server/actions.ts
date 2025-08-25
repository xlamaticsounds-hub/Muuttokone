'use server'

import { safeFormAction, createSuccessResult } from '@/lib/form-helpers'
import { quoteSchema, quickQuoteSchema } from '@/features/quote/schemas'
import { contactSchema } from '@/features/contact/schemas'
import { upsertContactByEmail } from './repo/contacts'
import { createLead } from './repo/leads'
import { createLog } from './repo/logs'
import { LeadSource, LeadStatus } from '@prisma/client'

import type { NextRequest } from 'next/server'

// Extract client IP from NextRequest headers (x-forwarded-for, x-real-ip, etc.)
export function ipFromHeaders(request?: NextRequest): string | null {
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
      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        notes: data.message ?? null,
      })

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
        formData: { kind: 'contact', payload: data },
        notes: data.message ?? null,
      })

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Contact form submitted',
        data: { email: data.email },
        ip: ipFromHeaders(),
      })

      return createSuccessResult({ leadId: lead.id }, 'Kiitos! Otamme yhteyttä pian.')
    },
    formData,
  )
}

export async function submitQuickQuote(formData: FormData) {
  return safeFormAction(
    quickQuoteSchema,
    async (data: any) => {
      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        city: data.fromCity ?? null, // optional mapping
        gdprConsent: true,
      })

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.QUICK_QUOTE,
        formData: { kind: 'quick-quote', payload: data },
        requestedDate: data.moveDate ? new Date(data.moveDate) : null,
        fromAddress: [data.fromStreet, data.fromPostalCode, data.fromCity].filter(Boolean).join(', '),
        toAddress: [data.toStreet, data.toPostalCode, data.toCity].filter(Boolean).join(', '),
        volumeM3: data.estimatedVolumeM3 ?? null,
        elevatorFrom: data.hasElevator ?? null,
        packingNeeded: data.packingService ?? null,
        notes: data.description ?? null,
      })

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Quick quote submitted',
        data: { email: data.email },
        ip: ipFromHeaders(),
      })

      return createSuccessResult({ leadId: lead.id }, 'Pikatarjous vastaanotettu – palaamme pian!')
    },
    formData,
  )
}

export async function submitQuote(formData: FormData) {
  return safeFormAction(
    quoteSchema,
    async (data: any) => {
      const contact = await upsertContactByEmail({
        email: data.email,
        phone: data.phone ?? null,
        firstName: data.name?.split(' ')?.[0] ?? null,
        lastName: data.name?.split(' ')?.slice(1).join(' ') || null,
        city: data.fromCity ?? null,
        gdprConsent: true,
      })

      const lead = await createLead({
        contact: { connect: { id: contact.id } },
        status: LeadStatus.NEW,
        source: LeadSource.STEP_FORM,
        formData: { kind: 'quote-full', payload: data },
        requestedDate: data.moveDate ? new Date(data.moveDate) : null,
        fromAddress: [data.fromStreet, data.fromPostalCode, data.fromCity].filter(Boolean).join(', '),
        toAddress: [data.toStreet, data.toPostalCode, data.toCity].filter(Boolean).join(', '),
        volumeM3: data.estimatedVolumeM3 ?? null,
        floorsFrom: data.floorsFrom ?? null,
        floorsTo: data.floorsTo ?? null,
        elevatorFrom: data.hasElevator ?? null,
        packingNeeded: data.packingService ?? null,
        heavyItems: Array.isArray(data.heavyItems) ? data.heavyItems.join(',') : null,
        notes: data.description ?? null,
      })

      await createLog({
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.create',
        message: 'Full quote submitted',
        data: { email: data.email },
        ip: ipFromHeaders(),
      })

      return createSuccessResult({ leadId: lead.id }, 'Kiitos! Tarjouspyyntö vastaanotettu.')
    },
    formData,
  )
}
