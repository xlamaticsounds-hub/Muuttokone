import { describe, expect, it } from 'vitest';
import { attributionFields, classifyTrafficSource, sanitizeAttribution, trafficSourceLabel } from './traffic-source';

describe('classifyTrafficSource', () => {
  it('tunnistaa tekoälyhaut UTM-parametrista ja referreristä', () => {
    expect(classifyTrafficSource({ utmSource: 'chatgpt.com' })).toBe('chatgpt');
    expect(classifyTrafficSource({ referrerHost: 'chatgpt.com' })).toBe('chatgpt');
    expect(classifyTrafficSource({ referrerHost: 'www.perplexity.ai' })).toBe('perplexity');
    expect(classifyTrafficSource({ referrerHost: 'gemini.google.com' })).toBe('gemini');
    expect(classifyTrafficSource({ referrerHost: 'copilot.microsoft.com' })).toBe('copilot');
    expect(classifyTrafficSource({ referrerHost: 'claude.ai' })).toBe('claude');
  });

  it('ChatGPT:n UTM voittaa, vaikka referrer puuttuisi tai olisi muu', () => {
    expect(classifyTrafficSource({ utmSource: 'chatgpt.com', referrerHost: 'www.google.com' })).toBe('chatgpt');
  });

  it('hakukoneet ja some', () => {
    expect(classifyTrafficSource({ referrerHost: 'www.google.com' })).toBe('google');
    expect(classifyTrafficSource({ referrerHost: 'www.google.fi' })).toBe('google');
    expect(classifyTrafficSource({ referrerHost: 'www.bing.com' })).toBe('bing');
    expect(classifyTrafficSource({ referrerHost: 'l.facebook.com' })).toBe('facebook');
    expect(classifyTrafficSource({ referrerHost: 'l.instagram.com' })).toBe('instagram');
    expect(classifyTrafficSource({ utmSource: 'fb', utmMedium: 'paid' })).toBe('facebook');
  });

  it('muut sivustot, kampanjat ja suorat käynnit', () => {
    expect(classifyTrafficSource({ referrerHost: 'www.vuokraovi.com' })).toBe('referral');
    expect(classifyTrafficSource({ utmSource: 'kiinteistomaailma', referrerHost: 'www.kiinteistomaailma.fi' })).toBe('campaign');
    expect(classifyTrafficSource({ landingPath: '/' })).toBe('direct');
    expect(classifyTrafficSource(null)).toBe('direct');
  });

  it('google-alidomain ei sekoitu Geminiin eikä vieras domain Googleen', () => {
    expect(classifyTrafficSource({ referrerHost: 'news.google.com' })).toBe('google');
    expect(classifyTrafficSource({ referrerHost: 'google.example.com' })).toBe('referral');
  });
});

describe('sanitizeAttribution', () => {
  it('pudottaa väärän muotoiset kentät ja kyselyparametrit', () => {
    expect(
      sanitizeAttribution({ referrerHost: 'evil.com/<script>', utmSource: ' chatgpt.com ', landingPath: '/muuttopalvelu-helsinki?email=x@y.fi#a', extra: 'x' }),
    ).toEqual({ utmSource: 'chatgpt.com', landingPath: '/muuttopalvelu-helsinki' });
  });

  it('ei-olio tai tyhjä olio -> null', () => {
    expect(sanitizeAttribution('chatgpt')).toBeNull();
    expect(sanitizeAttribution({})).toBeNull();
    expect(sanitizeAttribution({ landingPath: 'https://x.fi/' })).toBeNull();
  });

  it('rajoittaa pituuden', () => {
    expect(sanitizeAttribution({ utmCampaign: 'a'.repeat(500) })?.utmCampaign).toHaveLength(100);
  });
});

describe('attributionFields', () => {
  it('palauttaa Prisma-kentät tai tyhjän olion', () => {
    expect(attributionFields({ referrerHost: 'chatgpt.com', landingPath: '/muuttolaskuri' })).toEqual({
      attribution: { referrerHost: 'chatgpt.com', landingPath: '/muuttolaskuri' },
      trafficSource: 'chatgpt',
    });
    expect(attributionFields(undefined)).toEqual({});
  });

  it('nimi hallintaan', () => {
    expect(trafficSourceLabel('chatgpt')).toBe('ChatGPT');
    expect(trafficSourceLabel(null)).toBeNull();
  });
});
