'use server';

import { directusFetch, invalidateCollection } from '@/lib/directus';
import { checkRateLimit } from './rate-limit';
import { logger } from './logger';
import { safeFormAction, createSuccessResult, createErrorResult } from '@/lib/form-helpers';
import { quoteSchema, type QuoteFormData } from '@/features/quote/schemas';
import {
  contactSchema,
  newsletterSchema,
  type ContactFormData,
  type NewsletterData,
} from '@/features/contact/schemas';

export async function submitQuote(formData: FormData) {
  return safeFormAction(
    quoteSchema,
    async (data: QuoteFormData) => {
      // Rate limiting
      const rateLimitResult = checkRateLimit(`quote:${data.email}`, 60000, 2);
      if (!rateLimitResult.success) {
        return createErrorResult('Liian monta tarjouspyyntöä. Yritä uudelleen myöhemmin.');
      }

      try {
        // Submit to Directus using unified client
        await directusFetch('/items/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quote',
            name: data.name,
            email: data.email,
            phone: data.phone,
            from_address: data.fromAddress,
            to_address: data.toAddress,
            move_date: data.moveDate,
            service_type: data.serviceType,
            description: data.description,
            apartment_size: data.apartmentSize,
            has_elevator: data.hasElevator,
            packing_service: data.packingService,
            status: 'new',
            created_at: new Date().toISOString(),
          }),
        });

        // Invalidate leads cache
        await invalidateCollection('leads');

        logger('info', 'Quote submitted successfully', {
          email: data.email,
          serviceType: data.serviceType,
        });
        return createSuccessResult(undefined, 'Tarjouspyyntö lähetetty onnistuneesti!');
      } catch (error) {
        logger('error', 'Quote submission failed', error);
        return createErrorResult('Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.');
      }
    },
    formData,
  );
}

export async function submitContact(formData: FormData) {
  return safeFormAction(
    contactSchema,
    async (data: ContactFormData) => {
      // Rate limiting
      const rateLimitResult = checkRateLimit(`contact:${data.email}`, 60000, 3);
      if (!rateLimitResult.success) {
        return createErrorResult('Liian monta viestiä. Yritä uudelleen myöhemmin.');
      }

      try {
        // Submit to Directus using unified client
        await directusFetch('/items/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            company: data.company,
            preferred_contact_method: data.preferredContactMethod,
            marketing_consent: data.marketingConsent,
            status: 'new',
            created_at: new Date().toISOString(),
          }),
        });

        // Invalidate contacts cache
        await invalidateCollection('contacts');

        logger('info', 'Contact form submitted successfully', {
          email: data.email,
          subject: data.subject,
        });
        return createSuccessResult(undefined, 'Viesti lähetetty onnistuneesti!');
      } catch (error) {
        logger('error', 'Contact form submission failed', error);
        return createErrorResult('Viestin lähetys epäonnistui. Yritä uudelleen.');
      }
    },
    formData,
  );
}

export async function subscribeNewsletter(formData: FormData) {
  return safeFormAction(
    newsletterSchema,
    async (data: NewsletterData) => {
      // Rate limiting
      const rateLimitResult = checkRateLimit(`newsletter:${data.email}`, 300000, 1); // 5 minutes, 1 request
      if (!rateLimitResult.success) {
        return createErrorResult('Olet jo tilannut uutiskirjeen.');
      }

      try {
        // Submit to Directus using unified client
        await directusFetch('/items/newsletter_subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            first_name: data.firstName,
            interests: data.interests,
            gdpr_consent: data.gdprConsent,
            status: 'active',
            subscribed_at: new Date().toISOString(),
          }),
        });

        // Invalidate newsletter subscribers cache
        await invalidateCollection('newsletter_subscribers');

        logger('info', 'Newsletter subscription successful', { email: data.email });
        return createSuccessResult(undefined, 'Uutiskirje tilattu onnistuneesti!');
      } catch (error) {
        logger('error', 'Newsletter subscription failed', error);
        return createErrorResult('Uutiskirjeen tilaus epäonnistui. Yritä uudelleen.');
      }
    },
    formData,
  );
}
