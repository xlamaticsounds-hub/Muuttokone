import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  
  console.log(`Found ${images.length} images to ingest.`);

  for (const imgPath of images) {
    const stats = fs.statSync(imgPath);
    const fileName = path.basename(imgPath);
    const ext = path.extname(imgPath).toLowerCase();
    const publicUrl = `/${imgPath.replace(/^public\//, '')}`;
    
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/avif';

    const existing = await prisma.image.findFirst({ where: { url: publicUrl } });

    if (existing) {
      await prisma.image.update({
        where: { id: existing.id },
        data: {
          name: fileName,
          size: stats.size,
          type: mimeType,
        }
      });
    } else {
      await prisma.image.create({
        data: {
          url: publicUrl,
          name: fileName,
          bucket: 'local-public',
          path: imgPath,
          type: mimeType,
          size: stats.size,
        },
      });
    }
    console.log(`Ingested: ${publicUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
