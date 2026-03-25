// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db'; // <- make sure you have the hot-reload-safe prisma client here
import { LeadStatus, LeadSource } from '@prisma/client';

// Force Node.js runtime (multipart + File)
export const runtime = 'nodejs';

/* ===================== Zod Schemas ===================== */

// Lead schema for API - matches the actual leads collection structure
const LeadSchema = z
  .object({
    id: z.string().optional(), // Allow updating existing lead
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
    // New fields
    square_meters: z.string().or(z.number()).optional(),
    floor: z.string().or(z.number()).optional(),
    has_elevator: z.string().or(z.boolean()).optional(),
    box_count: z.string().or(z.number()).optional(),
  })
  .passthrough(); // allow extra fields without failing

const SubmissionSchema = z.object({
  type: z.enum(['newsletter', 'lead', 'booking', 'message']),
  data: z.any(), // validated below per type
});

const MessageSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    message: z.string().min(1),
    source: z.string().optional(),
    ip: z.string().optional(),
    user_agent: z.string().optional(),
  })
  .passthrough();

/* ===================== Helpers ===================== */

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }
  return response.json();
}

function toDateOrNull(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function splitName(full?: string | null) {
  if (!full) return { firstName: null as string | null, lastName: null as string | null };
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? null;
  const last = parts.length > 1 ? parts.slice(1).join(' ') : null;
  return { firstName: first, lastName: last };
}

/** Upsert contact WITHOUT requiring unique email */
async function upsertContactLoose(input: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  companyName?: string | null;
  notes?: string | null;
  gdprConsent?: boolean;
  tags?: string[];
}) {
  const email = input.email?.trim().toLowerCase() ?? null;

  if (email) {
    const existing = await prisma.contact.findFirst({ where: { email } });
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
          tags:
            input.tags && input.tags.length > 0
              ? Array.from(new Set([...(existing.tags ?? []), ...input.tags]))
              : existing.tags,
        },
      });
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
  });
}

async function logEvent(params: {
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  data?: Record<string, any>;
  ip?: string | null;
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
  });
}
/* ===================== Submitters ===================== */

