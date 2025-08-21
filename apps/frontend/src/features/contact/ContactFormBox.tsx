'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactFormBox() {
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
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

    setIsSubmitting(true);

    try {
      // Submit directly to leads collection
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            message: data.message,
            service_type: 'contact',
            source: 'website',
          }
        })
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
    <>
    <div className="animate_top shadow-3 w-full rounded-lg bg-white p-7.5 md:w-3/5 lg:w-2/3 xl:p-14 dark:bg-black">
      <form onSubmit={handleSubmit} className="space-y-7.5">
        <div>
          <label htmlFor="name" className="mb-4 block">
            Nimi <span className="text-red-500">*</span>
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
            className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3.5 focus-visible:outline-hidden dark:shadow-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-4 block">
            Sähköposti
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="sähköposti@esimerkki.fi"
            autoComplete="email"
            value={data.email}
            onChange={handleChange}
            className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3.5 focus-visible:outline-hidden dark:shadow-none"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-4 block">
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
            className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3.5 focus-visible:outline-hidden dark:shadow-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="mb-4 block">
            Viesti <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={6}
            id="message"
            name="message"
            placeholder="Kerro meille kuinka voimme auttaa..."
            value={data.message}
            onChange={handleChange}
            required
            className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent p-6 focus-visible:outline-hidden dark:shadow-none"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:shadow-1 inline-flex rounded-full px-7.5 py-3 text-white duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
