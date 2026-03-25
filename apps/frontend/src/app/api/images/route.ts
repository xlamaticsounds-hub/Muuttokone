import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { uploadImage } from '@/server/storage';
import { prisma } from '@/server/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Security: Only authorized admins can upload
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json(image);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const images = await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(images);
}
