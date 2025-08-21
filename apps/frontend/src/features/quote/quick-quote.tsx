'use client';

import React, { useState } from 'react';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function QuickQuote() {
  const siteConfig = useSiteConfig();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    from_location: '',
    to_location: '',
    apartment_size: '',
    moving_date: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nimi on pakollinen');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit directly to leads collection
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: formData.name,
            phone: formData.phone || null,
            from_location: formData.from_location || null,
            to_location: formData.to_location || null,
            apartment_size: formData.apartment_size || null,
            moving_date: formData.moving_date || null,
            message: formData.message || null,
            service_type: 'quote_request',
            source: 'website',
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Tarjouspyyntö lähetetty onnistuneesti!');
        // Reset form
        setFormData({
          name: '',
          phone: '',
          from_location: '',
          to_location: '',
          apartment_size: '',
          moving_date: '',
          message: '',
        });
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Quote submission error:', error);
      toast.error('Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-black lg:text-3xl dark:text-white">
            Pyydä tarjous
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Täytä tiedot alle, niin saat tarjouksen nopeasti
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            {/* Name - Required */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-black dark:text-white">
                Nimi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nimesi"
                className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* Form Fields in Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Puhelin (valinnainen)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Puhelinnumerosi"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="apartment_size" className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Kohteen koko (valinnainen)
                </label>
                <select
                  id="apartment_size"
                  name="apartment_size"
                  value={formData.apartment_size}
                  onChange={handleChange}
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
                >
                  <option value="">Valitse</option>
                  <option value="Yksiö">Yksiö</option>
                  <option value="Kaksio">Kaksio</option>
                  <option value="Kolmio">Kolmio</option>
                  <option value="Neliö+">Neliö+</option>
                  <option value="Toimisto">Toimisto</option>
                </select>
              </div>

              <div>
                <label htmlFor="from_location" className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Mistä (valinnainen)
                </label>
                <input
                  type="text"
                  id="from_location"
                  name="from_location"
                  autoComplete="address-line1"
                  value={formData.from_location}
                  onChange={handleChange}
                  placeholder="Kaupunki tai postinumero"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="to_location" className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Minne (valinnainen)
                </label>
                <input
                  type="text"
                  id="to_location"
                  name="to_location"
                  autoComplete="address-line1"
                  value={formData.to_location}
                  onChange={handleChange}
                  placeholder="Kaupunki tai postinumero"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="moving_date" className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Muuttopäivä (valinnainen)
                </label>
                <input
                  type="date"
                  id="moving_date"
                  name="moving_date"
                  value={formData.moving_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-black dark:text-white">
                Lisätietoja (valinnainen)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Kerro muutostasi lisää: erikoishuomiot, aikataulutoiveet..."
                className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-secondary rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä tarjouspyyntö'}
              </button>
              <Link
                href={`tel:${siteConfig?.contact?.phone?.tel}`}
                className="border-primary text-primary hover:bg-primary rounded-lg border px-8 py-4 text-center font-semibold transition-colors hover:text-white"
              >
                Tai soita: {siteConfig?.contact?.phone?.display}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
