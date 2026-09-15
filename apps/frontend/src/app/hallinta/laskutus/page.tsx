import Link from 'next/link';
import { prisma } from '@/server/db';
import { Plus } from 'lucide-react';
import LaskutusTable from './LaskutusTable';

export const dynamic = 'force-dynamic';

export default async function LaskutusPage() {
  let dbUnavailable = false;
  let invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];

  try {
    invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/laskutus] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laskutus</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Luodut laskut ja niiden viitenumerot.</p>
        </div>
        <Link
          href="/hallinta/laskutus/uusi"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Uusi lasku
        </Link>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta laskudata ei päivity.
        </div>
      )}

      <LaskutusTable invoices={invoices} />
    </div>
  );
}
