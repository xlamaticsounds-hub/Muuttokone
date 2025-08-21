/**
 * Contact form validation schemas
 */

import { z } from 'zod';

// Contact form schema - simplified to match current implementation
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Nimi tulee olla vähintään 2 merkkiä')
    .max(100, 'Nimi voi olla enintään 100 merkkiä'),

  message: z
    .string()
    .min(10, 'Viesti tulee olla vähintään 10 merkkiä')
    .max(2000, 'Viesti voi olla enintään 2000 merkkiä'),
});

// Quick contact schema (for simple contact forms)
export const quickContactSchema = z.object({
  name: z.string().min(2, 'Nimi on pakollinen'),
  email: z.string().email('Anna kelvollinen sähköpostiosoite'),
  message: z.string().min(10, 'Viesti on pakollinen'),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z
    .string()
    .email('Anna kelvollinen sähköpostiosoite')
    .max(255, 'Sähköpostiosoite on liian pitkä'),

  // GDPR consent (required for newsletter)
  gdprConsent: z.boolean().refine((val) => val === true, 'Tietosuojasuostumus on pakollinen'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type QuickContactData = z.infer<typeof quickContactSchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;

// Field validation helpers
export const contactFieldValidators = {
  name: (value: string) => contactSchema.shape.name.safeParse(value),
  message: (value: string) => contactSchema.shape.message.safeParse(value),
};
