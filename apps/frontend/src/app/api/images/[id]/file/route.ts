import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { Storage } from '@google-cloud/storage';

const getStorageConfig = () => {
  const config: any = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'muuttokone',
  };
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    config.credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
  } else if (process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT) {
    config.clientOptions = {
      impersonatedServiceAccount: process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT,
    };
  }
  return config;
};

const storage = new Storage(getStorageConfig());
const bucketName = 'muuttokone.fi';
const bucket = storage.bucket(bucketName);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image || !image.path || image.bucket === 'local-public') {
      return NextResponse.json({ error: 'Not found or not in GCS' }, { status: 404 });
    }

    const file = bucket.file(image.path);
    const [exists] = await file.exists();
    
    if (!exists) return NextResponse.json({ error: 'File not found in GCS' }, { status: 404 });

    const [metadata] = await file.getMetadata();
    const stream = file.createReadStream();

    // @ts-ignore
    return new Response(stream, {
      headers: {
        'Content-Type': metadata.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
