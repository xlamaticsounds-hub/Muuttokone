'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';

export default function BusinessQuoteForm() {
  const siteConfig = useSiteConfig();
  const [data, setData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    fromAddress: '',
    toAddress: '',
    workstations: '',
    movingDate: '',
    message: '',
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.companyName.trim() || !data.contactName.trim() || !data.phone.trim()) {
      toast.error('Yrityksen nimi, yhteyshenkilö ja puhelin ovat pakollisia');
      return;
    }
    if (!gdprConsent) {
      toast.error('Hyväksy tietojen käsittely jatkaaksesi');
      return;
    }

    setIsSubmitting(true);
    try {
      const workstationsNote = data.workstations.trim()
        ? `Arvioitu työpistemäärä: ${data.workstations.trim()}\n`
        : '';
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: data.contactName,
            company_name: data.companyName,
            phone: data.phone,
            email: data.email || null,
            from_location: data.fromAddress || null,
            to_location: data.toAddress || null,
            moving_date: data.movingDate || null,
            message: `${workstationsNote}${data.message.trim()}`.trim() || null,
            service_type: 'yritysmuutto',
            source: 'yrityssivu',
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
      console.error('Business quote submission error:', error);
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
          Olemme sinuun yhteydessä mahdollisimman pian ja sovitaan maksuttomasta kartoituksesta. Kiireellisessä
          asiassa voit myös soittaa suoraan:{' '}
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
            <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Yrityksen nimi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              autoComplete="organization"
              value={data.companyName}
              onChange={handleChange}
              required
              placeholder="Yritys Oy"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="contactName" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Yhteyshenkilö <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              autoComplete="name"
              value={data.contactName}
              onChange={handleChange}
              required
              placeholder="Etunimi Sukunimi"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Puhelin <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={data.phone}
              onChange={handleChange}
              required
              placeholder="040 123 4567"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Sähköposti
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={data.email}
              onChange={handleChange}
              placeholder="posti@yritys.fi"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="fromAddress" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Mistä
            </label>
            <input
              type="text"
              id="fromAddress"
              name="fromAddress"
              value={data.fromAddress}
              onChange={handleChange}
              placeholder="Nykyisten tilojen osoite"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="toAddress" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Minne
            </label>
            <input
              type="text"
              id="toAddress"
              name="toAddress"
              value={data.toAddress}
              onChange={handleChange}
              placeholder="Uusien tilojen osoite"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="workstations" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Arvioitu työpistemäärä
            </label>
            <input
              type="text"
              id="workstations"
              name="workstations"
              value={data.workstations}
              onChange={handleChange}
              placeholder="Esim. 20"
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="movingDate" className="mb-2 block text-sm font-medium text-black dark:text-white">
              Toivottu ajankohta
            </label>
            <input
              type="date"
              id="movingDate"
              name="movingDate"
              value={data.movingDate}
              onChange={handleChange}
              className="focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-black dark:text-white">
            Lisätiedot
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={data.message}
            onChange={handleChange}
            placeholder="Kerro esim. erikoiskuljetuksista, arkistoista tai muista tarpeista"
            className="focus:ring-primary focus:border-primary w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white"
          />
        </div>

        <Honeypot value={honeypot} onChange={setHoneypot} />
        <GdprConsentCheckbox checked={gdprConsent} onChange={setGdprConsent} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-secondary w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Lähetetään...' : 'Pyydä maksuton kartoitus'}
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
