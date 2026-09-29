'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import { tyoapuCategories } from './tyoapuData';

const inputClass =
  'focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white';
const labelClass = 'mb-2 block text-sm font-medium text-black dark:text-white';

const PRICING_OPTIONS = [
  { value: '', label: 'Ei väliä — ehdottakaa' },
  { value: 'Kiinteä hinta', label: 'Kiinteä hinta' },
  { value: 'Tuntiveloitus', label: 'Tuntiveloitus' },
];

export default function TyoapuQuoteForm() {
  const siteConfig = useSiteConfig();
  const [data, setData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    date: '',
    pricing: '',
    message: '',
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.name.trim() || !data.phone.trim() || !data.message.trim()) {
      toast.error('Nimi, puhelin ja työn kuvaus ovat pakollisia');
      return;
    }
    if (!gdprConsent) {
      toast.error('Hyväksy tietojen käsittely jatkaaksesi');
      return;
    }

    // Palveluryhmä ja hinnoittelutoive kulkevat viestin alussa, jotta ne näkyvät liidin
    // muistiinpanoissa hallintapaneelissa ilman erillisiä kenttiä.
    const categoryTitle = tyoapuCategories.find((c) => c.id === data.category)?.title;
    const header = [
      categoryTitle && `Palvelu: ${categoryTitle}`,
      data.pricing && `Hinnoittelutoive: ${data.pricing}`,
    ]
      .filter(Boolean)
      .join('\n');

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: data.name,
            company_name: data.companyName || null,
            phone: data.phone,
            email: data.email || null,
            from_location: data.address || null,
            moving_date: data.date || null,
            message: [header, data.message.trim()].filter(Boolean).join('\n\n'),
            service_type: 'tyoapu',
            source: 'website',
            gdpr_consent: gdprConsent,
            company: honeypot,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Kiitos! Olemme sinuun yhteydessä pian.');
        setSubmitted(true);
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Työapu quote submission error:', error);
      toast.error('Jotain meni pieleen. Yritä uudelleen tai soita meille.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-black/5 bg-white/90 p-8 text-center shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
        <h3 className="mb-2 text-xl font-bold text-black/90 dark:text-white">Kiitos yhteydenotosta!</h3>
        <p className="text-black/70 dark:text-white/70">
          Olemme sinuun yhteydessä mahdollisimman pian ja lähetämme tarjouksen. Kiireellisessä asiassa voit myös
          soittaa suoraan:{' '}
          <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-primary hover:underline">
            {siteConfig?.contact?.phone?.display}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-black/5 bg-white/90 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-10 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Mihin tarvitset apua?
            </label>
            <select id="category" name="category" value={data.category} onChange={handleChange} className={inputClass}>
              <option value="">Valitse palvelu</option>
              {tyoapuCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
              <option value="muu">Jokin muu</option>
            </select>
          </div>
          <div>
            <label htmlFor="pricing" className={labelClass}>
              Hinnoittelu
            </label>
            <select id="pricing" name="pricing" value={data.pricing} onChange={handleChange} className={inputClass}>
              {PRICING_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>
              Nimi <span className="text-red-500">*</span>
            </label>
            <input type="text" id="name" name="name" autoComplete="name" value={data.name} onChange={handleChange} required placeholder="Etunimi Sukunimi" className={inputClass} />
          </div>
          <div>
            <label htmlFor="companyName" className={labelClass}>
              Yritys (valinnainen)
            </label>
            <input type="text" id="companyName" name="companyName" autoComplete="organization" value={data.companyName} onChange={handleChange} placeholder="Yritys Oy" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Puhelin <span className="text-red-500">*</span>
            </label>
            <input type="tel" id="phone" name="phone" autoComplete="tel" value={data.phone} onChange={handleChange} required placeholder="040 123 4567" className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Sähköposti
            </label>
            <input type="email" id="email" name="email" autoComplete="email" value={data.email} onChange={handleChange} placeholder="nimi@esimerkki.fi" className={inputClass} />
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Työkohteen osoite
            </label>
            <input type="text" id="address" name="address" autoComplete="street-address" value={data.address} onChange={handleChange} placeholder="Katu 1, Espoo" className={inputClass} />
          </div>
          <div>
            <label htmlFor="date" className={labelClass}>
              Toivottu ajankohta
            </label>
            <input type="date" id="date" name="date" value={data.date} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Kuvaile työ <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={data.message}
            onChange={handleChange}
            required
            placeholder="Esim. 65 tuuman TV betoniseinään, teline on jo hankittu. Johdot halutaan piiloon."
            className={`${inputClass} resize-none`}
          />
        </div>

        <Honeypot value={honeypot} onChange={setHoneypot} />
        <GdprConsentCheckbox checked={gdprConsent} onChange={setGdprConsent} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-secondary w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Lähetetään...' : 'Pyydä tarjous'}
        </button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Tai soita suoraan:{' '}
          <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-black hover:text-primary dark:text-white">
            {siteConfig?.contact?.phone?.display}
          </Link>
        </p>
      </form>
    </div>
  );
}
