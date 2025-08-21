// Enhanced Directus client with SDK for server-side operations
import 'server-only';
import { createDirectus, rest, staticToken, readItems, createItem, updateItem, deleteItem, uploadFiles } from '@directus/sdk';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Server API URL (used by server-side fetches). In Docker this should point to the directus container (http://directus:8055).
export const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_STATIC_TOKEN = "vqkAGSPnacsu9ozlqQ3pUDidigJ3-b22";

// Public URL used for browser asset requests. Prefer NEXT_PUBLIC_DIRECTUS_URL, then DIRECTUS_PUBLIC_URL, otherwise fall back to DIRECTUS_URL.
export const DIRECTUS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_PUBLIC_URL || DIRECTUS_URL;

// Initialize Directus SDK client
export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken("vqkAGSPnacsu9ozlqQ3pUDidigJ3-b22"));

// Legacy fetch function for backwards compatibility
type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  next?: { revalidate?: number; tags?: string[] };
};

export async function directusFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  if (!DIRECTUS_STATIC_TOKEN) {
    throw new Error('DIRECTUS_TOKEN is required for server-side operations');
  }
  
  const url = `${DIRECTUS_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (DIRECTUS_STATIC_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_STATIC_TOKEN}`;

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
  name?: string;
  email?: string | null;
  phone?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  apartment_size?: string | null;
  moving_date?: string | null;
  message?: string | null;
  service_type?: string;
  source?: string;
  ip?: string;
  user_agent?: string;
  files?: string[];
};

export async function submitNewsletter(data: NewsletterSubmission): Promise<void> {
  await createDirectusItem('newsletter_email_addresses', {
    email: data.email,
    status: 'active',
    source: data.source || null,
    utm_campaign: data.utm_campaign || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
  });
}

export async function submitLead(data: LeadSubmission): Promise<void> {
  await createDirectusItem('leads', {
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    from_location: data.from_location || null,
    to_location: data.to_location || null,
    apartment_size: data.apartment_size || null,
    moving_date: data.moving_date || null,
    message: data.message || null,
    service_type: data.service_type || null,
    source: data.source || null,
    ip: data.ip || null,
    user_agent: data.user_agent || null,
    files: data.files || null,
    status: 'new',
  });
}
