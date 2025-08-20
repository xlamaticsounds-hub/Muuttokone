"use client";

import React, { createContext, useContext } from "react";
import { siteConfig as localSiteConfig, type SiteConfig } from "@/config/site";

const SiteConfigContext = createContext<SiteConfig>(localSiteConfig);

export function SiteConfigProvider({ value, children }: { value: SiteConfig; children: React.ReactNode }) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
