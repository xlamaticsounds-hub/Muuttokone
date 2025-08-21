'use client';
import React, { Dispatch, SetStateAction } from 'react';
import { QuoteData } from '.';

type Props = {
  data: QuoteData;
  setData: Dispatch<SetStateAction<QuoteData>>;
  onNext: () => void;
};

export default function Step1({ data, setData, onNext }: Props) {
  return (
    <form
      autoComplete="on"
      onSubmit={(e) => {
        e.preventDefault();
        if (!data.phone || !data.date) return;
        onNext();
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-2 block">Nimi</label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, name: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block">Sähköposti</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, email: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="tel" className="mb-2 block">
            Puhelin <span className="text-red-500">*</span>
          </label>
          <input
            id="tel"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, phone: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="fromPostal" className="mb-2 block">Mistä (postinumero)</label>
          <input
            id="fromPostal"
            name="fromPostal"
            autoComplete="postal-code"
            placeholder="00100"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.from || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, from: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="toPostal" className="mb-2 block">Minne (postinumero)</label>
          <input
            id="toPostal"
            name="toPostal"
            autoComplete="postal-code"
            placeholder="20100"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.to || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, to: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="mb-2 block">Kohteen koko</label>
          <select
            id="size"
            name="size"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.size || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setData((d: QuoteData) => ({ ...d, size: e.target.value }))
            }
          >
            <option value="">Valitse</option>
            <option>Yksiö</option>
            <option>Kaksio</option>
            <option>Kolmio</option>
            <option>Neliö+</option>
            <option>Pieni toimisto</option>
            <option>Suuri toimisto</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block">
            Muuttopäivä <span className="text-red-500">*</span>
          </label>
          <input
            id="moveDate"
            name="moveDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.date || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, date: e.target.value }))
            }
            required
          />
          <div className="mt-3 flex gap-2">
            {(['exact', '+/-3', '+/-7'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setData((d) => ({ ...d, dateFlex: opt }))}
                className={`rounded-full border px-3 py-1 text-sm ${data.dateFlex === opt ? 'bg-primary border-primary text-white' : 'border-strokedark'}`}
                aria-pressed={data.dateFlex === opt}
              >
                {opt === 'exact' ? 'Tarkka' : opt}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block">Yritysasiakas</label>
          <div className="flex items-center gap-3">
            <input
              id="isBusiness"
              type="checkbox"
              checked={!!data.isBusiness}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setData((d: QuoteData) => ({ ...d, isBusiness: e.target.checked }))
              }
            />
            <label htmlFor="isBusiness">Olen yritysasiakas</label>
          </div>
          {data.isBusiness && (
              <div className="mt-3">
              <label htmlFor="businessId" className="mb-2 block">Y-tunnus</label>
              <input
                id="businessId"
                name="businessId"
                autoComplete="organization"
                className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
                value={data.businessId || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setData((d: QuoteData) => ({ ...d, businessId: e.target.value }))
                }
                required
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block">Lisätietoja lähtöosoitteesta (valinnainen)</label>
          <input
            id="fromExtra"
            name="fromExtra"
            autoComplete="address-line2"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.fromExtra || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, fromExtra: e.target.value }))
            }
            placeholder="Esim. porttikoodi, pitkät portaat, sisäpiha"
          />
        </div>
        <div>
          <label className="mb-2 block">Lisätietoja kohdeosoitteesta (valinnainen)</label>
          <input
            id="toExtra"
            name="toExtra"
            autoComplete="address-line2"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.toExtra || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, toExtra: e.target.value }))
            }
            placeholder="Esim. pysäköinti, kantomatka, hissi"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-primary rounded-full px-7.5 py-3 text-white" type="submit">
          Jatka
        </button>
      </div>
    </form>
  );
}
