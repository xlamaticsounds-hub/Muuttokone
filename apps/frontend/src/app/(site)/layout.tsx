import '../../css/style.css';
import NextTopLoader from 'nextjs-toploader';
import Header from '@/components/Header';
import ToasterContext from '@/app/context/ToastContext';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import React from 'react';
import { Providers } from './providers';
import { Inter, Outfit } from 'next/font/google';
import { siteConfig } from '@/config/site';
import Script from 'next/script';
import GA from '@/components/Analytics/GA';
import StructuredData from '@/components/SEO/StructuredData';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" suppressHydrationWarning className="h-full overflow-x-clip">
      <head>
        {/* Preconnect and preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/* Prefer AVIF when available, fallback to webp */}
        <link rel="preload" as="image" href="/images/webp/hero/hero.avif" type="image/avif" />
        <link rel="preload" as="image" href="/images/webp/hero/hero.avif" type="image/webp" />
      </head>
      <body
        className={`dark:bg-black ${inter.variable} ${outfit.variable} h-full overflow-x-hidden`}
      >
        <StructuredData type="LocalBusiness" />
        <ToasterContext />
        <Providers siteConfig={siteConfig}>
          <NextTopLoader color="#006BFF" crawlSpeed={300} showSpinner={false} shadow="none" />
          {/* Page background and decorative glows for depth */}
          <div className="relative min-h-screen">
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
          </div>
        </Providers>

        {/* Google Analytics (GA4) - enabled when NEXT_PUBLIC_GA_ID is set */}
        {process.env.NEXT_PUBLIC_GA_ID ? (
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
            <React.Suspense fallback={null}>
              <GA />
            </React.Suspense>
          </>
        ) : null}
      </body>
    </html>
  );
}
