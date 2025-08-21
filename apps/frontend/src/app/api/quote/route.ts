import { NextResponse } from 'next/server';
import { DIRECTUS_URL } from '@/lib/directus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuoteData = {
  name: string;
  email?: string;
  phone?: string;
  from?: string;
  to?: string;
  size?: string;
  date?: string;
  dateFlex?: 'exact' | '+/-3' | '+/-7';
  services?: string[];
  inventory?: string;
  elevator?: boolean;
  distance?: string;
  notes?: string;
  isBusiness?: boolean;
  businessId?: string;
  contactNotes?: string;
  fromExtra?: string;
  toExtra?: string;
};

async function uploadFilesToDirectus(files: File[], token?: string): Promise<string[]> {
  const ids: string[] = [];
  for (const f of files) {
    const fd = new FormData();
    // Directus expects key 'file'
    fd.append('file', f, (f as any).name || 'attachment.jpg');
    const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd as any,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`File upload failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as any;
    const id = json?.data?.id || json?.id;
    if (id) ids.push(id);
  }
  return ids;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    const form = await req.formData();
    const payloadRaw = form.get('payload');
    if (!payloadRaw || typeof payloadRaw !== 'string') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    let data: QuoteData;
    try {
      data = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!data.name || !(data.email || data.phone)) {
      return NextResponse.json(
        { error: 'Name and at least one contact (email or phone) required' },
        { status: 400 },
      );
    }

    // Collect files
    const files: File[] = [];
    const images = form.getAll('images');
    for (const it of images) {
      if (it instanceof File) files.push(it);
    }

    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
      // We can still accept submission but cannot persist to Directus securely
      return NextResponse.json(
        { error: 'Missing DIRECTUS_STATIC_TOKEN on server' },
        { status: 500 },
      );
    }

    // Upload attachments first (optional)
    let attachmentIds: string[] = [];
    if (files.length > 0) {
      attachmentIds = await uploadFilesToDirectus(files, token);
    }

    // Create a lead item in Directus
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ua = req.headers.get('user-agent') || '';

    const leadBody: any = {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      from: data.from ?? null,
      to: data.to ?? null,
      size: data.size ?? null,
      date: data.date ?? null,
      dateFlex: data.dateFlex ?? null,
      services: data.services ?? [],
      inventory: data.inventory ?? null,
      elevator: typeof data.elevator === 'boolean' ? data.elevator : null,
      distance: data.distance ?? null,
      notes: data.notes ?? null,
      isBusiness: typeof data.isBusiness === 'boolean' ? data.isBusiness : null,
      businessId: data.businessId ?? null,
      contactNotes: data.contactNotes ?? null,
      fromExtra: data.fromExtra ?? null,
      toExtra: data.toExtra ?? null,
      submittedAt: new Date().toISOString(),
      meta: { ip, ua },
    };
    if (attachmentIds.length > 0) leadBody.attachments = attachmentIds;

    const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/items/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadBody),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: `Directus error: ${res.status} ${text}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
