// Simple cache helper: prefers Redis if REDIS_URL is set; falls back to in-memory.
// Safe for server-side usage only.
import 'server-only';

let redisClient: any | null = null;
const memory = new Map<string, { value: string; expiresAt: number }>();

const REDIS_URL = process.env.REDIS_URL;

async function getRedis(): Promise<any | null> {
  if (!REDIS_URL) return null;
  if (redisClient) return redisClient;
  try {
  // Use a static dynamic import so bundlers can statically analyze the dependency.
  const { createClient } = await import("redis");
  const client = createClient({ url: REDIS_URL });
    client.on("error", () => {});
    await client.connect();
    redisClient = client;
    return client;
  } catch {
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = await getRedis();
  if (r) {
    try {
      return (await r.get(key)) as string | null;
    } catch {
      // fallthrough to memory
    }
  }
  const hit = memory.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const r = await getRedis();
  if (r) {
    try {
      await r.set(key, value, { EX: ttlSeconds });
      return;
    } catch {
      // fallthrough
    }
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheGetJSON<T = any>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJSON(key: string, value: any, ttlSeconds: number): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}
