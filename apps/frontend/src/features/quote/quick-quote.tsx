"use client";

import { useState } from "react";
import { useSiteConfig } from "@/app/context/SiteConfigContext";
import Link from "next/link";

export default function QuickQuote() {
  const siteConfig = useSiteConfig();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    fromLocation: "",
    toLocation: "",
    homeSize: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store data and redirect to full form
    localStorage.setItem("quickQuoteData", JSON.stringify(formData));
    window.location.href = "/tarjouspyynto";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-1 dark:bg-bg-color-dark py-12.5 lg:py-17.5">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-white lg:text-3xl">
            Pyydä nopea tarjous
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Täytä perustiedot alle, niin saat tarjouksen nopeasti
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Nimi *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-blackho dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Puhelinnumero *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-blackho dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Mistä muutat? *
                </label>
                <input
                  type="text"
                  name="fromLocation"
                  value={formData.fromLocation}
                  onChange={handleChange}
                  required
                  placeholder="Esim. Helsinki"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-blackho dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Minne muutat? *
                </label>
                <input
                  type="text"
                  name="toLocation"
                  value={formData.toLocation}
                  onChange={handleChange}
                  required
                  placeholder="Esim. Espoo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-blackho dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Kodin koko
              </label>
              <select
                name="homeSize"
                value={formData.homeSize}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-blackho dark:border-gray-700 dark:text-white"
              >
                <option value="">Valitse koko</option>
                <option value="1h">1-huoneinen</option>
                <option value="2h">2-huoneinen</option>
                <option value="3h">3-huoneinen</option>
                <option value="4h+">4+ huoneinen</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition-colors"
              >
                Pyydä tarjous
              </button>
              <Link
                href={`tel:${siteConfig?.contact?.phone?.tel}`}
                className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors text-center"
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
