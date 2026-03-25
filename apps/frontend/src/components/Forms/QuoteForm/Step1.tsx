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
        if (!data.name.trim()) return;
        onNext();
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="fullName" className="mb-2 block">
            Nimi <span className="text-red-500">*</span>
          </label>
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
          <label htmlFor="phone" className="mb-2 block">
            Puhelin (valinnainen)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, phone: e.target.value }))
            }
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block">
            Sähköposti (valinnainen)
          </label>
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
          <label htmlFor="fromLocation" className="mb-2 block">
            Mistä (valinnainen)
          </label>
          <input
            id="fromLocation"
            name="fromLocation"
            autoComplete="address-line1"
            placeholder="Kaupunki tai postinumero"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.from_location || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, from_location: e.target.value }))
            }
          />
        </div>

        <div>
          <label htmlFor="toLocation" className="mb-2 block">
            Minne (valinnainen)
          </label>
          <input
            id="toLocation"
            name="toLocation"
            autoComplete="address-line1"
            placeholder="Kaupunki tai postinumero"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.to_location || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, to_location: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block">Kohteen koko (valinnainen)</label>
          <select
            id="apartmentSize"
            name="apartmentSize"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.apartment_size || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setData((d: QuoteData) => ({ ...d, apartment_size: e.target.value }))
            }
          >
            <option value="">Valitse</option>
            <option>Yksiö</option>
            <option>Kaksio</option>
            <option>Kolmio</option>
            <option>Neliö+</option>
            <option>Toimisto</option>
          </select>
        </div>

        <div>
          <label htmlFor="squareMeters" className="mb-2 block">
            Pinta-ala (m²)
          </label>
          <input
            id="squareMeters"
            name="squareMeters"
            type="number"
            min="0"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.square_meters || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, square_meters: e.target.value }))
            }
          />
        </div>

        <div>
          <label htmlFor="floor" className="mb-2 block">
            Kerros
          </label>
          <input
            id="floor"
            name="floor"
            type="number"
            min="0"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.floor || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, floor: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block">Onko hissiä?</label>
          <select
            id="hasElevator"
            name="hasElevator"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.has_elevator || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setData((d: QuoteData) => ({ ...d, has_elevator: e.target.value }))
            }
          >
            <option value="">Valitse</option>
            <option value="yes">Kyllä</option>
            <option value="no">Ei (vain portaat)</option>
          </select>
        </div>

        <div>
          <label htmlFor="boxCount" className="mb-2 block">
            Arvioitu laatikkomäärä
          </label>
          <input
            id="boxCount"
            name="boxCount"
            type="number"
            min="0"
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.box_count || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, box_count: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-2 block">Muuttopäivä (valinnainen)</label>
          <input
            id="moveDate"
            name="moveDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="border-strokedark focus:border-primary dark:border-stroke w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-hidden"
            value={data.moving_date || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData((d: QuoteData) => ({ ...d, moving_date: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-primary rounded-full px-7.5 py-3 text-white transition-all duration-300 hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50" type="submit">
          Jatka
        </button>
      </div>
    </form>
  );
}
