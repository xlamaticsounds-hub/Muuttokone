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
            id: data.id || undefined,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            from_location: data.from_location || null,
            to_location: data.to_location || null,
            apartment_size: data.apartment_size || null,
            moving_date: data.moving_date || null,
            message: data.message || null,
            // New fields
            square_meters: data.square_meters || null,
            floor: data.floor || null,
            has_elevator: data.has_elevator || null,
            box_count: data.box_count || null,
            
            service_type: 'quote_request',
            source: 'website',
          },
        }),
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
          className="border-strokedark rounded-full border px-7.5 py-3 transition-all duration-300 hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Takaisin
        </button>
        <button
          className="bg-primary rounded-full px-7.5 py-3 text-white transition-all duration-300 hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
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
