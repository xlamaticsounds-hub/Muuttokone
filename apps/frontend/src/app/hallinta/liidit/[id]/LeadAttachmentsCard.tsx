'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteLeadAttachment } from '@/server/offer-actions';
import ImagePicker, { type PickedImage } from '../../ImagePicker';
import { primaryButton } from '../../form-styles';

export type AttachmentDto = { id: string; name: string; size: number; createdAt: string };

// Liidin sivun kuvakortti: kuvakaappaukset asiakkaan kanssa käydystä keskustelusta. Kuvat haetaan
// kirjautumista vaativasta reitistä, koska niissä on asiakkaan henkilötietoja.
export default function LeadAttachmentsCard({ leadId, attachments }: { leadId: string; attachments: AttachmentDto[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    picked.forEach((img) => form.append('images', img.file, img.file.name));
    try {
      const res = await fetch(`/api/hallinta/liidit/${leadId}/liitteet`, { method: 'POST', body: form });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message ?? 'Kuvien tallennus epäonnistui.');
      } else {
        picked.forEach((img) => URL.revokeObjectURL(img.url));
        setPicked([]);
        router.refresh();
      }
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (attachment: AttachmentDto) => {
    if (!window.confirm('Poistetaanko kuva pysyvästi?')) return;
    setBusyId(attachment.id);
    setError(null);
    try {
      const result = await deleteLeadAttachment(attachment.id);
      if (result.success) router.refresh();
      else setError(result.message);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {attachments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Ei kuvia. Lisää kuvakaappauksia asiakkaan kanssa käydystä keskustelusta.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {attachments.map((a) => (
            <li key={a.id} className="relative">
              <a
                href={`/api/hallinta/liitteet/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/hallinta/liitteet/${a.id}`} alt={a.name} loading="lazy" className="h-full w-full object-cover object-top transition-transform hover:scale-105" />
              </a>
              <button
                type="button"
                onClick={() => remove(a)}
                disabled={busyId === a.id}
                aria-label={`Poista kuva ${a.name}`}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImagePicker images={picked} onChange={setPicked} disabled={uploading} enablePaste={false} compact />
      {picked.length > 0 && (
        <button type="button" onClick={upload} disabled={uploading} className={primaryButton}>
          {uploading ? 'Tallennetaan…' : `Tallenna kuvat (${picked.length})`}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
