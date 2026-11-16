import { buildLlmsTxt } from '@/features/seo/llmsTxt';

// Pyynnön hetkellä (ei buildissa), jotta SITE_URL on käytettävissä (kuten robots.ts).
export const dynamic = 'force-dynamic';

export function GET() {
  const siteUrl = process.env.SITE_URL ?? 'https://www.muuttokone.fi';
  return new Response(buildLlmsTxt(siteUrl), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
