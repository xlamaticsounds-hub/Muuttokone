// Mistä liidi tuli: kävijän ensimmäisen sivulatauksen viittaava domain (referrer) ja UTM-parametrit.
// Selain kerää ne (lib/attribution-client.ts), tämä moduuli siivoaa ne palvelimella ja luokittelee.
// Tarkoitus on nähdä, tuovatko tekoälyhaut (ChatGPT, Perplexity, Gemini, Copilot, Claude) asiakkaita
// (GEO, 11/2026). ChatGPT lisää linkkeihinsä ?utm_source=chatgpt.com, muut näkyvät yleensä referreristä.
// Google AI Overviews ja AI Mode tulevat google-referrerillä, eikä niitä voi erottaa tavallisesta hausta.
//
// Tietosuoja: talteen jää vain domain ja laskeutumissivun polku ilman kyselyparametreja, ei koko
// viittaavaa osoitetta (se voisi sisältää hakusanoja tai muuta henkilökohtaista).

export type Attribution = {
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPath?: string;
};

export type TrafficSource =
  | 'chatgpt'
  | 'perplexity'
  | 'gemini'
  | 'copilot'
  | 'claude'
  | 'google'
  | 'bing'
  | 'facebook'
  | 'instagram'
  | 'campaign'
  | 'referral'
  | 'direct';

export const AI_TRAFFIC_SOURCES: readonly TrafficSource[] = ['chatgpt', 'perplexity', 'gemini', 'copilot', 'claude'];

const LABELS: Record<TrafficSource, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  copilot: 'Microsoft Copilot',
  claude: 'Claude',
  google: 'Google',
  bing: 'Bing',
  facebook: 'Facebook',
  instagram: 'Instagram',
  campaign: 'Kampanjalinkki',
  referral: 'Muu sivusto',
  direct: 'Suora käynti',
};

const clean = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
};

/** Selaimen lähettämä arvo on käyttäjän syötettä: hyväksytään vain odotetun muotoiset kentät. */
export function sanitizeAttribution(raw: unknown): Attribution | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const host = clean(r.referrerHost, 100)?.toLowerCase();
  const path = clean(r.landingPath, 200)?.split(/[?#]/)[0];
  const result: Attribution = {
    referrerHost: host && /^[a-z0-9.-]+$/.test(host) ? host : undefined,
    utmSource: clean(r.utmSource, 100),
    utmMedium: clean(r.utmMedium, 100),
    utmCampaign: clean(r.utmCampaign, 100),
    landingPath: path?.startsWith('/') ? path : undefined,
  };
  const entries = Object.entries(result).filter(([, v]) => v !== undefined);
  return entries.length > 0 ? (Object.fromEntries(entries) as Attribution) : null;
}

const hostIs = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

const AI_BY_UTM: [RegExp, TrafficSource][] = [
  [/chatgpt|openai/i, 'chatgpt'],
  [/perplexity/i, 'perplexity'],
  [/gemini|bard/i, 'gemini'],
  [/copilot/i, 'copilot'],
  [/claude|anthropic/i, 'claude'],
];

function fromHost(host: string): TrafficSource {
  if (hostIs(host, 'chatgpt.com') || hostIs(host, 'openai.com')) return 'chatgpt';
  if (hostIs(host, 'perplexity.ai')) return 'perplexity';
  if (host === 'gemini.google.com' || host === 'bard.google.com') return 'gemini';
  if (hostIs(host, 'copilot.microsoft.com')) return 'copilot';
  if (hostIs(host, 'claude.ai')) return 'claude';
  // google.com, google.fi, google.co.uk, google.com.au – ei google.example.com
  if (/(^|\.)google\.(com|[a-z]{2}|com?\.[a-z]{2})$/.test(host)) return 'google';
  if (hostIs(host, 'bing.com')) return 'bing';
  if (hostIs(host, 'facebook.com') || hostIs(host, 'fb.com')) return 'facebook';
  if (hostIs(host, 'instagram.com')) return 'instagram';
  return 'referral';
}

export function classifyTrafficSource(attribution: Attribution | null | undefined): TrafficSource {
  const utm = attribution?.utmSource;
  if (utm) {
    const ai = AI_BY_UTM.find(([pattern]) => pattern.test(utm));
    if (ai) return ai[1];
  }
  const host = attribution?.referrerHost;
  if (host) {
    const fromReferrer = fromHost(host);
    if (fromReferrer !== 'referral' || !utm) return fromReferrer;
  }
  if (utm) {
    if (/^(fb|facebook)/i.test(utm)) return 'facebook';
    if (/^(ig|instagram)/i.test(utm)) return 'instagram';
    if (/^google/i.test(utm)) return 'google';
    return 'campaign';
  }
  return 'direct';
}

export function trafficSourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  return LABELS[source as TrafficSource] ?? source;
}

/** Prisma-kentät liidin luontiin: tyhjä olio, jos selain ei lähettänyt mitään (vanhat sivuversiot). */
export function attributionFields(raw: unknown): { attribution?: Attribution; trafficSource?: TrafficSource } {
  const attribution = sanitizeAttribution(raw);
  if (!attribution) return {};
  return { attribution, trafficSource: classifyTrafficSource(attribution) };
}
