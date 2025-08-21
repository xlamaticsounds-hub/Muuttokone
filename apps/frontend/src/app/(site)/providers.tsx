'use client';

import React from 'react';
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
      <SiteConfigProvider value={siteConfig}>{children}</SiteConfigProvider>
    </ThemeProvider>
  );
}
