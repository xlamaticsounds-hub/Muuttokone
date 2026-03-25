import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

// Re-using the logic from the script but as a secure API
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

function getFiles(dir: string, files_: string[] = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return files_;
  }
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Check multiple possible paths for the public folder
    const pathsToTry = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), '..', 'public'), // In some container setups
      '/app/public'
    ];

    let publicPath = '';
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        publicPath = p;
        break;
      }
    }

    if (!publicPath) throw new Error('Could not locate public directory');

    const allFiles = getFiles(publicPath);
    const targetExtensions = ['.webp', '.avif', '.png'];
    const images = allFiles.filter(f => targetExtensions.includes(path.extname(f).toLowerCase()));
    
    console.log(`🔍 Discovered ${images.length} images in ${publicPath}`);

    for (const imgPath of images) {
      const fileName = path.basename(imgPath);
      const ext = path.extname(imgPath).toLowerCase();
      const stats = fs.statSync(imgPath);
      const fileBuffer = fs.readFileSync(imgPath);
      
      const gcsPath = `uploads/migrated-${fileName.replace(/\s+/g, '-')}`;
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/avif';

      // 1. Upload
      const gcsFile = bucket.file(gcsPath);
      await gcsFile.save(fileBuffer, {
        metadata: { contentType: mimeType },
      });

      // 2. DB Update
      // Search by either the full local public path or the filename
      const localUrlPath = `/${imgPath.split('public/').pop()}`;
      
      const existing = await prisma.image.findFirst({ 
        where: { 
          OR: [
            { url: localUrlPath },
            { name: fileName, bucket: 'local-public' }
          ]
        } 
      });

      if (existing) {
        await prisma.image.update({
          where: { id: existing.id },
          data: { 
            url: publicUrl, 
            path: gcsPath, 
            bucket: bucketName,
            type: mimeType,
            size: stats.size
          }
        });
      } else {
        // Only create if it doesn't exist at all
        const alreadyInGcs = await prisma.image.findFirst({ where: { url: publicUrl } });
        if (!alreadyInGcs) {
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
      }
      results.push(publicUrl);
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.image.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
