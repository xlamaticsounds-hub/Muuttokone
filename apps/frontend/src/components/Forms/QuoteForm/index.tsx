"use client";
import React, { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Progress from "./Progress";

export type QuoteData = {
  name: string;
  email?: string;
  phone?: string;
  from?: string;
  to?: string;
  size?: string;
  date?: string;
  dateFlex?: "exact" | "+/-3" | "+/-7";
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
  const [data, setData] = useState<QuoteData>({ name: "" });

  // On mount, load quick quote data from localStorage if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const quickQuote = localStorage.getItem("quickQuoteData");
      if (quickQuote) {
        try {
          const parsed = JSON.parse(quickQuote);
          setData((d) => ({
            ...d,
            name: parsed.name || d.name,
            phone: parsed.phone || d.phone,
            from: parsed.fromLocation || d.from,
            to: parsed.toLocation || d.to,
            size: parsed.homeSize || d.size,
          }));
          localStorage.removeItem("quickQuoteData");
        } catch {}
      }
    }
  }, []);

  const next = () => setStep((s: number) => Math.min(2, s + 1));
  const back = () => setStep((s: number) => Math.max(1, s - 1));

  return (
    <div className="rounded-lg bg-white p-7.5 shadow-3 dark:bg-black">
      <Progress step={step} />
      {step === 1 ? (
        <Step1 data={data} setData={setData} onNext={next} />
      ) : (
        <Step2 data={data} setData={setData} onBack={back} />
      )}
    </div>
  );
}
