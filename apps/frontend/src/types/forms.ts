/**
 * Form types - now imports from central schemas to avoid duplication
 */

import {
  contactSchema as contactFormSchema,
  type ContactFormData,
} from '@/lib/schemas';

// Re-export for backward compatibility
export { contactFormSchema };
export type { ContactFormData };

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
