'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { createInvoice, updateInvoice } from '@/server/invoice-actions';
import { computeInvoiceTotals } from '@/lib/invoice';

const VAT_RATE = 0.255;

type Row = { id: string; description: string; amount: string; vatRate: number };

export type ExistingInvoice = {
  id: string;
  contactId: string | null;
  customerName: string;
  customerStreet: string | null;
  customerPostalCode: string | null;
  customerCity: string | null;
  customerEmail: string | null;
  items: { description: string; amount: number; vatRate: number }[];
  dueDate: string | null; // ISO-päivämäärä
  serviceDate: string | null; // ISO-päivämäärä
};

type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

function initialRows(invoice: ExistingInvoice | undefined): Row[] {
  if (invoice && invoice.items.length > 0) {
    return invoice.items.map((item) => ({ id: newId(), description: item.description, amount: String(item.amount), vatRate: item.vatRate }));
  }
  return [{ id: newId(), description: '', amount: '', vatRate: VAT_RATE }];
}

export default function NewInvoiceForm({
  contacts,
  invoice,
}: {
  contacts: ContactOption[];
  invoice?: ExistingInvoice;
}) {
  const router = useRouter();
  const [nameQuery, setNameQuery] = useState(invoice?.customerName ?? '');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(invoice?.contactId ?? null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rows, setRows] = useState<Row[]>(initialRows(invoice));
  const [street, setStreet] = useState(invoice?.customerStreet ?? '');
  const [postalCode, setPostalCode] = useState(invoice?.customerPostalCode ?? '');
  const [city, setCity] = useState(invoice?.customerCity ?? '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail ?? '');
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? invoice.dueDate.split('T')[0] : defaultDueDate());
  const [serviceDate, setServiceDate] = useState(invoice?.serviceDate ? invoice.serviceDate.split('T')[0] : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q || selectedContactId) return [];
    return contacts.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [nameQuery, contacts, selectedContactId]);

  const pickContact = (contact: ContactOption) => {
    setSelectedContactId(contact.id);
    setNameQuery(contact.name);
    setStreet(contact.street ?? '');
    setPostalCode(contact.postalCode ?? '');
    setCity(contact.city ?? '');
    setCustomerEmail(contact.email ?? '');
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    setSelectedContactId(null);
    setShowSuggestions(true);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { id: newId(), description: '', amount: '', vatRate: VAT_RATE }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const totals = computeInvoiceTotals(
    rows.map((r) => ({ description: r.description, amount: parseFloat(r.amount.replace(',', '.')) || 0, vatRate: r.vatRate })),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameQuery.trim()) {
      setError('Anna asiakkaan nimi.');
      return;
    }

    const items = rows
      .map((r) => ({ description: r.description.trim(), amount: parseFloat(r.amount.replace(',', '.')), vatRate: r.vatRate }))
      .filter((r) => r.description && Number.isFinite(r.amount) && r.amount > 0);

    if (items.length === 0) {
      setError('Lisää vähintään yksi rivi, jossa on selite ja summa.');
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        contactId: selectedContactId,
        customerName: nameQuery.trim(),
        customerStreet: street.trim() || null,
        customerPostalCode: postalCode.trim() || null,
        customerCity: city.trim() || null,
        customerEmail: customerEmail.trim() || null,
        items,
        dueDate: dueDate || null,
        serviceDate: serviceDate || null,
      };
      const { id } = invoice ? await updateInvoice(invoice.id, input) : await createInvoice(input);
      router.push(`/hallinta/laskutus/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : (invoice ? 'Laskun tallennus epäonnistui.' : 'Laskun luonti epäonnistui.'));
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Katuosoite</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Esim. Postintie 12 A9"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Postinumero</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="00100"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Postitoimipaikka</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Helsinki"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Sähköposti</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="asiakas@example.com"
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase text-gray-500 mb-2">Rivit</label>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700">
              <th className="py-2">Selite</th>
              <th className="py-2 text-right">ALV</th>
              <th className="py-2 text-right">Summa (sis. alv)</th>
              <th className="w-8 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    placeholder="Esim. Kuljetus, Kierrätysmaksu..."
                    className="w-full bg-transparent text-gray-900 focus:outline-none dark:text-white"
                  />
                </td>
                <td className="py-2 text-right">
                  <select
                    value={row.vatRate}
                    onChange={(e) => updateRow(row.id, { vatRate: Number(e.target.value) })}
                    className="bg-transparent text-right text-gray-700 focus:outline-none dark:text-gray-300"
                  >
                    <option value={VAT_RATE}>25,5 %</option>
                    <option value={0}>0 %</option>
                  </select>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                      placeholder="0.00"
                      className="w-24 bg-transparent text-right font-medium text-gray-900 focus:outline-none dark:text-white"
                    />
                    <span className="text-gray-500">€</span>
                  </div>
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Poista rivi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" /> Lisää rivi
        </button>

        <div className="ml-auto mt-4 max-w-xs space-y-1 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Veroton hinta</span>
            <span>{totals.net.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>ALV</span>
            <span>{totals.vat.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
            <span>Yhteensä</span>
            <span>{totals.gross.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Eräpäivä</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Suorituspäivä (jos eri kuin laskun päiväys)</label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? (invoice ? 'Tallennetaan...' : 'Luodaan...') : invoice ? 'Tallenna muutokset' : 'Luo lasku'}
      </button>
    </form>
  );
}
