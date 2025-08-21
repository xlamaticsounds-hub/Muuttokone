'use server';

import { directusFetch, invalidateCollection } from '@/lib/directus';
import { checkRateLimit } from './rate-limit';
import { logger } from './logger';
import { safeFormAction, createSuccessResult, createErrorResult } from '@/lib/form-helpers';
import {
  contactSchema,
  newsletterSchema,
  type ContactFormData,
  type NewsletterData,
} from '@/lib/schemas';

export async function submitContact(formData: FormData) {
  return safeFormAction(
    contactSchema,
    async (data: ContactFormData) => {
      // Rate limiting
      const rateLimitResult = checkRateLimit(`contact:${data.name}`, 60000, 3);
      if (!rateLimitResult.success) {
        return createErrorResult('Liian monta viestiä. Yritä uudelleen myöhemmin.');
      }

      try {
        // Use the unified API route instead of direct Directus calls
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'lead',
            data: {
              name: data.name,
              message: data.message,
              service_type: 'contact',
              source: 'website',
            }
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Submission failed');
        }

        logger('info', 'Contact form submitted successfully', {
          name: data.name,
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
        await directusFetch('/items/newsletter_email_addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            status: 'active',
            gdpr_consent: data.gdprConsent,
            source: 'website',
            subscribed_at: new Date().toISOString(),
          }),
        });

        // Invalidate newsletter subscribers cache
        await invalidateCollection('newsletter_email_addresses');

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
