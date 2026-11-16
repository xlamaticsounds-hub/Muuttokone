import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CITY_PAGES } from './cityData';
import { CITY_LINKS } from './cityLinks';
import { HERO_IMAGES } from '@/components/HeroArea/heroImages';
import { SERVICE_PAGES } from '@/features/service-pages/servicePages';
import footerNavData from '@/components/Footer/footerNavData';
import { buildCityServiceSchema } from './citySchema';
import { BOX_CITIES, getBoxCity } from '@/features/vuokraus/boxCityData';
import { isDeliveryAreaPostalCode } from '@/features/vuokraus/rental';
import { ALL_PRICE_FROM_AMOUNTS } from '@/features/calculator/priceFrom';

/**
 * Leipätekstissä ei hintoja (hinta näkyy laskurista). UKK-vastauksissa saa olla vain laskurin
 * alkaen-hintoja (priceFrom.ts), ei käsin kirjoitettuja lukuja, jotka vanhenisivat hinnoittelun muuttuessa.
 */
function expectNoPrices(text: string, label: string) {
  expect(text, label).not.toMatch(/€|\d+\s*euroa/);
}
function expectOnlyPriceFromAmounts(text: string, label: string) {
  expect(text, label).not.toMatch(/\d+\s*euroa/);
  for (const [, amount] of text.matchAll(/(\d+)\s*€/g)) {
    expect(ALL_PRICE_FROM_AMOUNTS, `${label}: ${amount} €`).toContain(Number(amount));
  }
}

const SITE_APP = path.resolve(__dirname, '../../app/(site)');
// Otsikkopohja lisää perään " | Muuttokone.fi" (16 merkkiä); Google näyttää noin 60 merkkiä.
const TITLE_SUFFIX = ' | Muuttokone.fi'.length;

const allTexts = (city: (typeof CITY_PAGES)[number]) => [
  city.seoDescription,
  city.lead,
  ...city.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
  ...city.faq.flatMap((f) => [f.q, f.a]),
];

describe('kaupunkisivut', () => {
  it('jokaisella kaupungilla on oma reitti, yksilöllinen polku ja H1', () => {
    expect(new Set(CITY_PAGES.map((c) => c.path)).size).toBe(CITY_PAGES.length);
    for (const city of CITY_PAGES) {
      expect(fs.existsSync(path.join(SITE_APP, city.path.slice(1), 'page.tsx')), city.path).toBe(true);
      expect(city.h1).toContain(city.inessive);
    }
  });

  it('hakutuloksen otsikko ja kuvaus mahtuvat näkyviin', () => {
    for (const city of CITY_PAGES) {
      expect(city.seoTitle.length + TITLE_SUFFIX, city.seoTitle).toBeLessThanOrEqual(65);
      expect(city.seoDescription.length, city.seoDescription).toBeGreaterThanOrEqual(120);
      expect(city.seoDescription.length, city.seoDescription).toBeLessThanOrEqual(170);
    }
  });

  it('leipätekstissä ei hintoja, UKK:ssa vain laskurin alkaen-hinnat', () => {
    for (const city of CITY_PAGES) {
      const answers = new Set(city.faq.map((f) => f.a));
      for (const text of allTexts(city)) {
        const label = `${city.slug}: ${text.slice(0, 60)}`;
        if (answers.has(text)) expectOnlyPriceFromAmounts(text, label);
        else expectNoPrices(text, label);
      }
    }
  });

  it('hintakysymyksiin vastataan alkaen-hinnalla (hakukoneet eivät näe laskurin hintaa)', () => {
    for (const city of CITY_PAGES.filter((c) => !c.localByQuote)) {
      const priceAnswer = city.faq.find((f) => f.q.startsWith(`Paljonko muutto maksaa ${city.inessive}`));
      expect(priceAnswer?.a, city.slug).toMatch(/alkaen \d+ €/);
    }
  });

  it('sivut eivät ole kopioita: yksikään kappale tai UKK-vastaus ei toistu toisella kaupunkisivulla', () => {
    const seen = new Map<string, string>();
    for (const city of CITY_PAGES) {
      const texts = [city.lead, ...city.sections.flatMap((s) => s.paragraphs), ...city.faq.map((f) => f.a)];
      for (const text of texts) {
        const owner = seen.get(text);
        expect(owner, `"${text.slice(0, 60)}…" on sekä sivulla ${owner} että ${city.slug}`).toBeUndefined();
        seen.set(text, city.slug);
      }
    }
  });

  it('jokaisella sivulla on riittävästi omaa sisältöä ja vähintään viisi UKK:ta', () => {
    for (const city of CITY_PAGES) {
      expect(city.faq.length, city.slug).toBeGreaterThanOrEqual(5);
      const words = [city.lead, ...city.sections.flatMap((s) => s.paragraphs), ...city.faq.flatMap((f) => [f.q, f.a])].join(' ').split(/\s+/).length;
      expect(words, city.slug).toBeGreaterThanOrEqual(300);
    }
  });

  it('etusivun kaupunkilinkit vastaavat kaupunkisivuja', () => {
    expect(CITY_LINKS.map((l) => [l.name, l.path])).toEqual(CITY_PAGES.map((c) => [c.name, c.path]));
  });

  it('laatikkolinkit osoittavat olemassa olevaan laatikkosivuun', () => {
    for (const city of CITY_PAGES) {
      if (!city.boxPath) continue;
      expect(getBoxCity(city.boxPath.replace('/muuttolaatikot/', '')), city.boxPath).toBeDefined();
    }
  });

  it('Service-schema: kaupunki ja lähikunnat palvelualueena', () => {
    const tampere = CITY_PAGES.find((c) => c.slug === 'tampere')!;
    const schema = buildCityServiceSchema(tampere);
    expect(schema['@type']).toBe('Service');
    expect(schema.areaServed.map((a) => a.name)).toEqual(['Tampere', ...tampere.nearby.places]);
    expect(schema).not.toHaveProperty('offers');
  });

  it('herokuvat: kaupungin aloituskuva kuuluu yhteiseen kiertoon ja kaikki kuvatiedostot ovat olemassa', () => {
    const publicDir = path.resolve(__dirname, '../../../public');
    for (const src of HERO_IMAGES) expect(fs.existsSync(path.join(publicDir, src)), src).toBe(true);
    for (const city of CITY_PAGES) expect(HERO_IMAGES as readonly string[], city.slug).toContain(city.heroImage);
  });

  it('vain Turun sisäiset muutot ovat tarjouksella', () => {
    expect(CITY_PAGES.filter((c) => c.localByQuote).map((c) => c.slug)).toEqual(['turku']);
  });
});

