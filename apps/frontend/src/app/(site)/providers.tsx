'use client';

import React from 'react';
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
    <SiteConfigProvider value={siteConfig}>{children}</SiteConfigProvider>
  );
}
