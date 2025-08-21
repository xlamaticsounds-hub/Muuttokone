/**
 * Form types - now imports from central schemas to avoid duplication
 */

import {
  contactSchema as contactFormSchema,
  newsletterSchema,
  type ContactFormData,
  type NewsletterData,
} from '@/lib/schemas';

// Re-export for backward compatibility
export { contactFormSchema, newsletterSchema };
export type { ContactFormData, NewsletterData };

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
