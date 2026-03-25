import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import path from 'path';
import { helpers, PredictionServiceClient } from '@google-cloud/aiplatform';

const getStorageConfig = () => {
  const config: any = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'muuttokone',
  };

  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      config.credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error('❌ Failed to parse GCP_SERVICE_ACCOUNT_KEY JSON');
    }
  } else if (process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT) {
    config.clientOptions = {
      impersonatedServiceAccount: process.env.GCP_IMPERSONATE_SERVICE_ACCOUNT,
    };
  }
  return config;
};

// Vertex AI Config
const location = 'us-central1'; // Imagen is highly available here
const modelId = 'imagegeneration@006';
const aiConfig = getStorageConfig();
const predictionServiceClient = new PredictionServiceClient({
  ...aiConfig,
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
});

const storage = new Storage(getStorageConfig());
const bucketName = 'muuttokone.fi';
const bucket = storage.bucket(bucketName);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // #TODO not working fix
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  try {
    // 1. Fetch metadata and file from GCS
    const imageRecord = await prisma.image.findUnique({ where: { id } });
    if (!imageRecord) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    const [fileBuffer] = await bucket.file(imageRecord.path).download();
    console.log(`📸 Processing image: ${imageRecord.name} (Action: ${action})`);
    
    let processedBuffer: Buffer;
    let newMimeType = imageRecord.type;
    let newExtension = '';

    // 2. Process
    if (action === 'compress') {
      processedBuffer = await sharp(fileBuffer)
        .webp({ quality: 80 })
        .toBuffer();
      newMimeType = 'image/webp';
      newExtension = '.webp';
    } else if (action === 'upscale') {
      console.log(`🧠 Calling Vertex AI Imagen for generative upscaling...`);
      
      // Convert to Base64 for the API
      const base64Image = fileBuffer.toString('base64');

      const endpoint = `projects/${aiConfig.projectId}/locations/${location}/publishers/google/models/${modelId}`;
      const instance = {
        image: {
          bytesBase64Encoded: base64Image,
        },
      };
      const parameters = {
        upscaleConfig: {
          upscaleFactor: 'x2', // 2x upscale
        },
      };

      const request = {
        endpoint,
        instances: [helpers.toValue(instance)!],
        parameters: helpers.toValue(parameters),
      };

      const [response] = await predictionServiceClient.predict(request);
      
      if (!response.predictions || response.predictions.length === 0) {
        throw new Error('Vertex AI prediction failed to return an image.');
      }

      // Extract the result (it comes as a protobuf structure)
      const result: any = helpers.fromValue(response.predictions[0] as any);
      const outputBase64 = result.bytesBase64Encoded;
      processedBuffer = Buffer.from(outputBase64, 'base64');
      
      console.log(`✨ AI Upscale complete. New buffer size: ${processedBuffer.length} bytes`);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 3. Upload processed version back to GCS
    const timestamp = Date.now();
    const fileNameWithoutExt = imageRecord.name.split('.')[0];
    const newPath = `uploads/proc-${timestamp}-${fileNameWithoutExt}${newExtension || path.extname(imageRecord.name)}`;
    
    const newFile = bucket.file(newPath);
    await newFile.save(processedBuffer, {
      metadata: { 
        contentType: newMimeType,
        cacheControl: 'public, max-age=31536000, immutable'
      },
    });

    const newUrl = `https://storage.googleapis.com/${bucketName}/${newPath}`;
    console.log(`✅ Uploaded processed file to: ${newPath}`);

    // 4. Update Database
    const updatedImage = await prisma.image.update({
      where: { id },
      data: {
        url: newUrl,
        path: newPath,
        type: newMimeType,
        size: processedBuffer.length,
      },
    });

    return NextResponse.json(updatedImage);
  } catch (error: any) {
    console.error('Image processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}