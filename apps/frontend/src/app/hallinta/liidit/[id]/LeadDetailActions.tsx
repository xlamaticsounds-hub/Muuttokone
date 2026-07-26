'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadDetails } from '@/server/actions';
import { sendQuoteEmail } from '@/server/send-quote';
import { parseLeadFormData, getStoredPrice } from '@/server/lead-format';
import { Lead, Contact } from '@prisma/client';

export default function LeadDetailActions({
  lead
}: {
  lead: Lead & { contact: Contact }
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const alreadySent = lead.status === 'PROPOSAL_SENT' || lead.status === 'WON';
  const pfd = parseLeadFormData(lead.formData);
  const { confirmed: confirmedPrice, low: estimateLow, high: estimateHigh } = getStoredPrice(pfd);

  const handleSendQuote = async () => {
    if (!lead.contact.email) return;
    const confirmed = window.confirm(
      `Lähetetäänkö tarjous sähköpostitse osoitteeseen ${lead.contact.email}?`,
    );
    if (!confirmed) return;

    setSendingQuote(true);
    setQuoteFeedback(null);
    try {
      const result = await sendQuoteEmail(lead.id);
      if (result.success) {
        setQuoteFeedback({ ok: true, message: `Tarjous lähetetty osoitteeseen ${result.sentTo}.` });
        router.refresh();
      } else {
        setQuoteFeedback({ ok: false, message: result.message });
      }
    } catch (err) {
      // Ei pitäisi tapahtua (sendQuoteEmail ei enää heitä), mutta varmuuden vuoksi.
      setQuoteFeedback({ ok: false, message: err instanceof Error ? err.message : 'Lähetys epäonnistui.' });
    } finally {
      setSendingQuote(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await updateLeadDetails(lead.id, data);
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Tallennus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="mb-1 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50">
          {confirmedPrice !== null ? (
            <>
              <span className="text-gray-500 dark:text-gray-400">Vahvistettu hinta: </span>
              <span className="font-semibold text-gray-900 dark:text-white">{confirmedPrice} €</span>
            </>
          ) : estimateLow !== null && estimateHigh !== null ? (
            <>
              <span className="text-gray-500 dark:text-gray-400">Ei vahvistettua hintaa — laskurin arvio: </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{estimateLow}–{estimateHigh} €</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Ei hintaa vielä asetettu.</span>
          )}
        </div>
        <button
          onClick={handleSendQuote}
          disabled={sendingQuote || !lead.contact.email}
          title={!lead.contact.email ? 'Liidillä ei ole sähköpostiosoitetta' : undefined}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendingQuote
            ? 'Lähetetään...'
            : alreadySent
              ? 'Lähetä tarjous uudelleen'
              : 'Lähetä tarjous'}
        </button>
        {quoteFeedback && (
          <p className={`text-sm ${quoteFeedback.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {quoteFeedback.message}
          </p>
        )}
        {alreadySent && !quoteFeedback && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Tarjous on jo lähetetty tälle liidille.</p>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Muokkaa tietoja
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">Muokkaa liidiä</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <label className="block text-xs font-medium text-blue-700 uppercase dark:text-blue-300">
                  Vahvistettu hinta (€) — ohittaa laskurin arvion sähköpostitse lähetettävässä tarjouksessa
                </label>
                <input
                  type="number"
                  step="1"
                  name="confirmedPrice"
                  placeholder={estimateLow !== null && estimateHigh !== null ? `Laskurin arvio: ${estimateLow}–${estimateHigh}` : 'Esim. 450'}
                  defaultValue={confirmedPrice ?? ''}
                  className="mt-1 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm dark:border-blue-800 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Jätä tyhjäksi jos haluat että sähköpostissa näkyy laskurin arvioima hintahaarukka.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Mistä</label>
                  <input
                    name="fromAddress"
                    defaultValue={lead.fromAddress || ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Minne</label>
                  <input
                    name="toAddress"
                    defaultValue={lead.toAddress || ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Päivämäärä</label>
                  <input
                    type="date"
                    name="requestedDate"
                    defaultValue={lead.requestedDate ? new Date(lead.requestedDate).toISOString().split('T')[0] : ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Pinta-ala (m²)</label>
                  <input
                    type="number"
                    name="squareMeters"
                    defaultValue={lead.squareMeters || ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Kerros</label>
                  <input
                    type="number"
                    name="floor"
                    defaultValue={lead.floor ?? ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Hissi</label>
                  <select
                    name="hasElevator"
                    defaultValue={String(lead.hasElevator)}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">Kyllä</option>
                    <option value="false">Ei</option>
                    <option value="null">-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Laatikot (kpl)</label>
                  <input
                    type="number"
                    name="boxCount"
                    defaultValue={lead.boxCount ?? ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Tilavuus (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="volumeM3"
                    defaultValue={lead.volumeM3 ?? ''}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Huomiot</label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={lead.notes || ''}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Tallennetaan...' : 'Tallenna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
