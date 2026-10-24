import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { readImagesFromForm, saveLeadAttachments } from '@/server/external-lead';
import { createLog } from '@/server/repo/logs';

export const runtime = 'nodejs';

/** Lisää keskustelun kuvia olemassa olevalle keikalle (multipart: images). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, message: 'Kirjaudu sisään.' }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return NextResponse.json({ success: false, message: 'Liidiä ei löytynyt.' }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Pyyntö ei kelpaa.' }, { status: 400 });
  }
  const images = await readImagesFromForm(form);
  if (!images.ok) return NextResponse.json({ success: false, message: images.message }, { status: 400 });
  if (images.images.length === 0) return NextResponse.json({ success: false, message: 'Valitse vähintään yksi kuva.' }, { status: 400 });

  try {
    const result = await saveLeadAttachments(id, images.images, session.user?.email ?? null);
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    await createLog({
      entityType: 'Lead',
      entityId: id,
      action: 'lead.attachments_added',
      message: `Keskustelun kuvia lisätty: ${result.saved}`,
      actorId: session.user?.email ?? null,
    }).catch(() => {});
    revalidatePath(`/hallinta/liidit/${id}`);
    return NextResponse.json({ success: true, saved: result.saved });
  } catch (error) {
    console.error('[liidit/liitteet] kuvien tallennus epäonnistui', error);
    return NextResponse.json({ success: false, message: 'Kuvien tallennus epäonnistui. Yritä uudelleen.' }, { status: 500 });
  }
}
