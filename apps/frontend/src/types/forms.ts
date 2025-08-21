/**
 * Form types - now imports from central schemas to avoid duplication
 */

import {
  quoteSchema as quoteFormSchema,
  contactSchema as contactFormSchema,
  newsletterSchema,
  type QuoteFormData,
  type ContactFormData,
  type NewsletterData,
} from '@/lib/schemas';

// Re-export for backward compatibility
export { quoteFormSchema, contactFormSchema, newsletterSchema };
export type { QuoteFormData, ContactFormData, NewsletterData };

// Form submission states
export type FormSubmissionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message?: string }
  | { status: 'error'; error: string };

// Common form field props
export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}
