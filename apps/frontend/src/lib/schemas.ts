import { z } from 'zod';

// Quote form schema
export const quoteSchema = z.object({
  name: z.string().min(1, 'Nimi on pakollinen'),
  email: z.string().email('Virheellinen sähköpostiosoite'),
  phone: z.string().min(1, 'Puhelinnumero on pakollinen'),
  fromAddress: z.string().min(1, 'Lähtöosoite on pakollinen'),
  toAddress: z.string().min(1, 'Määränpää on pakollinen'),
  moveDate: z.string().min(1, 'Muuttopäivä on pakollinen'),
  serviceType: z.enum(['kotimuutto', 'yritysmuutto', 'pakkauspalvelu', 'varastointi']),
  description: z.string().optional(),
  apartmentSize: z.string().optional(),
  hasElevator: z.boolean().optional(),
  packingService: z.boolean().optional(),
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(1, 'Nimi on pakollinen'),
  email: z.string().email('Virheellinen sähköpostiosoite'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Aihe on pakollinen'),
  message: z.string().min(1, 'Viesti on pakollinen'),
});

// Newsletter schema
export const newsletterSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;
