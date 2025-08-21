/**
 * Form types inferred from Zod schemas
 * This file contains form validation schemas and their inferred types
 */

import { z } from 'zod';

// Quote form schema
export const quoteFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
  moveDate: z.string().min(1, 'Please select a move date'),
  fromAddress: z.string().min(5, 'Please enter your current address'),
  toAddress: z.string().min(5, 'Please enter your destination address'),
  moveSize: z.enum([
    'studio',
    'one_bedroom',
    'two_bedroom',
    'three_bedroom',
    'four_bedroom',
    'house',
  ]),
  additionalServices: z.array(z.string()).optional(),
  message: z.string().optional(),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Inferred types
export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;

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