async function submitLead(data: z.infer<typeof LeadSchema>) {
  // Basic mapping from your lead payload to Prisma models
  const { firstName, lastName } = splitName(data.name ?? undefined);

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
  });

  const requestedDate = toDateOrNull(data.moving_date ?? undefined);
  const fromAddress = data.from_location ?? null;
  const toAddress = data.to_location ?? null;

  const source =
    (data.source?.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof LeadSource) || 'WEBSITE';
  const leadSource = LeadSource[source] ?? LeadSource.WEBSITE;

  // Optional: parse apartment size or volume
  const volumeM3 =
    typeof data.apartment_size === 'string'
      ? Number(String(data.apartment_size).replace(/[^\d.]/g, '')) || null
      : null;

  // Parse new fields
  const squareMeters = data.square_meters ? Number(data.square_meters) : null;
  const floor = data.floor ? Number(data.floor) : null;
  const boxCount = data.box_count ? Number(data.box_count) : null;
  
  let hasElevator: boolean | null = null;
  if (data.has_elevator !== undefined && data.has_elevator !== null) {
    if (typeof data.has_elevator === 'boolean') hasElevator = data.has_elevator;
    else if (data.has_elevator === 'yes' || data.has_elevator === 'true') hasElevator = true;
    else if (data.has_elevator === 'no' || data.has_elevator === 'false') hasElevator = false;
  }

  // Prepare data object for create/update
  const leadData = {
    contact: { connect: { id: contact.id } },
    status: LeadStatus.NEW,
    // If updating, we might not want to overwrite source if it's already set?
    // But for simplicity, we'll allow source update or keep it consistent.
    // source: leadSource, // Handled below
    formData: JSON.stringify({ kind: 'api-lead', payload: data }),
    requestedDate,
    fromAddress,
    toAddress,
    volumeM3,
    notes: data.message ?? null,
    squareMeters,
    floor,
    hasElevator,
    boxCount,
  };

  let lead;
  let action;

  if (data.id) {
    // UPDATE existing lead
    lead = await prisma.lead.update({
      where: { id: data.id },
      data: {
        ...leadData,
        // Only update source if provided? Or keep original?
        // Let's keep original source if it exists, or update if this is a "refinement"
        // For now, we won't force-update source on existing leads unless we want to track "re-conversion"
      },
    });
    action = 'lead.update';
  } else {
    // CREATE new lead
    lead = await prisma.lead.create({
      data: {
        ...leadData,
        source: leadSource,
      },
    });
    action = 'lead.create';
  }

  await logEvent({
    entityType: 'Lead',
    entityId: lead.id,
    action: action,
    message: `Lead ${action === 'lead.create' ? 'submitted' : 'updated'} via /api/submit`,
    data: { email: data.email ?? null, source: leadSource, ua: data.user_agent ?? null },
    ip: data.ip ?? null,
  });

  // Send Discord Notification
  const discordFields = [
    { name: 'Nimi', value: data.name || 'Ei nimeä', inline: true },
    { name: 'Puhelin', value: data.phone || 'Ei puhelinta', inline: true },
    { name: 'Sähköposti', value: data.email || 'Ei sähköpostia', inline: true },
    { name: 'Mistä', value: data.from_location || '-', inline: true },
    { name: 'Minne', value: data.to_location || '-', inline: true },
    { name: 'Muuttopäivä', value: data.moving_date || '-', inline: true },
    { name: 'Tyyppi', value: leadSource, inline: true },
  ];

  if (squareMeters) discordFields.push({ name: 'Pinta-ala', value: `${squareMeters} m²`, inline: true });
  if (floor !== null) discordFields.push({ name: 'Kerros', value: `${floor}`, inline: true });
  if (hasElevator !== null) discordFields.push({ name: 'Hissi', value: hasElevator ? 'Kyllä' : 'Ei', inline: true });
  if (boxCount) discordFields.push({ name: 'Laatikot', value: `${boxCount} kpl`, inline: true });

  if (data.message) {
    discordFields.push({ name: 'Lisätiedot', value: data.message, inline: false });
  }

  await sendDiscordNotification(`🚀 Uusi tarjouspyyntö (${action === 'lead.create' ? 'Uusi' : 'Päivitys'})`, discordFields);

  return { leadId: lead.id, contactId: contact.id };
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
    .safeParse(data);

  if (!parsed.success) {
    throw new Error('Newsletter requires a valid email');
  }

  const { email, name, phone } = parsed.data;
  const { firstName, lastName } = splitName(name);
  const contact = await upsertContactLoose({
    email,
    phone,
    firstName,
    lastName,
    gdprConsent: true,
    tags: ['newsletter'],
  });

  await logEvent({
    entityType: 'Contact',
    entityId: contact.id,
    action: 'newsletter.subscribe',
    message: 'Newsletter subscription recorded on Contact',
    data: { email },
  });

  // Send Discord Notification
  await sendDiscordNotification('📧 Uusi uutiskirjeen tilaaja', [
    { name: 'Sähköposti', value: email, inline: true },
    { name: 'Nimi', value: name || '-', inline: true },
  ]);

  return { contactId: contact.id };
}

async function submitBooking(data: any) {
  // Map calculator data to Lead schema
  const { firstName, lastName } = splitName(data.name || data.email?.split('@')[0]);

  const contact = await upsertContactLoose({
    email: data.email || null,
    phone: data.phone || null,
    firstName,
    lastName,
    gdprConsent: true,
    notes: `Varaus muuttolaskurin kautta. Asunnon koko: ${data.apartmentSize}, Pinta-ala: ${data.squareMeters || '?'}, Kerros: ${data.floorFrom} -> ${data.floorTo}`,
  });

  const requestedDate = toDateOrNull(data.date);
  
  const lead = await prisma.lead.create({
    data: {
      contact: { connect: { id: contact.id } },
      status: LeadStatus.SCHEDULED,
      source: LeadSource.STEP_FORM,
      formData: JSON.stringify(data),
      requestedDate,
      fromAddress: data.addressFrom,
      toAddress: data.addressTo,
      notes: `Hinta-arvio: ${data.price}€`,
      floor: data.floorFrom,
      hasElevator: data.elevatorFrom,
      boxCount: data.boxCount,
    },
  });

  await logEvent({
    entityType: 'Lead',
    entityId: lead.id,
    action: 'lead.booking',
    message: 'Booking created via /muuttolaskuri',
    data: { price: data.price },
  });

  // Discord Notification
  const discordFields = [
    { name: 'Nimi', value: data.name || '-', inline: true },
    { name: 'Puhelin', value: data.phone || '-', inline: true },
    { name: 'Sähköposti', value: data.email || '-', inline: true },
    { name: 'Hinta', value: `${data.price}€`, inline: true },
    { name: 'Päivä', value: data.date ? new Date(data.date).toLocaleDateString('fi-FI') : '-', inline: true },
    { name: 'Asunto', value: data.apartmentSize, inline: true },
    { name: 'Mistä', value: data.addressFrom || '-', inline: false },
    { name: 'Minne', value: data.addressTo || '-', inline: false },
  ];

  await sendDiscordNotification('📅 UUSI VARAUS (Muuttolaskuri)', discordFields);

  return { leadId: lead.id };
}

