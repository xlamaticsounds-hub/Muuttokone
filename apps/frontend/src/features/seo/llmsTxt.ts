// /llms.txt (llmstxt.org): tiivis Markdown-kuvaus sivustosta tekoälyhauille (ChatGPT, Perplexity, Claude,
// Gemini). Kootaan samoista datoista kuin sivut (kaupunki-, palvelu- ja muistilistasivut, laskurin
// alkaen-hinnat), joten uusi sivu tai hinnanmuutos päivittyy tänne automaattisesti. llmsTxt.test.ts
// tarkistaa, että jokainen linkki osoittaa olemassa olevaan sivuun.
import { siteConfig } from '@/config/site';
import { SEOConfigs } from '@/components/SEO/SEOHelpers';
import { CITY_PAGES } from '@/features/city-pages/cityData';
import { SERVICE_PAGES } from '@/features/service-pages/servicePages';
import { CHECKLIST_PAGES } from '@/features/checklists/checklists';
import { PRICE_FROM_TEXT } from '@/features/calculator/priceFrom';

type Link = { title: string; path: string; description: string };

const line = (siteUrl: string, link: Link) => `- [${link.title}](${siteUrl}${link.path}): ${link.description}`;

const fromSeo = (title: string, config: { canonical: string; description: string }): Link => ({
  title,
  path: config.canonical,
  description: config.description.trim(),
});

/** Kaikki llms.txt:n linkit osioittain (testi käy nämä läpi). */
export function llmsTxtSections(): { heading: string; links: Link[] }[] {
  return [
    {
      heading: 'Muuttopalvelu kaupungeittain',
      links: CITY_PAGES.map((city) => ({ title: city.h1, path: city.path, description: city.seoDescription })),
    },
    {
      heading: 'Palvelut ja hinnat',
      links: [
        fromSeo('Muuttolaskuri: kiinteä hinta heti', SEOConfigs.calculator),
        ...SERVICE_PAGES.map((page) => ({ title: page.h1, path: page.path, description: page.seoDescription })),
        fromSeo('Yritysmuutot', SEOConfigs.business),
        fromSeo('Muuttolaatikoiden vuokraus', SEOConfigs.muuttolaatikot),
        fromSeo('Työapu: asennukset ja kodin pikkutyöt', SEOConfigs.tyoapu),
        fromSeo('Kaikki palvelut', SEOConfigs.services),
      ],
    },
    {
      heading: 'Oppaat',
      links: [
        ...CHECKLIST_PAGES.map((page) => ({ title: page.h1, path: page.path, description: page.seoDescription })),
        fromSeo('Usein kysytyt kysymykset', SEOConfigs.faq),
        fromSeo('Muuttoblogi', SEOConfigs.blog),
      ],
    },
    {
      heading: 'Yhteydenotto',
      links: [fromSeo('Yhteystiedot', SEOConfigs.contact), fromSeo('Tarjouspyyntö', SEOConfigs.quote), fromSeo('Referenssit', SEOConfigs.referenssit)],
    },
    {
      heading: 'Optional',
      links: [
        fromSeo('In English: moving cost calculator', SEOConfigs.calculatorEn),
        fromSeo('Käyttöehdot', SEOConfigs.terms),
        fromSeo('Tietosuojaseloste', SEOConfigs.privacy),
      ],
    },
  ];
}

export function buildLlmsTxt(siteUrl: string): string {
  const { contact, businessId } = siteConfig;
  const facts = [
    `Yritys: Muuttokone Oy, Y-tunnus ${businessId}. Tukikohdat Helsingissä ja Tampereella (Hervanta).`,
    'Palvelualue: pääkaupunkiseutu (Helsinki, Espoo, Vantaa, Kauniainen), Tampere ja Pirkanmaa. Muutot myös Turkuun ja muualle Suomeen; kaukana tukikohdista hintaan tulee ajolisä tai hinta annetaan tarjouksella.',
    'Palvelut: kotimuutot, yritysmuutot, kantoapu, kuljettaja ja auto, kuljetukset, muuttosiivous, kierrätys ja poisvienti, kuolinpesätyhjennykset, muuttolaatikoiden vuokraus sekä työapu (asennukset).',
    `Täyspalvelumuuton hinnat (sis. ALV): ${PRICE_FROM_TEXT.fullService}. Lisäksi ${PRICE_FROM_TEXT.lighterPackages}.`,
    `Kuljetus ${PRICE_FROM_TEXT.transport}. Muuttosiivous kiinteään hintaan: ${PRICE_FROM_TEXT.cleaning}.`,
    `Hinta on kiinteä: kun annetut tiedot pitävät paikkansa, hinta ei nouse, vaikka muutto kestäisi arvioitua pidempään. ${PRICE_FROM_TEXT.cheaperDays} Oman muuton hinnan näkee heti muuttolaskurista.`,
    'Kuljetukset on vakuutettu tiekuljetuslain mukaisesti.',
    `Yhteystiedot: puhelin ${contact.phone.display}, sähköposti ${contact.email}. Avoinna ${contact.openingHours.replace(/\.$/, '').toLowerCase()}.`,
  ];

  return [
    '# Muuttokone.fi',
    '',
    '> Muuttokone.fi on muuttopalvelu pääkaupunkiseudulla ja Tampereella. Muuton kiinteän hinnan näkee heti verkkosivun muuttolaskurista, ja muuton voi varata suoraan verkossa.',
    '',
    ...facts.map((fact) => `- ${fact}`),
    '',
    ...llmsTxtSections().flatMap((section) => [`## ${section.heading}`, '', ...section.links.map((link) => line(siteUrl, link)), '']),
  ].join('\n');
}
