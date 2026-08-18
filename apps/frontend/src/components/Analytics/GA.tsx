'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Loads GA4 only after cookie consent has been granted (localStorage 'cookieConsent',
// see CookieConsent/index.tsx), and tracks SPA route changes once loaded.
export default function GA() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(localStorage.getItem('cookieConsent') === 'true');
    const onAccept = () => setConsented(true);
    // Custom event because the native `storage` event doesn't fire in the tab that wrote the value.
    window.addEventListener('cookieConsentAccepted', onAccept);
    return () => window.removeEventListener('cookieConsentAccepted', onAccept);
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_ID || !consented) return;
    // Emit a page_view when path or query changes
    // @ts-ignore
    window.gtag?.('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
    });
  }, [consented, pathname, searchParams]);

  if (!process.env.NEXT_PUBLIC_GA_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-setup" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}
