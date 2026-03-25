import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. List files in GCS
    const [files] = await bucket.getFiles({ prefix: 'uploads/' });
    console.log(`🔍 Found ${files.length} files in GCS bucket: ${bucketName}`);

    const synced = [];

    for (const file of files) {
      if (file.name.endsWith('/')) continue; // Skip folders

      const [metadata] = await file.getMetadata();
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
      
      // 2. Search and Update
      const existing = await prisma.image.findFirst({ where: { url: publicUrl } });

      if (existing) {
        const updated = await prisma.image.update({
          where: { id: existing.id },
          data: {
            path: file.name,
            bucket: bucketName,
            size: parseInt(metadata.size as string) || 0,
            type: metadata.contentType || 'image/webp',
          }
        });
        synced.push(updated);
      } else {
        const created = await prisma.image.create({
          data: {
            url: publicUrl,
            name: file.name.split('/').pop() || 'unnamed',
            bucket: bucketName,
            path: file.name,
            type: metadata.contentType || 'image/webp',
            size: parseInt(metadata.size as string) || 0,
          }
        });
        synced.push(created);
      }
    }

    return NextResponse.json({ success: true, count: synced.length });
  } catch (error: any) {
    console.error('GCS Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
