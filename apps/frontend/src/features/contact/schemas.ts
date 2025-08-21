/**
 * Contact form validation schemas
 */

import { z } from 'zod';

// Contact form schema
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Nimi tulee olla vähintään 2 merkkiä')
    .max(100, 'Nimi voi olla enintään 100 merkkiä'),

  email: z
    .string()
    .email('Anna kelvollinen sähköpostiosoite')
    .max(255, 'Sähköpostiosoite on liian pitkä'),

  phone: z
    .string()
    .min(6, 'Puhelinnumero tulee olla vähintään 6 merkkiä')
    .max(20, 'Puhelinnumero voi olla enintään 20 merkkiä')
    .regex(/^[+]?[\d\s\-()]+$/, 'Puhelinnumero sisältää virheellisiä merkkejä')
    .optional(),

  subject: z
    .string()
    .min(3, 'Aihe tulee olla vähintään 3 merkkiä')
    .max(200, 'Aihe voi olla enintään 200 merkkiä'),

  message: z
    .string()
    .min(10, 'Viesti tulee olla vähintään 10 merkkiä')
    .max(2000, 'Viesti voi olla enintään 2000 merkkiä'),

  // Optional fields
  company: z.string().max(100, 'Yrityksen nimi voi olla enintään 100 merkkiä').optional(),

  preferredContactMethod: z.enum(['email', 'phone', 'either']).optional(),

  // Marketing consent
  marketingConsent: z.boolean().optional(),
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

  firstName: z
    .string()
    .min(2, 'Etunimi on pakollinen')
    .max(50, 'Etunimi voi olla enintään 50 merkkiä')
    .optional(),

  interests: z
    .array(z.enum(['kotimuutto', 'yritysmuutto', 'pakkauspalvelu', 'varastointi', 'vinkit']))
    .optional(),

  // GDPR consent (required for newsletter)
  gdprConsent: z.boolean().refine((val) => val === true, 'Tietosuojasuostumus on pakollinen'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type QuickContactData = z.infer<typeof quickContactSchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;

// Field validation helpers
export const contactFieldValidators = {
  name: (value: string) => contactSchema.shape.name.safeParse(value),
  email: (value: string) => contactSchema.shape.email.safeParse(value),
  phone: (value: string) => contactSchema.shape.phone.safeParse(value),
  subject: (value: string) => contactSchema.shape.subject.safeParse(value),
  message: (value: string) => contactSchema.shape.message.safeParse(value),
};
