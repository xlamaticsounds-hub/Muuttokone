import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { deleteImage } from '@/server/storage';
import { prisma } from '@/server/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await prisma.image.findUnique({ where: { id } });

  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  return NextResponse.json(image);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteImage(id);

  return NextResponse.json({ success: true });
}
