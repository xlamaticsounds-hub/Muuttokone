// Keikkatiimit ja uuden liidin tiimiehdotus osoitteista (puhtaat funktiot, testattavissa).
//
// Tiimien tunnisteet luodaan migraatiossa 20261113120000_users_teams. Ehdotus noudattaa laskurin
// tukikohtasääntöä (lib/base-trip.ts): osoite kuuluu sille tiimille, jonka tukikohta on lähempänä.
//   kaikki tunnetut osoitteet lähempänä Tamperetta -> Tampere (koko Pirkanmaa, myös esim. Hämeenlinna ja Pori)
//   kaikki tunnetut osoitteet lähempänä Helsinkiä  -> Helsinki
//   sekaisin (esim. Tampere -> Helsinki), tuntematon kunta tai ei osoitetta -> null = jakamaton:
//   näkyy vain omistajille, jotka valitsevat tiimin liidin sivulla.

import { cityFromAddress, nearestBaseOfCity, type BaseId } from '@/lib/base-trip';

export const TEAM_HELSINKI = 'helsinki';
export const TEAM_TAMPERE = 'tampere';

/** Tiimit valintalistoihin (sama kuin Team-taulu; uusia tiimejä ei vielä lisätä käyttöliittymästä). */
export const TEAMS = [
  { id: TEAM_HELSINKI, name: 'Helsinki' },
  { id: TEAM_TAMPERE, name: 'Tampere' },
] as const;

export const isTeamId = (value: unknown): value is string => TEAMS.some((t) => t.id === value);

/** Tiimin nimi, null = "Ei tiimiä" (jakamaton). */
export function teamLabel(teamId: string | null | undefined): string {
  if (!teamId) return 'Ei tiimiä';
  return TEAMS.find((t) => t.id === teamId)?.name ?? teamId;
}

// Pirkanmaan nimiä, joita base-trip.ts:n etäisyystaulukossa ei ole (ruotsinkieliset ja entiset kunnat,
// taajamat). Kaikki Pirkanmaan kunnat ovat taulukossa ja lähempänä Tamperetta.
const NEAR_TAMPERE = new Set([
  'tammerfors', 'birkala', 'lembois', 'tavastkyro', 'ikalis', 'virdois',
  'kuru', 'viljakkala', 'vammala', 'toijala', 'viiala', 'sahalahti', 'kuhmalahti', 'luopioinen', 'längelmäki', 'teisko',
]);

// Kaukaisia kaupunkeja ja ruotsinkielisiä nimiä, joita etäisyystaulukossa ei ole: Helsingin tiimi kuten ennenkin.
const NEAR_HELSINKI = new Set([
  'helsingfors', 'esbo', 'vanda', 'åbo', 'oulu', 'kuopio', 'vaasa', 'joensuu', 'seinäjoki', 'rovaniemi', 'kokkola',
  'kajaani', 'savonlinna', 'kemi', 'tornio', 'iisalmi', 'varkaus', 'pieksämäki',
]);

/** Osoitteen lähin tukikohta kunnan nimestä tai postinumerosta. null = ei tunnistettu. */
export function baseOfAddress(address: string | null | undefined): BaseId | null {
  if (!address) return null;
  // Viimeinen tunnettu kunta ratkaisee ("Tampereentie 5, Helsinki" on Helsinki: kadunnimi on eri sana).
  const tokens = address.toLowerCase().match(/\p{L}+/gu) ?? [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const city = cityFromAddress(token);
    if (city) return nearestBaseOfCity(city.key);
    if (NEAR_TAMPERE.has(token)) return 'tampere';
    if (NEAR_HELSINKI.has(token)) return 'helsinki';
  }
  // Postinumero: 33xxx–37xxx on Pirkanmaata. 38xxx–39xxx sekoittuu Satakuntaan, joten niistä ei arvata.
  const codes = address.match(/\b\d{5}\b/g);
  if (codes) {
    const prefix = Number(codes[codes.length - 1].slice(0, 2));
    if (prefix >= 33 && prefix <= 37) return 'tampere';
    if (prefix === 38 || prefix === 39) return null;
    return 'helsinki';
  }
  return null;
}

const TEAM_OF_BASE: Record<BaseId, string> = { helsinki: TEAM_HELSINKI, tampere: TEAM_TAMPERE };

/** Uuden liidin tiimiehdotus lähtö- ja kohdeosoitteesta. null = jakamaton (omistaja valitsee). */
export function suggestTeamId(input: { fromAddress?: string | null; toAddress?: string | null }): string | null {
  const addresses = [input.fromAddress, input.toAddress].map((a) => a?.trim()).filter((a): a is string => Boolean(a));
  if (addresses.length === 0) return null;
  const bases = addresses.map(baseOfAddress);
  if (bases.some((b) => b === null)) return null;
  return bases.every((b) => b === bases[0]) ? TEAM_OF_BASE[bases[0] as BaseId] : null;
}
