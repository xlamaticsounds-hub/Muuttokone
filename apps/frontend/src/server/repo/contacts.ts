// src/server/repo/contacts.ts
import { prisma } from '@/server/db'

export async function upsertContactByEmail(input: {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  companyName?: string | null
  city?: string | null
  street?: string | null
  postalCode?: string | null
  gdprConsent?: boolean
  notes?: string | null
}) {
  const { email, ...rest } = input
  if (email) {
    const existing = await prisma.contact.findFirst({ where: { email } });
    if (existing) {
      return prisma.contact.update({
        where: { id: existing.id },
        data: {
          ...rest,
          gdprConsentAt: input.gdprConsent ? new Date() : undefined,
        },
      });
    }
    return prisma.contact.create({
      data: {
        email,
        ...rest,
        gdprConsentAt: input.gdprConsent ? new Date() : null,
      },
    });
  }
  // No email? create a contact with phone only
  return prisma.contact.create({
    data: {
      email: null,
      phone: input.phone ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      companyName: input.companyName ?? null,
      city: input.city ?? null,
      street: input.street ?? null,
      postalCode: input.postalCode ?? null,
      gdprConsentAt: input.gdprConsent ? new Date() : null,
      notes: input.notes ?? null,
    },
  })
}