describe('palvelusivut', () => {
  const textsOf = (page: (typeof SERVICE_PAGES)[number]) => [
    page.seoDescription,
    page.lead,
    ...page.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
    ...page.faq.flatMap((f) => [f.q, f.a]),
  ];

  it('reitti, otsikko, kuvaus ja UKK kunnossa', () => {
    expect(new Set(SERVICE_PAGES.map((p) => p.path)).size).toBe(SERVICE_PAGES.length);
    for (const page of SERVICE_PAGES) {
      expect(fs.existsSync(path.join(SITE_APP, page.path.slice(1), 'page.tsx')), page.path).toBe(true);
      expect(page.seoTitle.length + TITLE_SUFFIX, page.seoTitle).toBeLessThanOrEqual(65);
      expect(page.seoDescription.length, page.seoDescription).toBeGreaterThanOrEqual(120);
      expect(page.seoDescription.length, page.seoDescription).toBeLessThanOrEqual(170);
      expect(page.faq.length, page.slug).toBeGreaterThanOrEqual(5);
      expect(HERO_IMAGES as readonly string[], page.slug).toContain(page.heroImage);
    }
  });

  it('ei hintoja leipätekstissä eikä toiselta sivulta kopioitua tekstiä', () => {
    const seen = new Map<string, string>(CITY_PAGES.flatMap((c) => allTexts(c).map((t) => [t, c.slug] as const)));
    for (const page of SERVICE_PAGES) {
      const answers = new Set(page.faq.map((f) => f.a));
      for (const text of textsOf(page)) {
        const label = `${page.slug}: ${text.slice(0, 60)}`;
        if (answers.has(text)) expectOnlyPriceFromAmounts(text, label);
        else expectNoPrices(text, label);
        if (text.length < 40) continue; // lyhyet otsikot ja kysymykset saavat toistua
        expect(seen.get(text), `"${text.slice(0, 60)}" toistuu sivulla ${seen.get(text)}`).toBeUndefined();
        seen.set(text, page.slug);
      }
    }
  });

  it('palvelukorttien linkit ja laskurin aloituspalvelu', () => {
    for (const page of SERVICE_PAGES) {
      for (const card of page.related) {
        expect(fs.existsSync(path.join(SITE_APP, card.href.slice(1), 'page.tsx')), `${page.slug} -> ${card.href}`).toBe(true);
        expect(card.href, page.slug).not.toBe(page.path);
      }
    }
    expect(SERVICE_PAGES.find((p) => p.slug === 'kuljetuspalvelu')!.calculator.service).toBe('transport');
    expect(SERVICE_PAGES.find((p) => p.slug === 'kierratys-ja-poisvienti')!.calculator.service).toBe('recycling');
    expect(SERVICE_PAGES.find((p) => p.slug === 'muuttosiivous')!.calculator.cleaning).toBe(true);
  });
});

describe('footer', () => {
  it('kaikki footerin linkit osoittavat olemassa oleviin sivuihin', () => {
    for (const group of footerNavData) {
      for (const item of group.navItems ?? []) {
        const route = item.route.replace(/^\//, '');
        const boxCity = route.match(/^muuttolaatikot\/([^/]+)$/)?.[1];
        const exists = boxCity ? getBoxCity(boxCity) !== undefined : route === '' || fs.existsSync(path.join(SITE_APP, route, 'page.tsx'));
        expect(exists, item.route).toBe(true);
      }
    }
  });
});

describe('muuttolaatikot Tampereella', () => {
  it('Tampereen laatikkosivu on olemassa, Turun ei', () => {
    expect(BOX_CITIES.map((c) => c.slug)).toEqual(['helsinki', 'espoo', 'vantaa', 'tampere']);
    expect(getBoxCity('turku')).toBeUndefined();
  });

  it('toimitusalue: pääkaupunkiseutu ja Tampereen seutu', () => {
    for (const code of ['00100', '01300', '02100', '33100', '33720', '33960', '36200', '37100', '37500']) {
      expect(isDeliveryAreaPostalCode(code), code).toBe(true);
    }
    for (const code of ['20100', '15100', '40100', '3310', 'abcde']) {
      expect(isDeliveryAreaPostalCode(code), code).toBe(false);
    }
  });
});
