import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECKLIST_PAGES, REPLACED_BLOG_POSTS } from './checklists';
import { HERO_IMAGES } from '@/components/HeroArea/heroImages';

const SITE_APP = path.resolve(__dirname, '../../app/(site)');
const NEXT_CONFIG = fs.readFileSync(path.resolve(__dirname, '../../../next.config.mjs'), 'utf8');

describe('muistilistasivut', () => {
  it('reitti, otsikko, kuvaus ja UKK kunnossa', () => {
    for (const page of CHECKLIST_PAGES) {
      expect(fs.existsSync(path.join(SITE_APP, page.path.slice(1), 'page.tsx')), page.path).toBe(true);
      expect(page.seoTitle.length + ' | Muuttokone.fi'.length, page.seoTitle).toBeLessThanOrEqual(65);
      expect(page.seoDescription.length, page.seoDescription).toBeGreaterThanOrEqual(120);
      expect(page.seoDescription.length, page.seoDescription).toBeLessThanOrEqual(170);
      expect(page.faq.length).toBeGreaterThanOrEqual(5);
      expect(HERO_IMAGES as readonly string[]).toContain(page.heroImage);
    }
  });

  it('vaiheilla on yksilölliset tunnisteet ja kohtia, sisäiset linkit ovat oikeita sivuja', () => {
    for (const page of CHECKLIST_PAGES) {
      const ids = page.phases.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const phase of page.phases) {
        expect(phase.items.length, phase.id).toBeGreaterThanOrEqual(3);
        for (const item of phase.items) {
          if (!item.link) continue;
          expect(fs.existsSync(path.join(SITE_APP, item.link.href.slice(1), 'page.tsx')), item.link.href).toBe(true);
        }
      }
    }
  });

  it('ei hintoja teksteissä', () => {
    for (const page of CHECKLIST_PAGES) {
      const texts = [page.seoDescription, page.lead, ...page.phases.flatMap((p) => p.items.map((i) => i.text)), ...page.faq.flatMap((f) => [f.q, f.a])];
      for (const text of texts) expect(text).not.toMatch(/€|\d+\s*euroa/);
    }
  });

  it('muuttoilmoituksen määräaika on oikein (aikaisintaan kuukautta ennen, viimeistään viikon kuluttua)', () => {
    const koti = CHECKLIST_PAGES.find((p) => p.slug === 'muuton-muistilista')!;
    const answer = koti.faq.find((f) => f.q.startsWith('Milloin muuttoilmoitus'))!.a;
    expect(answer).toContain('Aikaisintaan kuukautta ennen');
    expect(answer).toContain('viimeistään viikon kuluttua');
  });

  it('korvatut blogiartikkelit ohjautuvat pysyvästi uuteen sivuun next.configissa', () => {
    for (const [slug, target] of Object.entries(REPLACED_BLOG_POSTS)) {
      expect(NEXT_CONFIG).toContain(`{ source: "/blogi/${slug}", destination: "${target}", permanent: true }`);
      expect(NEXT_CONFIG).toContain(`{ source: "/blog/${slug}", destination: "${target}", permanent: true }`);
      // Tarkka sääntö ennen yleistä /blog/:path* -sääntöä, ettei synny ohjausketjua
      expect(NEXT_CONFIG.indexOf(`/blog/${slug}`)).toBeLessThan(NEXT_CONFIG.indexOf('"/blog/:path*"'));
    }
  });
});
