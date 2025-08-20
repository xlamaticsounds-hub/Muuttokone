"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { QuoteData } from ".";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";

type Props = {
  data: QuoteData;
  setData: Dispatch<SetStateAction<QuoteData>>;
  onBack: () => void;
};

export default function Step2({ data, setData, onBack }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files]
  );

  const submit = async () => {
    try {
      const formData = new FormData();
      formData.set("payload", JSON.stringify(data));
      files.forEach((f) => formData.append("images", f));
      const res = await axios.post("/api/quote", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200) {
        toast.success(
          "Kiitos! Järjestelmämme laskee parasta tarjousta ja palaamme sähköpostitse."
        );
      } else {
        toast.error("Lähetys epäonnistui.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data || "Virhe lähetyksessä");
    }
  };

  const toggleService = (s: string) => {
    setData((d) => {
      const list = new Set(d.services || []);
      list.has(s) ? list.delete(s) : list.add(s);
      return { ...d, services: Array.from(list) };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block">Lisäpalvelut</label>
          <div className="flex flex-wrap gap-2">
            {[
              "Pakkaus",
              "Siivous",
              "Muuttolaatikot",
              "Varastointi",
              "Pianon siirto",
              "Nosturi"
            ].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`rounded-full border px-4 py-2 ${data.services?.includes(s) ? "bg-primary text-white border-primary" : "border-strokedark"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block">Inventaario / huomioita</label>
          <textarea
            rows={6}
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.inventory || ""}
            onChange={(e) => setData((d) => ({ ...d, inventory: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-2 block">Hissi olemassa?</label>
          <select
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.elevator ? "kylla" : data.elevator === false ? "ei" : ""}
            onChange={(e) => setData((d) => ({ ...d, elevator: e.target.value === "kylla" }))}
          >
            <option value="">Valitse</option>
            <option value="kylla">Kyllä</option>
            <option value="ei">Ei</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block">Kantomatka (arvio)</label>
          <input
            placeholder="esim. 30 m"
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.distance || ""}
            onChange={(e) => setData((d) => ({ ...d, distance: e.target.value }))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block">Lisähuomiot</label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.notes || ""}
            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block">Yhteydenoton toiveet (valinnainen)</label>
          <input
            className="w-full rounded-lg border border-strokedark bg-transparent px-4 py-3 focus:border-primary focus:outline-hidden dark:border-stroke"
            value={data.contactNotes || ""}
            onChange={(e) => setData((d) => ({ ...d, contactNotes: e.target.value }))}
            placeholder="Paras soittoaika, muut toiveet..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block">Lisää kuvia (valinnainen)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const fl = Array.from(e.target.files || []);
              setFiles(fl);
            }}
          />
          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt={`liite ${i + 1}`}
                  className="h-20 w-20 rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button className="rounded-full border border-strokedark px-7.5 py-3" type="button" onClick={onBack}>
          Takaisin
        </button>
        <button className="rounded-full bg-primary px-7.5 py-3 text-white" type="button" onClick={submit}>
          Lähetä
        </button>
      </div>
    </div>
  );
}
