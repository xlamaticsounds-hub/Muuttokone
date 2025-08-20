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
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black placeholder-gray-500 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  placeholder="Etunimi Sukunimi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Puhelin *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black placeholder-gray-500 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  placeholder="+358 40 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Mistä (postinumero) *
                </label>
                <input
                  type="text"
                  name="fromLocation"
                  value={formData.fromLocation}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black placeholder-gray-500 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  placeholder="00100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Minne (postinumero) *
                </label>
                <input
                  type="text"
                  name="toLocation"
                  value={formData.toLocation}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black placeholder-gray-500 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  placeholder="00200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Asunnon koko *
              </label>
              <select
                name="homeSize"
                value={formData.homeSize}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
              >
                <option value="">Valitse asunnon koko</option>
                <option value="1h">1-huoneinen (yksiö)</option>
                <option value="2h">2-huoneinen</option>
                <option value="3h">3-huoneinen</option>
                <option value="4h">4-huoneinen</option>
                <option value="5h+">5+ huoneinen</option>
                <option value="toimisto">Toimisto</option>
                <option value="varasto">Varasto</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary px-6 py-3 font-medium text-white duration-300 ease-in-out hover:shadow-1"
              >
                Jatka tarjoukseen →
              </button>
              
              <Link
                href={`tel:${siteConfig.contact.phone.tel}`}
                className="flex-1 rounded-full border border-primary px-6 py-3 font-medium text-primary duration-300 ease-in-out hover:bg-primary hover:text-white text-center"
              >
                Tai soita suoraan
              </Link>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Käsittelemme tietojasi luottamuksellisesti.{" "}
              <Link href="/tietosuoja" className="text-primary hover:underline">
                Tietosuojakäytäntö
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
