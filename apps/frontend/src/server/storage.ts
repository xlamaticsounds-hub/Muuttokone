import { Storage } from '@google-cloud/storage';
import { prisma } from '@/server/db';
import path from 'path';

const getStorageConfig = () => {
  const config: any = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'muuttokone',
  };

  // 1. Support for JSON Key (Existing)
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      config.credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error('❌ Failed to parse GCP_SERVICE_ACCOUNT_KEY JSON');
    }
  } 
  // 2. Support for Impersonation (New)
  else if (process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT) {
    // Note: This requires the user to be logged in via 'gcloud auth application-default login'
    // and have 'roles/iam.serviceAccountTokenCreator' on the target service account.
    config.clientOptions = {
      impersonatedServiceAccount: process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT,
    };
    console.log(`👤 Using impersonation for: ${process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT}`);
  }

  return config;
};

const storage = new Storage(getStorageConfig());
const bucketName = 'muuttokone.fi';
const bucket = storage.bucket(bucketName);

export async function uploadImage(file: Buffer, fileName: string, mimeType: string) {
  try {
    const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const gcsFile = bucket.file(`uploads/${uniqueName}`);

    // 1. Upload to GCS
    await gcsFile.save(file, {
      metadata: { contentType: mimeType },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/uploads/${uniqueName}`;

    // 2. Store metadata in PostgreSQL
    const image = await prisma.image.create({
      data: {
        url: publicUrl,
        name: fileName,
        bucket: bucketName,
        path: `uploads/${uniqueName}`,
        type: mimeType,
        size: file.length,
      },
    });

    return image;
  } catch (error: any) {
    if (error.code === 401) {
      console.error('❌ GCS Auth Error: Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud.');
    }
    throw error;
  }
}

export async function deleteImage(id: string) {
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return;

  // Delete from GCS
  try {
    await bucket.file(image.path).delete();
  } catch (error) {
    console.error('Failed to delete file from GCS:', error);
  }

  // Delete from DB
  await prisma.image.delete({ where: { id } });
}
