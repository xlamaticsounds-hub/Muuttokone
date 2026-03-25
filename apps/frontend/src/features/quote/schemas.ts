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
    ['kotimuutto', 'yritysmuutto', 'pakkauspalvelu', 'varastointi', 'kansainvalinen', 'muu'] as const,
    {
      message: 'Valitse palvelun tyyppi',
    },
  ),

  // Additional details
  apartmentSize: z
    .enum(['yksiö', '1h+k', '2h+k', '3h+k', '4h+k', 'talo', 'toimisto', 'varasto'])
    .optional(),

  // Apartment specifications
  squareMeters: z
    .number()
    .min(5, 'Pinta-ala tulee olla vähintään 5 m²')
    .max(10000, 'Pinta-ala ei voi olla enemmän kuin 10000 m²')
    .optional(),

  hasElevator: z.boolean().optional(),

  floor: z
    .number()
    .min(0, 'Kerros ei voi olla negatiivinen')
    .max(100, 'Kerros ei voi olla enemmän kuin 100')
    .optional(),

  obstacles: z
    .array(z.enum(['kapea-portaikko', 'ei-hissia', 'korkeat-portaat', 'ahtaat-huoneet', 'muu']))
    .optional(),

  otherObstacles: z.string().max(500, 'Muut esteet voivat olla enintään 500 merkkiä').optional(),

  // Moving items specifications
  boxesCount: z
    .number()
    .min(0, 'Laatikoiden määrä ei voi olla negatiivinen')
    .max(10000, 'Laatikoiden määrä ei voi olla enemmän kuin 10000')
    .optional(),

  needsPackaging: z.boolean().optional(),

  // Storage requirements
  needsStorage: z.boolean().optional(),

  storageDuration: z.enum(['paivat', 'viikot', 'kuukaudet', 'puoli-vuotta', 'vuosi']).optional(),

  storageType: z.enum(['huone', 'varasto', 'vintilla']).optional(),

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
