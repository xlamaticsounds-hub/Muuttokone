'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, type Locale } from '@/i18n/LocaleContext';

const LANGUAGES: { code: Locale; flag: string; label: string }[] = [
  { code: 'fi', flag: '🇫🇮', label: 'SUOMI' },
  { code: 'en', flag: '🇬🇧', label: 'ENGLISH' },
];

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const choose = (code: Locale) => {
    setLocale(code);
    setOpen(false);
    // Server Components (e.g. Footer, homepage sections) only pick up the new
    // locale cookie on a fresh request — refresh so they re-render translated too.
    router.refresh();
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Vaihda kieli / Change language"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-lg transition-all hover:border-primary dark:border-gray-700"
      >
        <span aria-hidden>{current.flag}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => choose(lang.code)}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                lang.code === locale ? 'text-primary' : 'text-black/80 dark:text-white'
              }`}
            >
              <span className="text-base" aria-hidden>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
