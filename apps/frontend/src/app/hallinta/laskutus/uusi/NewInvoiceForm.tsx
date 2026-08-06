'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice } from '@/server/invoice-actions';

const VAT_RATE = 0.255;

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

export default function NewInvoiceForm({ contacts }: { contacts: { id: string; name: string; email: string | null }[] }) {
  const router = useRouter();
  const [nameQuery, setNameQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState(VAT_RATE);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q || selectedContactId) return [];
    return contacts.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [nameQuery, contacts, selectedContactId]);

  const pickContact = (contact: { id: string; name: string }) => {
    setSelectedContactId(contact.id);
    setNameQuery(contact.name);
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    setSelectedContactId(null);
    setShowSuggestions(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!nameQuery.trim()) {
      setError('Anna asiakkaan nimi.');
      return;
    }
    if (!description.trim()) {
      setError('Anna selite.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Anna kelvollinen summa.');
      return;
    }

    setSubmitting(true);
    try {
      const { id } = await createInvoice({
        contactId: selectedContactId,
        customerName: nameQuery.trim(),
        description: description.trim(),
        amount: parsedAmount,
        vatRate,
        dueDate: dueDate || null,
      });
      router.push(`/hallinta/laskutus/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laskun luonti epäonnistui.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="relative">
        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Asiakas</label>
        <input
          type="text"
          value={nameQuery}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Kirjoita asiakkaan nimi..."
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
        />
        {selectedContactId && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">Valittu olemassa olevista asiakkaista.</p>
        )}
        {!selectedContactId && nameQuery.trim() && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ei löydy listalta — käytetään kirjoittamaasi nimeä sellaisenaan.</p>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {suggestions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseDown={() => pickContact(c)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                  {c.email && <span className="ml-2 text-xs text-gray-500">{c.email}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Selite (mistä hinta tulee)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Esim. Muutto 15.8., Turvalukon asennus..."
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Summa (€, sis. alv)</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">ALV</label>
          <select
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          >
            <option value={VAT_RATE}>25,5 %</option>
            <option value={0}>0 %</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Eräpäivä</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Luodaan...' : 'Luo lasku'}
      </button>
    </form>
  );
}
