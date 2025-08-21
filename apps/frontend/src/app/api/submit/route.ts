import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitNewsletter, submitLead, uploadFile } from '@/lib/directus';
import { revalidateTag } from 'next/cache';

// Validation schemas
const NewsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
});

const LeadSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  utm_campaign: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
});

const SubmissionSchema = z.object({
  type: z.enum(['newsletter', 'lead']),
  data: z.union([NewsletterSchema, LeadSchema]),
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
    const validatedData = SubmissionSchema.parse(body);
    
    // Handle based on type
    if (validatedData.type === 'newsletter') {
      const newsletterData = NewsletterSchema.parse(validatedData.data);
      await submitNewsletter(newsletterData);
      
      // Revalidate newsletter-related caches
      revalidateTag('collection:newsletter_email_addresses');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Newsletter subscription successful!' 
      });
      
    } else if (validatedData.type === 'lead') {
      const leadData = LeadSchema.parse(validatedData.data);
      await submitLead(leadData);
      
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
      lead: 'POST /api/submit with type: "lead"'
    }
  });
}
