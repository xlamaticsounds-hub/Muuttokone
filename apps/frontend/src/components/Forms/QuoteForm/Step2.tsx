'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { QuoteData } from '.';
import toast from 'react-hot-toast';

type Props = {
  data: QuoteData;
  setData: Dispatch<SetStateAction<QuoteData>>;
  onBack: () => void;
};

export default function Step2({ data, setData, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) return;
    
    if (!data.name.trim()) {
      toast.error('Nimi on pakollinen');
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
            phone: data.phone || null,
            from_location: data.from_location || null,
            to_location: data.to_location || null,
            apartment_size: data.apartment_size || null,
            moving_date: data.moving_date || null,
            message: data.message || null,
            service_type: 'quote_request',
            source: 'website',
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Tarjouspyyntö lähetetty onnistuneesti!');
        // Reset form
        setData({ name: '' });
        onBack(); // Go back to step 1 (which will now be empty)
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Quote submission error:', error);
      toast.error('Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block">Lisätietoja (valinnainen)</label>
        <textarea
          rows={6}
          className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
          value={data.message || ''}
          onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
          placeholder="Kerro muutostasi lisää: kodin koko, erikoishuomiot, aikataulutoiveet..."
        />
      </div>

      <div className="flex justify-between">
        <button
          className="border-strokedark rounded-full border px-7.5 py-3"
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Takaisin
        </button>
        <button
          className="bg-primary rounded-full px-7.5 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Lähetetään...' : 'Lähetä tarjouspyyntö'}
        </button>
      </div>
    </div>
  );
}
