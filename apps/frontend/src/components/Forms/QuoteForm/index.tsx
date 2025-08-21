'use client';
import React, { useState } from 'react';
import Step1 from './Step1';
import Step2 from './Step2';
import Progress from './Progress';

export type QuoteData = {
  name: string;
  email?: string;
  phone?: string;
  from?: string;
  to?: string;
  size?: string;
  date?: string;
  dateFlex?: 'exact' | '+/-3' | '+/-7';
  services?: string[];
  inventory?: string;
  elevator?: boolean;
  distance?: string;
  notes?: string;
  isBusiness?: boolean;
  businessId?: string; // Y-tunnus
  contactNotes?: string;
  fromExtra?: string;
  toExtra?: string;
};

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuoteData>({ name: '' });

  // On mount, load quick quote data from localStorage if present
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const quickQuote = localStorage.getItem('quickQuoteData');
      if (quickQuote) {
        try {
          const parsed = JSON.parse(quickQuote);
          setData((d) => {
            // Map compact homeSize codes from quick-quote to the full labels used by the full form
            const sizeMap: Record<string, string> = {
              '1h': 'Yksiö',
              '2h': 'Kaksio',
              '3h': 'Kolmio',
              '4h+': 'Neliö+',
            };
            const mappedSize = parsed.homeSize ? sizeMap[parsed.homeSize] || parsed.homeSize : d.size;
            return {
              ...d,
              name: parsed.name || d.name,
              phone: parsed.phone || d.phone,
              from: parsed.fromLocation || d.from,
              to: parsed.toLocation || d.to,
              size: mappedSize,
            };
          });
          localStorage.removeItem('quickQuoteData');
        } catch {
          // Invalid JSON in localStorage, ignore
        }
      }
    }
  }, []);

  // Some browsers/autofill populate inputs after mount. Read current DOM values
  // and sync into React state so controlled inputs reflect autofill.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // run after a short delay to allow autofill to complete
    const t = setTimeout(() => {
      try {
        const fields: Partial<QuoteData> = {};
        const nameEl = document.querySelector<HTMLInputElement>('input[name="fullName"]');
        const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
        const phoneEl = document.querySelector<HTMLInputElement>('input[name="phone"]');
        const fromEl = document.querySelector<HTMLInputElement>('input[name="fromPostal"]');
        const toEl = document.querySelector<HTMLInputElement>('input[name="toPostal"]');
        if (nameEl?.value) fields.name = nameEl.value;
        if (emailEl?.value) fields.email = emailEl.value;
        if (phoneEl?.value) fields.phone = phoneEl.value;
        if (fromEl?.value) fields.from = fromEl.value;
        if (toEl?.value) fields.to = toEl.value;
        // merge only if we found values
        if (Object.keys(fields).length > 0) setData((d) => ({ ...d, ...fields }));
      } catch {
        // ignore
      }
    }, 120);
    return () => clearTimeout(t);
  }, [setData]);

  const next = () => setStep((s: number) => Math.min(2, s + 1));
  const back = () => setStep((s: number) => Math.max(1, s - 1));

  return (
    <div className="shadow-3 rounded-lg bg-white p-7.5 dark:bg-black">
      <Progress step={step} />
      {step === 1 ? (
        <Step1 data={data} setData={setData} onNext={next} />
      ) : (
        <Step2 data={data} setData={setData} onBack={back} />
      )}
    </div>
  );
}
