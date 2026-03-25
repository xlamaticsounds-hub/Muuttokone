'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

const initialState = { name: '', phone: '', email: '', message: '' };

type FormState = typeof initialState;

export default function CallRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            message: form.message,
            source: 'CALL_REQUEST',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Lomakkeen lähetys epäonnistui');
      }

      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.message ?? 'Lomakkeen lähetys epäonnistui');
      }

      setForm(initialState);
      setFeedback({ type: 'success', message: 'Kiitos! Otamme yhteyttä mahdollisimman pian.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Lähetys epäonnistui.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="call-name"
            className="mb-2 block text-sm font-medium text-black dark:text-white"
          >
            Nimi
          </label>
          <input
            id="call-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm transition outline-none focus:ring-2 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="call-phone"
            className="mb-2 block text-sm font-medium text-black dark:text-white"
          >
            Puhelinnumero
          </label>
          <input
            id="call-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm transition outline-none focus:ring-2 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="call-email"
            className="mb-2 block text-sm font-medium text-black dark:text-white"
          >
            Sähköposti
          </label>
          <input
            id="call-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm transition outline-none focus:ring-2 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="call-message"
            className="mb-2 block text-sm font-medium text-black dark:text-white"
          >
            Lisätiedot
          </label>
          <textarea
            id="call-message"
            name="message"
            rows={4}
            value={form.message}
            onChange={handleChange}
            placeholder="Kerro toiveesi tai sopivat yhteydenottoajat"
            className="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm transition outline-none focus:ring-2 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={
            feedback.type === 'success'
              ? 'rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
          }
        >
          {feedback.message}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 focus-visible:ring-primary/30 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Lähetetään...' : 'Lähetä soittopyyntö'}
        </button>
      </div>
    </form>
  );
}
