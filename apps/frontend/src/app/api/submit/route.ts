import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { newsletterSchema } from '@/lib/schemas';

// Lead schema for API - matches the actual leads collection structure
const LeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  from_location: z.string().nullable().optional(),
  to_location: z.string().nullable().optional(),
  apartment_size: z.string().nullable().optional(),
  moving_date: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  service_type: z.string().optional(),
  source: z.string().optional(),
  ip: z.string().optional(),
  user_agent: z.string().optional(),
  files: z.array(z.string()).optional(),
}).passthrough(); // Allow additional fields

const SubmissionSchema = z.object({
  type: z.enum(['newsletter', 'lead']),
  data: z.any(), // Allow any data structure, validate based on type later
});

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  const result = await response.json();
  return result;
};

const submitLead = async () => {
  // setup with prisma
  return;
};

const submitNewsletter = async () => {
  // setup with prisma
  return;
};

export async function POST(request: NextRequest) {
  try {
    // Parse form data or JSON
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract form fields
      const type = formData.get('type') as string;
      const data: any = {};
      const files: File[] = [];
      
      for (const [key, value] of formData.entries()) {
        if (key === 'type') continue;
        if (value instanceof File) {
          files.push(value);
        } else {
          data[key] = value;
        }
      }
      
      // Upload files if present
      const uploadedFiles = [];
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          uploadedFiles.push(result.id);
        } catch (error) {
          console.error('File upload error:', error);
        }
      }
      
      if (uploadedFiles.length > 0) {
        data.files = uploadedFiles;
      }
      
      body = { type, data };
    } else {
      body = await request.json();
    }

    // Validate the submission
    // For lead submissions, attach server-side IP and user-agent before parsing
    if (body && body.type === 'lead' && body.data && typeof body.data === 'object') {
      const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip');
      const ip = forwarded ? String(forwarded).split(',')[0].trim() : undefined;
      const ua = request.headers.get('user-agent') || undefined;
      // Ensure we don't overwrite client-provided values unless missing
      if (ip) (body.data as any).ip = (body.data as any).ip || ip;
      if (ua) (body.data as any).user_agent = (body.data as any).user_agent || ua;
    }

    const validatedData = SubmissionSchema.parse(body);
    
    // Handle based on type
    if (validatedData.type === 'newsletter') {
  newsletterSchema.parse(validatedData.data);
  await submitNewsletter();
      
      // Revalidate newsletter-related caches
      revalidateTag('collection:newsletter_email_addresses');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Newsletter subscription successful!' 
      });
      
    } else if (validatedData.type === 'lead') {
      // Validate lead data with more flexible schema
  LeadSchema.parse(validatedData.data);
  await submitLead();

      // Revalidate lead-related caches
      revalidateTag('collection:leads');

      return NextResponse.json({
        success: true,
        message: 'Lead submission successful!'
      });

    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid submission type' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }
    
    // More detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Detailed error:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: errorMessage // Include error message in response for debugging
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      newsletter: 'POST /api/submit with type: "newsletter"',
      lead: 'POST /api/submit with type: "lead"'
    }
  });
}
