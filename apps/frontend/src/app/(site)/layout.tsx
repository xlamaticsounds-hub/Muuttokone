import NextTopLoader from 'nextjs-toploader';
import Header from '@/components/Header';
import ToasterContext from '@/app/context/ToastContext';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import React from 'react';
import { cookies } from 'next/headers';
import { Providers } from './providers';
import { siteConfig } from '@/config/site';
import { LOCALE_COOKIE, type Locale } from '@/i18n/LocaleContext';
import GA from '@/components/Analytics/GA';
import StructuredData from '@/components/SEO/StructuredData';
import CookieConsent from '@/components/CookieConsent';

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = localeCookie === 'en' ? 'en' : 'fi';

  return (
    <>
      <StructuredData type="LocalBusiness" />
      <ToasterContext />
      <Providers siteConfig={siteConfig} initialLocale={initialLocale}>
        <NextTopLoader color="#006BFF" crawlSpeed={300} showSpinner={false} shadow="none" />
        {/* Page background and decorative glows for depth */}
        <div className="site-zoom-out relative min-h-screen">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b from-gray-50 via-white to-white dark:from-[#0b0c0f] dark:via-[#0b0c0f] dark:to-black"
          />
          <div
            aria-hidden
            className="bg-primary/15 dark:bg-primary/20 pointer-events-none absolute top-[-240px] left-1/2 -z-10 h-[720px] w-[1100px] -translate-x-1/2 rounded-[999px] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-[20%] right-[-250px] -z-10 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-400/15"
          />

          <Header />
          {/* Ensure content clears fixed header height on all breakpoints */}
          <main className="pt-20 md:pt-20 lg:pt-16">{children}</main>
          <Footer />
          <ScrollToTop />
          <CookieConsent />
        </div>
      </Providers>

      {/* Google Analytics (GA4) - enabled when NEXT_PUBLIC_GA_ID is set; GA.tsx gates actual
          script loading on cookie consent */}
      {process.env.NEXT_PUBLIC_GA_ID ? (
        <React.Suspense fallback={null}>
          <GA />
        </React.Suspense>
      ) : null}
    </>
  );
}
