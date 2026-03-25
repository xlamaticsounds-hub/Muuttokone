'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function QuickQuote() {
  const siteConfig = useSiteConfig();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Nimi ja puhelinnumero ovat pakollisia');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit to API to create initial lead
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            service_type: 'quick_start',
            source: 'website_hero',
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.leadId) {
        // 2. Save data to localStorage for pre-filling the next step
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'quickQuoteData',
            JSON.stringify({
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
            }),
          );
        }

        toast.success('Hienoa! Ohjataan viimeistelemään tiedot...');

        // 3. Redirect to full quote form with leadId
        router.push(`/muuttolaskuri?leadId=${result.leadId}`);
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Quick quote error:', error);
      toast.error('Jotain meni pieleen. Yritä uudelleen tai soita meille.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-black lg:text-3xl dark:text-white">
            Aloita tästä – saat hinta-arvion nopeasti
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Jätä yhteystietosi, niin olemme sinuun yhteydessä. Tämä ei sido sinua mihinkään.
          </p>
        </div>

        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-black">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-black dark:text-white"
                >
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
                  placeholder="Etunimi Sukunimi"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-black dark:text-white"
                >
                  Puhelin <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="040 123 4567"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-black dark:text-white"
                >
                  Sähköposti (valinnainen)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="posti@esimerkki.fi"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-secondary w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isSubmitting ? 'Käsitellään...' : 'Jatka tarjouspyyntöön →'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tai soita suoraan:
                <Link
                  href={`tel:${siteConfig?.contact?.phone?.tel}`}
                  className="hover:text-primary ml-1 font-semibold text-black dark:text-white"
                >
                  {siteConfig?.contact?.phone?.display}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}