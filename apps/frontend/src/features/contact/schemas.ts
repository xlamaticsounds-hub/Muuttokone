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

  email: z
    .string()
    .email('Anna kelvollinen sähköpostiosoite')
    .max(255, 'Sähköpostiosoite on liian pitkä')
    .optional(),

  phone: z
    .string()
    .min(6, 'Puhelinnumero tulee olla vähintään 6 merkkiä')
    .max(20, 'Puhelinnumero voi olla enintään 20 merkkiä')
    .regex(/^[+]?[\d\s\-()]+$/, 'Puhelinnumero sisältää virheellisiä merkkejä')
    .optional(),

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


export type ContactFormData = z.infer<typeof contactSchema>;
export type QuickContactData = z.infer<typeof quickContactSchema>;

// Field validation helpers
export const contactFieldValidators = {
  name: (value: string) => contactSchema.shape.name.safeParse(value),
  email: (value: string) => contactSchema.shape.email.safeParse(value),
  phone: (value: string) => contactSchema.shape.phone.safeParse(value),
  message: (value: string) => contactSchema.shape.message.safeParse(value),
};
