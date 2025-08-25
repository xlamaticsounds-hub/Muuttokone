// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/server/db' // <- make sure you have the hot-reload-safe prisma client here
import { LeadStatus, LeadSource } from '@prisma/client'

// Force Node.js runtime (multipart + File)
export const runtime = 'nodejs'

/* ===================== Zod Schemas ===================== */

// Lead schema for API - matches the actual leads collection structure
const LeadSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    from_location: z.string().nullable().optional(),
    to_location: z.string().nullable().optional(),
    apartment_size: z.string().nullable().optional(),
    moving_date: z.string().nullable().optional(), // ISO or YYYY-MM-DD; we’ll parse
    message: z.string().nullable().optional(),
    service_type: z.string().optional(),
    source: z.string().optional(),
    ip: z.string().optional(),
    user_agent: z.string().optional(),
    files: z.array(z.string()).optional(),
  })
  .passthrough() // allow extra fields without failing

const SubmissionSchema = z.object({
  type: z.enum(['newsletter', 'lead']),
  data: z.any(), // validated below per type
})

/* ===================== Helpers ===================== */

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('File upload failed')
  }
  return response.json()
}

function toDateOrNull(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function splitName(full?: string | null) {
  if (!full) return { firstName: null as string | null, lastName: null as string | null }
  const parts = full.trim().split(/\s+/)
  const first = parts[0] ?? null
  const last = parts.length > 1 ? parts.slice(1).join(' ') : null
  return { firstName: first, lastName: last }
}

/** Upsert contact WITHOUT requiring unique email */
async function upsertContactLoose(input: {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  street?: string | null
  postalCode?: string | null
  companyName?: string | null
  notes?: string | null
  gdprConsent?: boolean
  tags?: string[]
}) {
  const email = input.email?.trim().toLowerCase() ?? null

  if (email) {
    const existing = await prisma.contact.findFirst({ where: { email } })
    if (existing) {
      return prisma.contact.update({
        where: { id: existing.id },
        data: {
          phone: input.phone ?? existing.phone,
          firstName: input.firstName ?? existing.firstName,
          lastName: input.lastName ?? existing.lastName,
          city: input.city ?? existing.city,
          street: input.street ?? existing.street,
          postalCode: input.postalCode ?? existing.postalCode,
          companyName: input.companyName ?? existing.companyName,
          notes: input.notes ?? existing.notes,
          gdprConsentAt: input.gdprConsent ? new Date() : existing.gdprConsentAt,
          tags: input.tags && input.tags.length > 0 ? Array.from(new Set([...(existing.tags ?? []), ...input.tags])) : existing.tags,
        },
      })
    }
  }

  return prisma.contact.create({
    data: {
      email,
      phone: input.phone ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      city: input.city ?? null,
      street: input.street ?? null,
      postalCode: input.postalCode ?? null,
      companyName: input.companyName ?? null,
      notes: input.notes ?? null,
      gdprConsentAt: input.gdprConsent ? new Date() : null,
      tags: input.tags ?? [],
    },
  })
}

async function logEvent(params: {
  entityType: string
  entityId: string
  action: string
  message: string
  data?: Record<string, any>
  ip?: string | null
}) {
  return prisma.log.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      message: params.message,
      data: params.data ? JSON.stringify(params.data) : undefined,
      ip: params.ip ?? null,
    },
  })
}
/* ===================== Submitters ===================== */

