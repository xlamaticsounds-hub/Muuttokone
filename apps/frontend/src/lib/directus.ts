// Minimal Directus REST helper for server-side fetches
import 'server-only';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Server API URL (used by server-side fetches). In Docker this should point to the directus container (http://directus:8055).
export const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

// Public URL used for browser asset requests. Prefer NEXT_PUBLIC_DIRECTUS_URL, then DIRECTUS_PUBLIC_URL, otherwise fall back to DIRECTUS_URL.
export const DIRECTUS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_PUBLIC_URL || DIRECTUS_URL;

type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  next?: { revalidate?: number; tags?: string[] };
};

export async function directusFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${DIRECTUS_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    ...(opts.headers || {}),
  };
  if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
    cache: opts.cache,
    next: opts.next,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Directus request failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// Cached read operations with collection-based tags
export const getCachedCollection = <T = any>(
  collection: string,
  options: {
    filter?: Record<string, any>;
    fields?: string[];
    limit?: number;
    sort?: string[];
  } = {},
) => {
  return unstable_cache(
    async () => {
      const params = new URLSearchParams();
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          params.append(`filter[${key}]`, String(value));
        });
      }
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.limit) params.append('limit', String(options.limit));
      if (options.sort) params.append('sort', options.sort.join(','));

      const query = params.toString();
      const path = `/items/${collection}${query ? `?${query}` : ''}`;

      return directusFetch<{ data: T[] }>(path);
    },
    [`collection-${collection}`, JSON.stringify(options)],
    {
      tags: [`collection:${collection}`],
      revalidate: 3600, // 1 hour default
    },
  )();
};

export const getCachedItem = <T = any>(collection: string, id: string, fields?: string[]) => {
  return unstable_cache(
    async () => {
      const params = new URLSearchParams();
      if (fields) params.append('fields', fields.join(','));

      const query = params.toString();
      const path = `/items/${collection}/${id}${query ? `?${query}` : ''}`;

      return directusFetch<{ data: T }>(path);
    },
    [`item-${collection}-${id}`, fields?.join(',') || ''],
    {
      tags: [`collection:${collection}`, `item:${collection}:${id}`],
      revalidate: 3600,
    },
  )();
};

// Cache invalidation helpers
export async function invalidateCollection(collection: string) {
  revalidateTag(`collection:${collection}`);
}

export async function invalidateItem(collection: string, id: string) {
  revalidateTag(`item:${collection}:${id}`);
  revalidateTag(`collection:${collection}`);
}

export function assetUrl(
  id?: string,
  params?: Record<string, string | number | boolean>,
  opts?: { direct?: boolean },
) {
  if (!id) return undefined;
  const useDirect = opts?.direct;
  const base = useDirect
    ? `${DIRECTUS_PUBLIC_URL.replace(/\/$/, '')}/assets/${id}`
    : `/api/asset/${id}`;
  if (!params) return base;
  const qs = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();
  return `${base}${qs ? `?${qs}` : ''}`;
}
