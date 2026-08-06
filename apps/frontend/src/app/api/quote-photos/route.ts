import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/server/storage';
import { rateLimit } from '@/server/rate-limit';

// Force Node.js runtime (multipart + File)
export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

// Julkinen (ei kirjautumista vaativa) reitti — asiakas lataa kuvia muuttolaskurissa
// ennen kuin liidiä edes on olemassa. Siksi validointi ja rajoitus tehdään tässä eikä
// luoteta client-puolen pakkaukseen (joku voisi kutsua reittiä suoraan ohi selaimen).
export async function POST(request: NextRequest) {
  const forwardedFor =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip');
  const requestIp = forwardedFor ? String(forwardedFor).split(',')[0].trim() : 'unknown';

  try {
    await rateLimit(requestIp, 'quote_photo_upload', 20, 15);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Liikaa pyyntöjä.' },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tiedostoa ei löytynyt.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tiedostotyyppiä ei tueta. Sallitut: JPEG, PNG, WebP, HEIC.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Tiedosto on liian suuri (max 8 Mt).' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json({ id: image.id, url: image.url });
  } catch (error) {
    console.error('quote-photos upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kuvan lataus epäonnistui.' },
      { status: 500 },
    );
  }
}
