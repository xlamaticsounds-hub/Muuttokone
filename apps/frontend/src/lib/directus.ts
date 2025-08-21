// Enhanced Directus client with SDK for server-side operations
import 'server-only';
import { createDirectus, rest, staticToken, readItems, createItem, updateItem, deleteItem, uploadFiles } from '@directus/sdk';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Server API URL (used by server-side fetches). In Docker this should point to the directus container (http://directus:8055).
export const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;

// Public URL used for browser asset requests. Prefer NEXT_PUBLIC_DIRECTUS_URL, then DIRECTUS_PUBLIC_URL, otherwise fall back to DIRECTUS_URL.
export const DIRECTUS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_PUBLIC_URL || DIRECTUS_URL;

// Initialize Directus SDK client
export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN || ''));

// Legacy fetch function for backwards compatibility
type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  next?: { revalidate?: number; tags?: string[] };
};

export async function directusFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  if (!DIRECTUS_TOKEN) {
    throw new Error('DIRECTUS_TOKEN is required for server-side operations');
  }
  
  const url = `${DIRECTUS_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

// SDK-based operations for better type safety and performance
export async function getItems<T = any>(collection: string, options?: any): Promise<T[]> {
  const items = await directus.request(readItems(collection, options));
  return items as T[];
}

export async function createDirectusItem<T = any>(collection: string, data: any): Promise<T> {
  const item = await directus.request(createItem(collection, data));
  return item as T;
}

export async function updateDirectusItem<T = any>(collection: string, id: string | number, data: any): Promise<T> {
  const item = await directus.request(updateItem(collection, id, data));
  return item as T;
}

export async function deleteDirectusItem(collection: string, id: string | number): Promise<void> {
  await directus.request(deleteItem(collection, id));
}

export async function uploadFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  return directus.request(uploadFiles(formData));
}

// Unified form submission helpers
export type NewsletterSubmission = {
  email: string;
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
};

export type LeadSubmission = {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  message?: string;
  service_type?: string;
  moving_date?: string;
  from_location?: string;
  to_location?: string;
  apartment_size?: string;
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  files?: string[];
};

export async function submitNewsletter(data: NewsletterSubmission): Promise<void> {
  await createDirectusItem('newsletter_email_addresses', {
    ...data,
    date_created: new Date().toISOString(),
    status: 'active'
  });
}

export async function submitLead(data: LeadSubmission): Promise<void> {
  await createDirectusItem('leads', {
    ...data,
    date_created: new Date().toISOString(),
    status: 'new'
  });
}
