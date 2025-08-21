'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { SiteConfigProvider } from '@/app/context/SiteConfigContext';
import type { SiteConfig } from '@/config/site';

export function Providers({
  children,
  siteConfig,
}: {
  children: React.ReactNode;
  siteConfig: SiteConfig;
}) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      <SessionProvider>
        <SiteConfigProvider value={siteConfig}>{children}</SiteConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
