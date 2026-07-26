'use client';

import React from 'react';
import { SiteConfigProvider } from '@/app/context/SiteConfigContext';
import { LocaleProvider, type Locale } from '@/i18n/LocaleContext';
import type { SiteConfig } from '@/config/site';

export function Providers({
  children,
  siteConfig,
  initialLocale,
}: {
  children: React.ReactNode;
  siteConfig: SiteConfig;
  initialLocale: Locale;
}) {
  return (
    <SiteConfigProvider value={siteConfig}>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </SiteConfigProvider>
  );
}
