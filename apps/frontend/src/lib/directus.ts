// Minimal Directus REST helper for server-side fetches
import 'server-only';

// Server API URL (used by server-side fetches). In Docker this should point to the directus container (http://directus:8055).
export const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

// Public URL used for browser asset requests. Prefer NEXT_PUBLIC_DIRECTUS_URL, then DIRECTUS_PUBLIC_URL, otherwise fall back to DIRECTUS_URL.
export const DIRECTUS_PUBLIC_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_PUBLIC_URL || DIRECTUS_URL;

type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  next?: { revalidate?: number };
};

export async function directusFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${DIRECTUS_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };
  if (DIRECTUS_TOKEN) headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body,
    cache: opts.cache,
    next: opts.next,
  } as RequestInit);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Directus request failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function assetUrl(id?: string, params?: Record<string, string | number | boolean>, opts?: { direct?: boolean }) {
  if (!id) return undefined;
  const useDirect = opts?.direct;
  const base = useDirect
    ? `${DIRECTUS_PUBLIC_URL.replace(/\/$/, "")}/assets/${id}`
    : `/api/asset/${id}`;
  if (!params) return base;
  const qs = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  return `${base}${qs ? `?${qs}` : ""}`;
}
