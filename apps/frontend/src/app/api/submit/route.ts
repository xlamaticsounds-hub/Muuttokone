import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitNewsletter, submitLead, uploadFile, createQuote, createDirectusItem } from '@/lib/directus';
import { revalidateTag } from 'next/cache';
import { newsletterSchema } from '@/lib/schemas';

// Simplified lead schema for API - keep minimal for flexibility
const LeadSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  service_type: z.string().optional(),
  moving_date: z.string().optional(),
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  apartment_size: z.string().optional(),
  source: z.string().optional(),
  ip: z.string().optional(),
  user_agent: z.string().optional(),
  files: z.array(z.string()).optional(),
  utm_campaign: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
});

const SubmissionSchema = z.object({
  type: z.enum(['newsletter', 'lead', 'quote']),
  data: z.union([newsletterSchema, LeadSchema, z.any()]),
});

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
    if (body && (body.type === 'lead' || body.type === 'quote') && body.data && typeof body.data === 'object') {
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
      const newsletterData = newsletterSchema.parse(validatedData.data);
      await submitNewsletter(newsletterData);
      
      // Revalidate newsletter-related caches
      revalidateTag('collection:newsletter_email_addresses');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Newsletter subscription successful!' 
      });
      
    } else if (validatedData.type === 'lead') {
  const leadData = LeadSchema.parse(validatedData.data);
  // submitLead expects email: string; provide empty fallback
  await submitLead({ ...leadData, email: leadData.email ?? '' });

      // Revalidate lead-related caches
      revalidateTag('collection:leads');

      return NextResponse.json({
        success: true,
        message: 'Lead submission successful!'
      });

    } else if (validatedData.type === 'quote') {
      // Expect data to include minimal contact fields and a `quote` JSON string
      const payload = validatedData.data as any;

      // Create minimal lead record (name, email, phone)
      const leadPayload: any = {
        name: payload.name || null,
        email: payload.email || null,
        phone: payload.phone || null,
        status: 'new',
        created_at: new Date().toISOString(),
      };

      const leadResult = await createDirectusItem('leads', leadPayload);
      const leadId = leadResult?.id;

      // Build quote record and persist with helper
      await createQuote({
        lead_id: leadId || null,
        quote: typeof payload.quote === 'string' ? payload.quote : JSON.stringify(payload.quote || {}),
        files: Array.isArray(payload.files) ? payload.files : undefined,
        source: payload.source || 'website',
      });

      // Revalidate caches
      revalidateTag('collection:leads');
      revalidateTag('collection:quotes');

      return NextResponse.json({ success: true, message: 'Quote submitted successfully!' });
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
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
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
  lead: 'POST /api/submit with type: "lead"',
  quote: 'POST /api/submit with type: "quote" (creates lead + quote)'
    }
  });
}
