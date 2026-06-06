'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/app/context/SiteConfigContext';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const siteConfig = useSiteConfig();

  useEffect(() => {
    // Check if consent is already given
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Small delay to prevent layout shift annoyance immediately on load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 z-[1000] w-full bg-white p-6 shadow-2xl dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-full duration-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row px-4">
        <div className="text-sm text-gray-600 dark:text-gray-300 md:max-w-3xl">
          <p>
            Käytämme evästeitä parantaaksemme käyttökokemustasi ja analysoidaksemme sivuston liikennettä.
            Jatkamalla sivuston käyttöä hyväksyt evästeiden käytön.
            Lue lisää <Link href="/tietosuoja" className="text-primary hover:underline">tietosuojaselosteestamme</Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <button
            onClick={acceptCookies}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 transition-colors"
          >
            Hyväksy
          </button>
        </div>
      </div>
    </div>
  );
}
