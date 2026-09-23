'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, CalendarClock, HelpCircle } from 'lucide-react';
import { generateLeadEmailSummaryAction } from '@/server/email-summary-actions';
import type { EmailSummaryData } from '@/server/email-summary';

export default function EmailSummarySection({
  leadId,
  customerEmail,
  initialSummary,
}: {
  leadId: string;
  customerEmail: string | null;
  initialSummary: EmailSummaryData | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<EmailSummaryData | null>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateLeadEmailSummaryAction(leadId);
      if (result.success) {
        setSummary(result.data);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yhteenvedon luonti epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  const formatGeneratedAt = (iso: string) =>
    new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Mail className="h-5 w-5 text-gray-400" />
          Yhteenveto sähköposteista
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading || !customerEmail}
          title={!customerEmail ? 'Liidillä ei ole sähköpostiosoitetta' : undefined}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Luodaan...' : summary ? 'Päivitä yhteenveto' : 'Luo yhteenveto'}
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        AI käy läpi tarjous@muuttokone.fi-postilaatikon ja asiakkaan väliset sähköpostit tämän liidin osalta
        ja poimii niistä sovitut ajat. Päivittyy myös automaattisesti kuuden tunnin välein.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {!summary && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Yhteenvetoa ei ole vielä luotu.</p>
      )}

      {summary && (
        <div className="space-y-5">
          <p className="text-sm text-gray-700 dark:text-gray-300">{summary.summary}</p>

          {summary.agreedDates.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <CalendarClock className="h-4 w-4" />
                Sovitut ajat
              </h3>
              <ul className="space-y-1.5">
                {summary.agreedDates.map((d, i) => (
                  <li key={i} className="flex gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50">
                    <span className="font-semibold text-gray-900 dark:text-white">{d.date}</span>
                    <span className="text-gray-600 dark:text-gray-400">— {d.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.openQuestions.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <HelpCircle className="h-4 w-4" />
                Avoimet kysymykset
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {summary.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Päivitetty {formatGeneratedAt(summary.generatedAt)} — {summary.messageCount} viestiä läpikäyty.
          </p>
        </div>
      )}
    </div>
  );
}
