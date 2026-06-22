'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';

export default function ContactFormBox() {
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.name.trim() || !data.message.trim()) {
      toast.error('Nimi ja viesti ovat pakollisia');
      return;
    }

    if (!gdprConsent) {
      toast.error('Hyväksy tietojen käsittely jatkaaksesi');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit as inbox message (not lead)
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          data: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            message: data.message,
            source: 'website_contact',
            gdpr_consent: gdprConsent,
            company: honeypot,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Viesti lähetetty onnistuneesti!');
        // Reset form
        setData({
          name: '',
          email: '',
          phone: '',
          message: '',
        });
        setGdprConsent(false);
        setHoneypot('');
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Contact submission error:', error);
      toast.error('Viestin lähetys epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate_top w-full rounded-2xl bg-white p-7.5 shadow-solid-8 md:w-[58%] lg:w-[64%] xl:p-14 dark:bg-blacksection dark:border dark:border-strokedark">
      <form onSubmit={handleSubmit}>
        <div className="mb-7.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
          <div className="w-full">
            <label htmlFor="name" className="mb-3 block text-sm font-medium text-black dark:text-white">
              Nimi <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Nimesi"
              autoComplete="name"
              value={data.name}
              onChange={handleChange}
              required
              className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-primary focus:placeholder:opacity-50 focus-visible:outline-none dark:border-strokedark dark:focus:border-primary dark:focus:placeholder:opacity-50"
            />
          </div>

          <div className="w-full">
            <label htmlFor="phone" className="mb-3 block text-sm font-medium text-black dark:text-white">
              Puhelinnumero
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="+358 40 123 4567"
              autoComplete="tel"
              value={data.phone}
              onChange={handleChange}
              className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-primary focus:placeholder:opacity-50 focus-visible:outline-none dark:border-strokedark dark:focus:border-primary dark:focus:placeholder:opacity-50"
            />
          </div>
        </div>

        <div className="mb-7.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
          <div className="w-full">
            <label htmlFor="email" className="mb-3 block text-sm font-medium text-black dark:text-white">
              Sähköposti
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="sahkoposti@esimerkki.fi"
              autoComplete="email"
              value={data.email}
              onChange={handleChange}
              className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-primary focus:placeholder:opacity-50 focus-visible:outline-none dark:border-strokedark dark:focus:border-primary dark:focus:placeholder:opacity-50"
            />
          </div>
        </div>

        <div className="mb-12.5">
          <label htmlFor="message" className="mb-3 block text-sm font-medium text-black dark:text-white">
            Viesti <span className="text-meta-1">*</span>
          </label>
          <textarea
            rows={5}
            id="message"
            name="message"
            placeholder="Kerro meille kuinka voimme auttaa..."
            value={data.message}
            onChange={handleChange}
            required
            className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-primary focus:placeholder:opacity-50 focus-visible:outline-none dark:border-strokedark dark:focus:border-primary dark:focus:placeholder:opacity-50 resize-none"
          />
        </div>

        <Honeypot value={honeypot} onChange={setHoneypot} />

        <div className="mb-7.5">
          <GdprConsentCheckbox checked={gdprConsent} onChange={setGdprConsent} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 font-medium text-white shadow-1 duration-300 ease-in-out hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
          {!isSubmitting && (
            <svg
              className="fill-current"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                fill=""
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
