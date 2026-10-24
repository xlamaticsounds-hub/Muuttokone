import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { createExternalLead, readImagesFromForm } from '@/server/external-lead';
import { normalizeExternalLeadInput } from '@/lib/external-lead';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';

export const runtime = 'nodejs';

/** Luo muualta tulleen keikan (multipart: payload = JSON, images = kuvat). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, message: 'Kirjaudu sisään.' }, { status: 401 });

  let form: FormData;
  let payload: unknown;
  try {
    form = await req.formData();
    payload = JSON.parse(String(form.get('payload') ?? '{}'));
  } catch {
    return NextResponse.json({ success: false, message: 'Pyyntö ei kelpaa.' }, { status: 400 });
  }

  const input = normalizeExternalLeadInput(payload, toHelsinkiDateInput(new Date()));
  if (!input.ok) return NextResponse.json({ success: false, message: input.message }, { status: 400 });
  const images = await readImagesFromForm(form);
  if (!images.ok) return NextResponse.json({ success: false, message: images.message }, { status: 400 });

  try {
    const { leadId, attachmentError } = await createExternalLead(input.value, images.images, session.user?.email ?? null);
    return NextResponse.json({ success: true, leadId, warning: attachmentError });
  } catch (error) {
    console.error('[keikka-muualta] keikan luonti epäonnistui', error);
    return NextResponse.json({ success: false, message: 'Keikan tallennus epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }
}
