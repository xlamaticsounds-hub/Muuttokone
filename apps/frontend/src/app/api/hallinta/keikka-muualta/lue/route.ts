import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { extractLeadFromConversation, isAiConfigured, readImagesFromForm } from '@/server/external-lead';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TEXT = 20_000;

/** Tekoäly lukee keskustelun kuvat ja muistiinpanot ja palauttaa lomakkeen esitäytön. Mitään ei tallenneta. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, message: 'Kirjaudu sisään.' }, { status: 401 });
  if (!isAiConfigured()) {
    return NextResponse.json({ success: false, message: 'Tekoäly ei ole käytössä palvelimella. Täytä tiedot käsin.' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Pyyntö ei kelpaa.' }, { status: 400 });
  }
  const text = String(form.get('text') ?? '').slice(0, MAX_TEXT);
  const images = await readImagesFromForm(form);
  if (!images.ok) return NextResponse.json({ success: false, message: images.message }, { status: 400 });
  if (!text.trim() && images.images.length === 0) {
    return NextResponse.json({ success: false, message: 'Lisää kuva tai kirjoita muistiinpano keskustelusta.' }, { status: 400 });
  }

  try {
    const data = await extractLeadFromConversation(text, images.images);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[keikka-muualta/lue] tekoälyn luku epäonnistui', error);
    return NextResponse.json({ success: false, message: 'Tekoäly ei saanut keskustelua luettua. Yritä uudelleen tai täytä tiedot käsin.' }, { status: 502 });
  }
}
