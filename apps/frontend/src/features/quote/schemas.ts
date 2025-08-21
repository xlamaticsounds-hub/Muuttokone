/**
 * Quote form validation schemas
 */

import { z } from 'zod';

// Quote form schema with comprehensive validation
export const quoteSchema = z.object({
  // Personal information
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
    .regex(/^[+]?[\d\s\-()]+$/, 'Puhelinnumero sisältää virheellisiä merkkejä'),

  // Moving details
  fromAddress: z
    .string()
    .min(5, 'Lähtöosoite tulee olla vähintään 5 merkkiä')
    .max(200, 'Lähtöosoite voi olla enintään 200 merkkiä'),

  toAddress: z
    .string()
    .min(5, 'Määränpää tulee olla vähintään 5 merkkiä')
    .max(200, 'Määränpää voi olla enintään 200 merkkiä'),

  moveDate: z
    .string()
    .min(1, 'Valitse muuttopäivä')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Muuttopäivä ei voi olla menneisyydessä'),

  // Service options
  serviceType: z.enum(
    ['kotimuutto', 'yritysmuutto', 'pakkauspalvelu', 'varastointi', 'kansainvalinen', 'muu'],
    {
      errorMap: () => ({ message: 'Valitse palvelun tyyppi' }),
    },
  ),

  // Additional details
  apartmentSize: z
    .enum(['yksiö', '1h+k', '2h+k', '3h+k', '4h+k', 'talo', 'toimisto', 'varasto'])
    .optional(),

  hasElevator: z.boolean().optional(),
  packingService: z.boolean().optional(),

  description: z.string().max(1000, 'Kuvaus voi olla enintään 1000 merkkiä').optional(),

  // File uploads (if needed)
  attachments: z.array(z.string()).optional(),
});

// Quick quote schema (simplified version)
export const quickQuoteSchema = z.object({
  name: z.string().min(2, 'Nimi on pakollinen'),
  email: z.string().email('Anna kelvollinen sähköpostiosoite'),
  phone: z.string().min(6, 'Puhelinnumero on pakollinen'),
  fromAddress: z.string().min(5, 'Lähtöosoite on pakollinen'),
  toAddress: z.string().min(5, 'Määränpää on pakollinen'),
  moveDate: z.string().min(1, 'Muuttopäivä on pakollinen'),
  apartmentSize: z.enum(['yksiö', '1h+k', '2h+k', '3h+k', '4h+k', 'talo']),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;
export type QuickQuoteData = z.infer<typeof quickQuoteSchema>;

// Field validation helpers
export const quoteFieldValidators = {
  name: (value: string) => quoteSchema.shape.name.safeParse(value),
  email: (value: string) => quoteSchema.shape.email.safeParse(value),
  phone: (value: string) => quoteSchema.shape.phone.safeParse(value),
  fromAddress: (value: string) => quoteSchema.shape.fromAddress.safeParse(value),
  toAddress: (value: string) => quoteSchema.shape.toAddress.safeParse(value),
  moveDate: (value: string) => quoteSchema.shape.moveDate.safeParse(value),
};
