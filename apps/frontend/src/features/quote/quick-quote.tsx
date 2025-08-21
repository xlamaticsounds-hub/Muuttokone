'use client';

import React, { useState } from 'react';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';

export default function QuickQuote() {
  const siteConfig = useSiteConfig();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    fromLocation: '',
    toLocation: '',
    homeSize: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Send a minimal lead record (name, phone) immediately, then store quick data
    (async () => {
      try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'lead', data: { name: formData.name, phone: formData.phone, source: 'quick-hero' } }),
        });
      } catch (err) {
        // Ignore network errors — we'll still proceed to the full form
        console.error('Quick lead post failed', err);
      } finally {
        // Store data for prefill in the full form and navigate
        try { localStorage.setItem('quickQuoteData', JSON.stringify(formData)); } catch (err) {
          console.error('Failed to store quick quote data', err);
        }
        window.location.href = '/tarjouspyynto';
      }
    })();
    
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-black lg:text-3xl dark:text-white">
            Pyydä nopea tarjous
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Täytä perustiedot alle, niin saat tarjouksen nopeasti
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Nimi *
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Puhelinnumero *
                </label>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Mistä muutat? *
                </label>
                <input
                  type="text"
                  name="fromLocation"
                  autoComplete="address-level2"
                  value={formData.fromLocation}
                  onChange={handleChange}
                  required
                  placeholder="Esim. Helsinki"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Minne muutat? *
                </label>
                <input
                  type="text"
                  name="toLocation"
                  autoComplete="address-level2"
                  value={formData.toLocation}
                  onChange={handleChange}
                  required
                  placeholder="Esim. Espoo"
                  className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Kodin koko
              </label>
              <select
                name="homeSize"
                value={formData.homeSize}
                onChange={handleChange}
                className="focus:ring-primary focus:border-primary dark:bg-blackho w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 dark:border-gray-700 dark:text-white"
              >
                <option value="">Valitse koko</option>
                <option value="1h">1-huoneinen</option>
                <option value="2h">2-huoneinen</option>
                <option value="3h">3-huoneinen</option>
                <option value="4h+">4+ huoneinen</option>
              </select>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                type="submit"
                className="bg-primary hover:bg-secondary rounded-lg px-8 py-4 font-semibold text-white transition-colors"
              >
                Pyydä tarjous
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
