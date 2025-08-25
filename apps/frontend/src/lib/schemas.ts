/**
 * Central export for form schemas — lightweight barrel that re-exports
 * existing feature-level schemas. Keeps imports consistent while we
 * consolidate later.
 */

export {
  contactSchema,
  quickContactSchema,
  type ContactFormData,
  type QuickContactData,
} from '@/features/contact/schemas';

// Also export shared helpers if needed in future
export * from '@/lib/form-helpers';
