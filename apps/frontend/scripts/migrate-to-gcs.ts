import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 1. Setup DB
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 2. Setup GCS
const getStorageConfig = () => {
  const config: any = { projectId: process.env.GOOGLE_CLOUD_PROJECT || 'muuttokone' };
  
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

function getFiles(dir: string, files_: string[] = []) {
  if (!fs.existsSync(dir)) return files_;
  const files = fs.readdirSync(dir);
  for (const i in files) {
    const name = path.join(dir, files[i]);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

async function main() {
  const allFiles = getFiles('public');
  const targetExtensions = ['.webp', '.avif', '.png'];
  const images = allFiles.filter(f => targetExtensions.includes(path.extname(f).toLowerCase()));
  
  console.log(`🚀 Starting migration of ${images.length} images to GCS bucket: ${bucketName}...`);

  for (const imgPath of images) {
    try {
      const stats = fs.statSync(imgPath);
      const fileName = path.basename(imgPath);
      const ext = path.extname(imgPath).toLowerCase();
      const fileBuffer = fs.readFileSync(imgPath);
      
      // Define GCS path and public URL
      const gcsPath = `uploads/migrated-${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/avif';

      console.log(`Uploading: ${fileName}...`);

      // A. Upload to GCS
      const gcsFile = bucket.file(gcsPath);
      await gcsFile.save(fileBuffer, {
        metadata: { contentType: mimeType },
      });

      // B. Update Database (upsert by original filename/path proxy)
      // We look for any existing record with the local path to avoid duplicates
      const localUrlPath = `/${imgPath.replace(/^public\//, '')}`;
      const existing = await prisma.image.findFirst({ where: { url: localUrlPath } });

      if (existing) {
        await prisma.image.update({
          where: { id: existing.id },
          data: {
            url: publicUrl,
            path: gcsPath,
            bucket: bucketName,
            size: stats.size,
            type: mimeType,
          }
        });
      } else {
        await prisma.image.create({
          data: {
            url: publicUrl,
            name: fileName,
            bucket: bucketName,
            path: gcsPath,
            type: mimeType,
            size: stats.size,
          },
        });
      }
      console.log(`✅ Success: ${publicUrl}`);
    } catch (err: any) {
      console.error(`❌ Failed to migrate ${imgPath}:`, err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
