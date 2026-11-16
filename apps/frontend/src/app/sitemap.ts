import type { MetadataRoute } from 'next';
import { prisma } from '@/server/db';
import { CITY_PAGES } from '@/features/city-pages/cityData';
import { BOX_CITIES } from '@/features/vuokraus/boxCityData';
import { CHECKLIST_PAGES, REPLACED_BLOG_POSTS } from '@/features/checklists/checklists';
import { SERVICE_PAGES } from '@/features/service-pages/servicePages';

// Sivukartta muodostetaan pyynnön hetkellä eikä buildissa: buildissa ei ole tietokantaa eikä
// SITE_URL-ympäristömuuttujaa, jolloin sivukarttaan tuli www-tön osoite (joka ohjautuu www:hen)
// ja kaikki blogiartikkelit puuttuivat.
export const dynamic = 'force-dynamic';

// Sivujen sisällön viimeisin muutos. Päivitä, kun sivun sisältö muuttuu oleellisesti: "aina tänään"
// opettaa Googlen ohittamaan päivämäärät kokonaan.
const CONTENT_UPDATED = new Date('2026-11-14');
const LEGAL_UPDATED = new Date('2026-10-01');

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? 'https://www.muuttokone.fi';

  let posts: { slug: string; publishedAt: Date | null; updatedAt: Date }[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, publishedAt: true, updatedAt: true },
    });
  } catch (error) {
    console.warn('[sitemap] Database unavailable, omitting blog posts', error);
  }

  const page = (path: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'monthly', extra: Partial<Entry> = {}): Entry => ({
    url: `${base}${path}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency,
    priority,
    ...extra,
  });
  const home = { languages: { fi: `${base}/`, en: `${base}/en` } };
  const calculator = { languages: { fi: `${base}/muuttolaskuri`, en: `${base}/en/muuttolaskuri` } };

  return [
    page('/', 1.0, 'weekly', { alternates: home }),
    page('/en', 0.7, 'monthly', { alternates: home }),
    page('/muuttolaskuri', 0.9, 'weekly', { alternates: calculator }),
    page('/en/muuttolaskuri', 0.6, 'monthly', { alternates: calculator }),
    // Kaupunkisivut (muuttopalvelu ja muuttolaatikot) datasta, jotta uusi kaupunki tulee mukaan automaattisesti
    ...CITY_PAGES.map((city) => page(city.path, 0.9, 'monthly')),
    page('/palvelut', 0.8, 'monthly'),
    ...SERVICE_PAGES.map((service) => page(service.path, 0.9, 'monthly')),
    page('/yrityksille', 0.8, 'monthly'),
    page('/tyoapu', 0.7, 'monthly'),
    page('/muuttolaatikot', 0.8, 'monthly'),
    ...BOX_CITIES.map((city) => page(`/muuttolaatikot/${city.slug}`, 0.7, 'monthly')),
    page('/tarjouspyynto', 0.7, 'monthly'),
    page('/blogi', 0.7, 'weekly'),
    ...CHECKLIST_PAGES.map((checklist) => page(checklist.path, 0.8, 'monthly')),
    // Koodin sivulla korvatut artikkelit ohjautuvat (301) uuteen osoitteeseen, joten niitä ei listata
    ...posts.filter((post) => !REPLACED_BLOG_POSTS[post.slug]).map((post) => ({
      url: `${base}/blogi/${post.slug}`,
      lastModified: post.updatedAt ?? post.publishedAt ?? CONTENT_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    page('/referenssit', 0.5, 'monthly'),
    page('/usein-kysytyt-kysymykset', 0.6, 'monthly'),
    page('/yhteystiedot', 0.6, 'monthly'),
    // Tietosuojaseloste on noindex, joten sitä ei listata sivukartassa.
    page('/kayttoehdot', 0.3, 'yearly', { lastModified: LEGAL_UPDATED }),
  ];
}
