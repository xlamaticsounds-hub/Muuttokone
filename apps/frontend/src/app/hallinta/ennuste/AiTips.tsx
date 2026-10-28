'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { generateForecastAiTips } from '@/server/forecast-actions';
import type { ForecastAiResult } from '@/lib/forecast-ai';

export default function AiTips({
  initial,
  initialLabel,
  stale,
}: {
  initial: ForecastAiResult | null;
  /** Muotoiltu palvelimella, jottei selaimen ja palvelimen kellonaikamuoto eroa hydratoinnissa */
  initialLabel: string | null;
  /** Keikat ovat muuttuneet vinkkien jälkeen */
  stale: boolean;
}) {
  const [result, setResult] = useState(initial);
  const [label, setLabel] = useState(initialLabel);
  const [isStale, setIsStale] = useState(stale);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      setError(null);
      const res = await generateForecastAiTips();
      if (res.success) {
        setResult(res.result);
        setLabel(res.generatedLabel);
        setIsStale(false);
      } else {
        setError(res.message);
      }
    });

  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-900/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-900 dark:text-violet-200">
          <Sparkles className="h-4 w-4" /> AI-vinkit
        </p>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
          {pending ? 'Mietitään…' : result ? 'Päivitä' : 'Pyydä AI-vinkit'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {result ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Päivitetty {label}
            {isStale && <span className="ml-1 font-semibold text-amber-700 dark:text-amber-300">· keikat ovat muuttuneet, päivitä vinkit</span>}
          </p>
          {result.summary && <p className="text-sm text-gray-800 dark:text-gray-200">{result.summary}</p>}
          <ul className="space-y-2">
            {result.tips.map((tip, i) => (
              <li key={i} className="text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">{tip.title}</p>
                <p className="text-gray-600 dark:text-gray-300">{tip.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Tekoäly lukee tulevien keikkojen summat ja päivät (ei asiakastietoja) ja ehdottaa, mitä voisi tehdä paremmin.
          </p>
        )
      )}
    </div>
  );
}
