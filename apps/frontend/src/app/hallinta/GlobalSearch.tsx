'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { SearchResults } from '@/app/api/hallinta/haku/route';

const EMPTY: SearchResults = { leads: [], contacts: [], invoices: [] };

export default function GlobalSearch({ className = '', autoFocus = false, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hallinta/haku?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults(await res.json());
        setFailed(false);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
  };
  const total = results.leads.length + results.contacts.length + results.invoices.length;
  const searched = query.trim().length >= 2;

  const group = (title: string, items: { id: string; title: string; subtitle: string; extra?: string }[], href: (id: string) => string) =>
    items.length > 0 && (
      <div className="py-1">
        <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
        {items.map((item) => (
          <Link key={item.id} href={href(item.id)} onClick={close} className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {item.title}
              {item.extra && <span className="ml-2 text-xs font-normal text-gray-500">{item.extra}</span>}
            </p>
            {item.subtitle && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>}
          </Link>
        ))}
      </div>
    );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Hae liidejä, asiakkaita, laskuja..."
        aria-label="Hae"
        autoFocus={autoFocus}
        className="w-full rounded-full border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-base text-gray-600 sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:text-gray-300"
      />
      {open && searched && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {loading && total === 0 && <p className="px-4 py-3 text-sm text-gray-500">Haetaan...</p>}
          {failed && !loading && <p className="px-4 py-3 text-sm text-red-600">Haku epäonnistui.</p>}
          {!loading && !failed && total === 0 && <p className="px-4 py-3 text-sm text-gray-500">Ei tuloksia.</p>}
          {group('Liidit', results.leads.map((l) => ({ ...l, extra: l.status })), (id) => `/hallinta/liidit/${id}`)}
          {group('Asiakkaat', results.contacts, () => '/hallinta/asiakkaat')}
          {group('Laskut', results.invoices, (id) => `/hallinta/laskutus/${id}`)}
        </div>
      )}
    </div>
  );
}
