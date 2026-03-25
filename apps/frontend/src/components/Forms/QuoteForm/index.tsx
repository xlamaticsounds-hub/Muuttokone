'use client';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Step1 from './Step1';
import Step2 from './Step2';
import Progress from './Progress';

export type QuoteData = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  from_location?: string;
  to_location?: string;
  apartment_size?: string;
  moving_date?: string;
  message?: string;
  floor?: string;
  has_elevator?: string;
  square_meters?: string;
  box_count?: string;
};

export default function QuoteForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuoteData>({ name: '' });

  // On mount, check URL for leadId
  React.useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      setData((d) => ({ ...d, id: leadId }));
    }
  }, [searchParams]);

  // On mount, load quick quote data from localStorage if present
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const quickQuote = localStorage.getItem('quickQuoteData');
      if (quickQuote) {
        try {
          const parsed = JSON.parse(quickQuote);
          setData((d) => ({
            ...d,
            name: parsed.name || d.name,
            phone: parsed.phone || d.phone,
            email: parsed.email || d.email,
            from_location: parsed.fromLocation || d.from_location,
            to_location: parsed.toLocation || d.to_location,
            apartment_size: parsed.homeSize || d.apartment_size,
          }));
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
        const phoneEl = document.querySelector<HTMLInputElement>('input[name="phone"]');
        const fromEl = document.querySelector<HTMLInputElement>('input[name="fromLocation"]');
        const toEl = document.querySelector<HTMLInputElement>('input[name="toLocation"]');
        if (nameEl?.value) fields.name = nameEl.value;
        if (phoneEl?.value) fields.phone = phoneEl.value;
        if (fromEl?.value) fields.from_location = fromEl.value;
        if (toEl?.value) fields.to_location = toEl.value;
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