async function submitMessage(data: z.infer<typeof MessageSchema>) {
  const { firstName, lastName } = splitName(data.name);

  const contact = await upsertContactLoose({
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    firstName,
    lastName,
    notes: data.message,
    gdprConsent: true,
    tags: ['inbox-message'],
  });

  await logEvent({
    entityType: 'Contact',
    entityId: contact.id,
    action: 'inbox.message',
    message: 'Yhteydenottolomakkeen viesti vastaanotettu',
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      message: data.message,
      source: data.source ?? 'website_contact',
      user_agent: data.user_agent ?? null,
    },
    ip: data.ip ?? null,
  });

  await sendDiscordNotification('📥 Uusi yhteydenottoviesti', [
    { name: 'Nimi', value: data.name, inline: true },
    { name: 'Puhelin', value: data.phone || '-', inline: true },
    { name: 'Sähköposti', value: data.email || '-', inline: true },
    { name: 'Viesti', value: data.message, inline: false },
  ]);

  return { contactId: contact.id };
}

/* ===================== HTTP Handlers ===================== */

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();

      const type = formData.get('type') as string;
      const data: Record<string, any> = {};
      const files: File[] = [];

      for (const [key, value] of formData.entries()) {
        if (key === 'type') continue;
        if (value instanceof File) files.push(value);
        else data[key] = value;
      }

      // Upload files if present
      const uploadedFiles: string[] = [];
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          // Expecting { id: string }
          if (result?.id) uploadedFiles.push(result.id);
        } catch (err) {
          console.error('File upload error:', err);
        }
      }
      if (uploadedFiles.length > 0) data.files = uploadedFiles;

      body = { type, data };
    } else {
      body = await request.json();
    }

    // Attach server IP & UA for leads
    const forwarded =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip');
    const ip = forwarded ? String(forwarded).split(',')[0].trim() : undefined;
    const ua = request.headers.get('user-agent') || undefined;

    if (
      body &&
      ((body as any).type === 'lead' || (body as any).type === 'booking' || (body as any).type === 'message') &&
      (body as any).data &&
      typeof (body as any).data === 'object'
    ) {
      const d = (body as any).data as Record<string, any>;
      if (ip && !d.ip) d.ip = ip;
      if (ua && !d.user_agent) d.user_agent = ua;
    }

    const parsed = SubmissionSchema.parse(body);

    if (parsed.type === 'newsletter') {
      // No newsletter table: attach to Contact with "newsletter" tag
      await submitNewsletter(parsed.data);
      return NextResponse.json({ success: true, message: 'Newsletter subscription successful!' });
    }

    if (parsed.type === 'lead') {
      const leadData = LeadSchema.parse(parsed.data);
      const result = await submitLead(leadData);
      return NextResponse.json({
        success: true,
        message: 'Lead submission successful!',
        leadId: result.leadId,
      });
    }

    if (parsed.type === 'booking') {
      const result = await submitBooking(parsed.data);
      return NextResponse.json({
        success: true,
        message: 'Booking submission successful!',
        leadId: result.leadId,
      });
    }

    if (parsed.type === 'message') {
      const messageData = MessageSchema.parse(parsed.data);
      const result = await submitMessage(messageData);
      return NextResponse.json({
        success: true,
        message: 'Message submission successful!',
        contactId: result.contactId,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid submission type' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Submission error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error },
        { status: 400 },
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // In production, don't log the full stack trace to avoid PII leak, or use a proper logger
    console.error('Submission error');

    return NextResponse.json(
      { success: false, message: 'Internal server error', error: errorMessage },
      { status: 500 },
    );
  }
}

/* ===================== Notifications ===================== */

async function sendDiscordNotification(title: string, fields: { name: string; value: string; inline?: boolean }[]) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not defined. Skipping notification.');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: title,
            color: 5814783, // #58b9ff (Primary Blue-ish)
            fields: fields,
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Muuttokone Lead System',
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
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
  });
}
