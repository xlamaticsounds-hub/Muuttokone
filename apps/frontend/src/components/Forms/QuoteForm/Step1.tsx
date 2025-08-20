"use client";
import { Dispatch, SetStateAction } from "react";
import { QuoteData } from ".";

type Props = {
  data: QuoteData;
  setData: Dispatch<SetStateAction<QuoteData>>;
  onNext: () => void;
};

export default function Step1({ data, setData, onNext }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
  if (!data.phone || !data.date) return;
  onNext();
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block">Nimi</label>
          <input
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.name || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block">Sähköposti</label>
          <input
            type="email"
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.email || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-2 block">Puhelin <span className="text-red-500">*</span></label>
          <input
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.phone || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, phone: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block">Mistä (postinumero)</label>
          <input
            placeholder="00100"
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.from || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, from: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block">Minne (postinumero)</label>
          <input
            placeholder="20100"
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.to || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, to: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block">Kohteen koko</label>
          <select
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.size || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData((d: QuoteData) => ({ ...d, size: e.target.value }))}
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
          <label className="mb-2 block">Muuttopäivä <span className="text-red-500">*</span></label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.date || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, date: e.target.value }))}
            required
          />
          <div className="mt-3 flex gap-2">
            {(["exact", "+/-3", "+/-7"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setData((d) => ({ ...d, dateFlex: opt }))}
                className={`rounded-full border px-3 py-1 text-sm ${data.dateFlex === opt ? "bg-primary text-white border-primary" : "border-strokedark"}`}
                aria-pressed={data.dateFlex === opt}
              >
                {opt === "exact" ? "Tarkka" : opt}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, isBusiness: e.target.checked }))}
            />
            <label htmlFor="isBusiness">Olen yritysasiakas</label>
          </div>
          {data.isBusiness && (
            <div className="mt-3">
              <label className="mb-2 block">Y-tunnus</label>
              <input
                className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
                value={data.businessId || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, businessId: e.target.value }))}
                required
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block">Lisätietoja lähtöosoitteesta (valinnainen)</label>
          <input
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.fromExtra || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, fromExtra: e.target.value }))}
            placeholder="Esim. porttikoodi, pitkät portaat, sisäpiha"
          />
        </div>
        <div>
          <label className="mb-2 block">Lisätietoja kohdeosoitteesta (valinnainen)</label>
          <input
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.toExtra || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData((d: QuoteData) => ({ ...d, toExtra: e.target.value }))}
            placeholder="Esim. pysäköinti, kantomatka, hissi"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-full bg-primary px-7.5 py-3 text-white" type="submit">
          Jatka
        </button>
      </div>
    </form>
  );
}
