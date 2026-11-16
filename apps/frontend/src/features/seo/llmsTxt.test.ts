import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLlmsTxt, llmsTxtSections } from './llmsTxt';
import { CITY_PAGES } from '@/features/city-pages/cityData';
import { SERVICE_PAGES } from '@/features/service-pages/servicePages';
import { PRICE_FROM } from '@/features/calculator/priceFrom';

const SITE_APP = path.resolve(__dirname, '../../app/(site)');
const routeExists = (p: string) => fs.existsSync(path.join(SITE_APP, p.replace(/^\//, ''), 'page.tsx'));

describe('llms.txt', () => {
  const text = buildLlmsTxt('https://www.muuttokone.fi');

  it('alkaa otsikolla ja tiivistelmällä (llmstxt.org-muoto)', () => {
    expect(text.startsWith('# Muuttokone.fi\n\n> ')).toBe(true);
  });

  it('jokainen linkki osoittaa olemassa olevaan sivuun', () => {
    for (const { links } of llmsTxtSections()) {
      for (const link of links) expect(routeExists(link.path), link.path).toBe(true);
    }
  });

  it('kaikki kaupunki- ja palvelusivut ovat mukana', () => {
    for (const page of [...CITY_PAGES, ...SERVICE_PAGES]) {
      expect(text, page.path).toContain(`(https://www.muuttokone.fi${page.path})`);
    }
  });

  it('alkaen-hinnat tulevat laskurista', () => {
    expect(text).toContain(`yksiö alkaen ${PRICE_FROM.fullService['1h']} €`);
    expect(text).toContain(`kantoapu alkaen ${PRICE_FROM.carryingHelp} €`);
  });
});
