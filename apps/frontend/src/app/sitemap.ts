import type { MetadataRoute } from 'next';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? 'https://muuttokone.fi';
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/palvelut` },
    { url: `${base}/tarjouspyynto` },
    { url: `${base}/yhteystiedot` },
  ];
}