async function submitLead(data: z.infer<typeof LeadSchema>) {
  // Basic mapping from your lead payload to Prisma models
  const { firstName, lastName } = splitName(data.name ?? undefined)

  const contact = await upsertContactLoose({
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    firstName,
    lastName,
    // If you collect granular address in other fields, map them in:
    // city: data.from_city ?? null,
    // street: data.from_street ?? null,
    // postalCode: data.from_postal ?? null,
    notes: data.message ?? undefined,
    gdprConsent: true,
  })

  const requestedDate = toDateOrNull(data.moving_date ?? undefined)
  const fromAddress = data.from_location ?? null
  const toAddress = data.to_location ?? null

  const source =
    (data.source?.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof LeadSource) || 'WEBSITE'
  const leadSource = LeadSource[source] ?? LeadSource.WEBSITE

  // Optional: parse apartment size or volume
  const volumeM3 =
    typeof data.apartment_size === 'string'
      ? Number(String(data.apartment_size).replace(/[^\d.]/g, '')) || null
      : null

  const lead = await prisma.lead.create({
    data: {
      contact: { connect: { id: contact.id } },
      status: LeadStatus.NEW,
      source: leadSource,
      formData: JSON.stringify({ kind: 'api-lead', payload: data }),
      requestedDate,
      fromAddress,
      toAddress,
      volumeM3,
      notes: data.message ?? null,
      // If you collect packing/elevator/etc in future forms, map them here.
    },
  })

  await logEvent({
    entityType: 'Lead',
    entityId: lead.id,
    action: 'lead.create',
    message: 'Lead submitted via /api/submit',
    data: { email: data.email ?? null, source: leadSource, ua: data.user_agent ?? null },
    ip: data.ip ?? null,
  })

  return { leadId: lead.id, contactId: contact.id }
}

/**
 * No newsletter table: store/merge email into Contact with a "newsletter" tag.
 * This keeps your endpoint functional and your db clean.
 */
async function submitNewsletter(data: any) {
  const parsed = z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .passthrough()
    .safeParse(data)

  if (!parsed.success) {
    throw new Error('Newsletter requires a valid email')
  }

  const { email, name, phone } = parsed.data
  const { firstName, lastName } = splitName(name)
  const contact = await upsertContactLoose({
    email,
    phone,
    firstName,
    lastName,
    gdprConsent: true,
    tags: ['newsletter'],
  })

  await logEvent({
    entityType: 'Contact',
    entityId: contact.id,
    action: 'newsletter.subscribe',
    message: 'Newsletter subscription recorded on Contact',
    data: { email },
  })

  return { contactId: contact.id }
}

/* ===================== HTTP Handlers ===================== */

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()

      const type = formData.get('type') as string
      const data: Record<string, any> = {}
      const files: File[] = []

      for (const [key, value] of formData.entries()) {
        if (key === 'type') continue
        if (value instanceof File) files.push(value)
        else data[key] = value
      }

      // Upload files if present
      const uploadedFiles: string[] = []
      for (const file of files) {
        try {
          const result = await uploadFile(file)
          // Expecting { id: string }
          if (result?.id) uploadedFiles.push(result.id)
        } catch (err) {
          console.error('File upload error:', err)
        }
      }
      if (uploadedFiles.length > 0) data.files = uploadedFiles

      body = { type, data }
    } else {
      body = await request.json()
    }

    // Attach server IP & UA for leads
    const forwarded =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip')
    const ip = forwarded ? String(forwarded).split(',')[0].trim() : undefined
    const ua = request.headers.get('user-agent') || undefined

    if (body && (body as any).type === 'lead' && (body as any).data && typeof (body as any).data === 'object') {
      const d = (body as any).data as Record<string, any>
      if (ip && !d.ip) d.ip = ip
      if (ua && !d.user_agent) d.user_agent = ua
    }

    const parsed = SubmissionSchema.parse(body)

    if (parsed.type === 'newsletter') {
      // No newsletter table: attach to Contact with "newsletter" tag
      await submitNewsletter(parsed.data)

      // Revalidate any tags you use in your app (arbitrary strings)
      revalidateTag('contacts:list')

      return NextResponse.json({ success: true, message: 'Newsletter subscription successful!' })
    }

    if (parsed.type === 'lead') {
      const leadData = LeadSchema.parse(parsed.data)
      await submitLead(leadData)

      revalidateTag('leads:list')
      return NextResponse.json({ success: true, message: 'Lead submission successful!' })
    }

    return NextResponse.json({ success: false, message: 'Invalid submission type' }, { status: 400 })
  } catch (error) {
    console.error('Submission error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 },
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Detailed error:', { message: errorMessage, stack: errorStack })

    return NextResponse.json(
      { success: false, message: 'Internal server error', error: errorMessage },
      { status: 500 },
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      newsletter: 'POST /api/submit with type: "newsletter"',
      lead: 'POST /api/submit with type: "lead"',
    },
  })
}
