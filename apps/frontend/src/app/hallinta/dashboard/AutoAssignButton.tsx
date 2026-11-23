'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { autoAssignUnassignedLeads } from '@/server/team-actions';

// Jakamattomat-palkin nappi: jakaa avoimet keikat tiimeille osoitteen mukaan (pääkaupunkiseutu Helsingille,
// muut 100 km säteellä tiimille). Kauempana olevat jäävät jakamattomiksi.
export default function AutoAssignButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPending(true);
    setMessage(null);
    const result = await autoAssignUnassignedLeads();
    setPending(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    const left = result.left > 0 ? ` ${result.left} jäi jakamattomaksi (yli 100 km tai osoite ei tunnistu).` : '';
    setMessage(`${result.assigned} ${result.assigned === 1 ? 'keikka jaettiin' : 'keikkaa jaettiin'} tiimeille.${left}`);
    router.refresh();
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      {message && <span className="text-xs">{message}</span>}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="min-h-9 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100 dark:hover:bg-violet-900/40"
      >
        {pending ? 'Jaetaan…' : 'Jaa automaattisesti'}
      </button>
    </span>
  );
}
