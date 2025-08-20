'use server';

import { QuoteFormData, ContactFormData, NewsletterData } from "@/lib/schemas";
import { DIRECTUS_URL } from "@/lib/directus";
import { checkRateLimit } from "./rate-limit";
import { logger } from "./logger";

export async function submitQuote(data: QuoteFormData): Promise<{ success: boolean; message: string }> {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(`quote:${data.email}`, 60000, 2);
    if (!rateLimitResult.success) {
      return { success: false, message: 'Liian monta tarjouspyyntöä. Yritä uudelleen myöhemmin.' };
    }

    // Submit to Directus
    const response = await fetch(`${DIRECTUS_URL}/items/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DIRECTUS_STATIC_TOKEN && {
          'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`
        })
      },
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
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit quote');
    }

    logger('info', 'Quote submitted successfully', { email: data.email, serviceType: data.serviceType });
    return { success: true, message: 'Tarjouspyyntö lähetetty onnistuneesti!' };
  } catch (error) {
    logger('error', 'Quote submission failed', error);
    return { success: false, message: 'Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.' };
  }
}

export async function submitContact(data: ContactFormData): Promise<{ success: boolean; message: string }> {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(`contact:${data.email}`, 60000, 3);
    if (!rateLimitResult.success) {
      return { success: false, message: 'Liian monta viestiä. Yritä uudelleen myöhemmin.' };
    }

    // Submit to Directus
    const response = await fetch(`${DIRECTUS_URL}/items/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DIRECTUS_STATIC_TOKEN && {
          'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`
        })
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: 'new',
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact form');
    }

    logger('info', 'Contact form submitted successfully', { email: data.email, subject: data.subject });
    return { success: true, message: 'Viesti lähetetty onnistuneesti!' };
  } catch (error) {
    logger('error', 'Contact form submission failed', error);
    return { success: false, message: 'Viestin lähetys epäonnistui. Yritä uudelleen.' };
  }
}

export async function subscribeNewsletter(data: NewsletterData): Promise<{ success: boolean; message: string }> {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(`newsletter:${data.email}`, 300000, 1); // 5 minutes, 1 request
    if (!rateLimitResult.success) {
      return { success: false, message: 'Olet jo tilannut uutiskirjeen.' };
    }

    // Submit to Directus
    const response = await fetch(`${DIRECTUS_URL}/items/newsletter_subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DIRECTUS_STATIC_TOKEN && {
          'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`
        })
      },
      body: JSON.stringify({
        email: data.email,
        status: 'active',
        subscribed_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe to newsletter');
    }

    logger('info', 'Newsletter subscription successful', { email: data.email });
    return { success: true, message: 'Uutiskirje tilattu onnistuneesti!' };
  } catch (error) {
    logger('error', 'Newsletter subscription failed', error);
    return { success: false, message: 'Uutiskirjeen tilaus epäonnistui. Yritä uudelleen.' };
  }
}
