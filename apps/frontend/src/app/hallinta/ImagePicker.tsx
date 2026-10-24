'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export type PickedImage = { id: string; file: File; url: string };

const MAX_SIDE = 1600; // leveys riittää kuvakaappausten tekstille
const MAX_PIXELS = 6_000_000; // pitkät, rullatut kuvakaappaukset pienennetään
const KEEP_ORIGINAL_BYTES = 1_500_000;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const newId = () => Math.random().toString(36).slice(2, 10);

/** Pienentää ison kuvan ennen lähetystä (nopeampi lähetys, pienempi tallennus). Pienet kuvat sellaisenaan. */
async function prepareImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / bitmap.width, Math.sqrt(MAX_PIXELS / (bitmap.width * bitmap.height)));
  if (scale === 1 && file.size <= KEEP_ORIGINAL_BYTES && ACCEPTED.includes(file.type)) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#ffffff'; // läpinäkyvät PNG:t valkoiselle pohjalle
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('toBlob');
  const base = file.name.replace(/\.[a-zA-Z0-9]{1,5}$/, '') || 'kuva';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

// Kuvien valinta: tiedostovalitsin (puhelimella myös kamera/galleria), raahaus ja liittäminen
// leikepöydältä (Ctrl+V / Cmd+V). Kuvat pienennetään selaimessa ennen lähetystä.
export default function ImagePicker({
  images,
  onChange,
  max = 8,
  disabled = false,
  enablePaste = true,
  compact = false,
}: {
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  max?: number;
  disabled?: boolean;
  enablePaste?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Liittämisen kuuntelija elää pidempään kuin yksi renderöinti: viimeisimmät arvot refeistä
  const latest = useRef(images);
  latest.current = images;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const addFiles = async (files: File[]) => {
    const candidates = files.filter((f) => f.type.startsWith('image/'));
    if (candidates.length === 0) return;
    setError(null);
    const room = max - latest.current.length;
    if (room <= 0) {
      setError(`Enintään ${max} kuvaa.`);
      return;
    }
    if (candidates.length > room) setError(`Enintään ${max} kuvaa: ${candidates.length - room} jätettiin pois.`);
    setProcessing(true);
    const added: PickedImage[] = [];
    for (const file of candidates.slice(0, room)) {
      try {
        const prepared = await prepareImage(file);
        added.push({ id: newId(), file: prepared, url: URL.createObjectURL(prepared) });
      } catch {
        setError(`Kuvaa ${file.name} ei voitu lukea. Käytä JPEG- tai PNG-kuvaa (esim. kuvakaappaus).`);
      }
    }
    setProcessing(false);
    if (added.length > 0) onChangeRef.current([...latest.current, ...added]);
  };

  const remove = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(images.filter((img) => img.id !== id));
  };

  useEffect(() => {
    if (!enablePaste || disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return; // tavallinen tekstin liittäminen jatkuu normaalisti
      e.preventDefault();
      void addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePaste, disabled, max]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`rounded-lg border-2 border-dashed p-3 ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
      >
        {images.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.file.name} className="h-full w-full object-cover object-top" />
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  disabled={disabled}
                  aria-label={`Poista ${img.file.name}`}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2 py-2 text-center'}`}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || processing || images.length >= max}
            className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <ImagePlus className="h-4 w-4" />
            {processing ? 'Käsitellään…' : images.length > 0 ? 'Lisää kuvia' : 'Valitse kuvat'}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {enablePaste ? 'tai raahaa tähän tai liitä kuvakaappaus (Ctrl+V / ⌘V)' : 'tai raahaa kuvat tähän'} · enintään {max}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
