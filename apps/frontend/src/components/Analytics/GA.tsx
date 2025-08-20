"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Minimal client-side route change tracker for GA4
export default function GA() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_ID) return;
    // Emit a page_view when path or query changes
    // @ts-ignore
    window.gtag?.("config", process.env.NEXT_PUBLIC_GA_ID, {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}
