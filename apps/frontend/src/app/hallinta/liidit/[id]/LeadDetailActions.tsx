'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadDetails } from '@/server/actions';
import { Lead, Contact } from '@prisma/client';

export default function LeadDetailActions({ 
  lead 
}: { 
  lead: Lead & { contact: Contact } 
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Lähetä tarjous
        </button>
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
