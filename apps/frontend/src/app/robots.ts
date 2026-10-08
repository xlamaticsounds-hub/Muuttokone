import type { MetadataRoute } from 'next';

// Pyynnön hetkellä (ei buildissa), jotta SITE_URL on käytettävissä — muuten sivukartan osoite
// jäi www-ttömäksi (ks. sitemap.ts).
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? 'https://www.muuttokone.fi';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/hallinta', '/api/auth'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
