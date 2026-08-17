'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import { renderQuoteEmailHtml, type QuoteEmailParams } from '@/lib/quote-email';
import { getQuoteEmailPreviewData, sendQuoteEmail } from '@/server/send-quote';

type PreviewData = { contactEmail: string | null } & Omit<QuoteEmailParams, 'customMessage'>;

export default function QuoteEmailPreviewModal({
  leadId,
  onClose,
  onSent,
}: {
  leadId: string;
  onClose: () => void;
  onSent: (sentTo: string) => void;
}) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuoteEmailPreviewData(leadId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Esikatselun lataus epäonnistui.');
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const previewHtml = useMemo(() => {
    if (!data) return '';
    const body = renderQuoteEmailHtml({ ...data, customMessage });
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#f9fafb;">${body}</body></html>`;
  }, [data, customMessage]);

  const handleSend = async () => {
    if (!data?.contactEmail) return;
    setSending(true);
    setSendError(null);
    try {
      const result = await sendQuoteEmail(leadId, customMessage);
      if (result.success) {
        onSent(result.sentTo);
      } else {
        setSendError(result.message);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Lähetys epäonnistui.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tarjouksen esikatselu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadError ? (
          <div className="flex-1 p-6 text-sm text-red-600 dark:text-red-400">{loadError}</div>
        ) : !data ? (
          <div className="flex-1 p-6 text-sm text-gray-500 dark:text-gray-400">Ladataan esikatselua...</div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="flex w-full flex-col gap-3 border-b border-gray-200 p-6 sm:w-80 sm:border-b-0 sm:border-r dark:border-gray-700">
              <div>
                <label className="block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Lisäteksti asiakkaalle (valinnainen)
                </label>
                <p className="mb-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Näkyy hintalaatikon alla — esim. selitys miksi hinta on tietyn suuruinen.
                </p>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  placeholder="Esim. Hinta sisältää täyden kantopalvelun ja huonekalujen purku/kasauksen..."
                  className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-4">
                {sendError && <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>}
                <button
                  onClick={handleSend}
                  disabled={sending || !data.contactEmail}
                  title={!data.contactEmail ? 'Liidillä ei ole sähköpostiosoitetta' : undefined}
                  className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Lähetetään...' : `Lähetä osoitteeseen ${data.contactEmail ?? '-'}`}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
              <iframe title="Tarjouksen esikatselu" srcDoc={previewHtml} className="h-full w-full border-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
