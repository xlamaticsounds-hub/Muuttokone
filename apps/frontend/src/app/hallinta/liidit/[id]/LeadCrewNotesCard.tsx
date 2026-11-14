'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat } from 'lucide-react';
import { setCrewNotes } from '@/server/team-actions';
import { cardClass, primaryButton, textareaClass } from '../../form-styles';

// Ohjeet partiolle: näkyvät partiosivulla keikan kohdalla. Liidin omat lisätiedot eivät näy partiolle
// (niissä on hintoja), joten keikalla tarvittava tieto kirjoitetaan tähän.
export default function LeadCrewNotesCard({ leadId, initial }: { leadId: string; initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = value.trim() !== (initial ?? '').trim();

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = await setCrewNotes(leadId, value);
    setSaving(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    setMessage('Tallennettu.');
    router.refresh();
  };

  return (
    <section className={cardClass}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <HardHat className="h-5 w-5 text-gray-400" />
        Ohjeet partiolle
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Näkyy partionjohtajalle keikan kohdalla: ovikoodi, pysäköinti, raskaat esineet, avainten luovutus. Älä kirjoita tähän hintoja.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        className={textareaClass}
        placeholder="Esim. Ovikoodi 1234, pysäköinti pihaan, piano 3. kerroksessa."
      />
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving || !dirty} className={primaryButton}>
          {saving ? 'Tallennetaan…' : 'Tallenna ohjeet'}
        </button>
        {message && <span className="text-sm text-gray-600 dark:text-gray-300">{message}</span>}
      </div>
    </section>
  );
}
