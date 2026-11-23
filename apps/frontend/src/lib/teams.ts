// Keikkatiimit ja liidin automaattinen tiimi osoitteista (puhtaat funktiot, testattavissa).
//
// Tiimien tunnisteet luodaan migraatiossa 20261113120000_users_teams. Jakosääntö (23.11.2026):
//   pääkaupunkiseutu -> Helsinki
//   muualla: kaikki osoitteet enintään 100 km tiimin tukikohdasta -> se tiimi (molempien säteellä: lähempi,
//     esim. Hämeenlinna -> Tampere)
//   yli 100 km (esim. Lahti, Turku, Pori, Tampere -> Helsinki), tuntematon kunta tai ei osoitetta
//     -> null = jakamaton: näkyy vain omistajille, jotka valitsevat tiimin liidin sivulla.
// Etäisyydet ovat likimääräisiä tieetäisyyksiä kuntaan (lib/base-trip.ts), ei Google-kyselyä.

import { kmFromBasesOfCity, type BaseId } from '@/lib/base-trip';

export const TEAM_HELSINKI = 'helsinki';
export const TEAM_TAMPERE = 'tampere';

/** Tiimin säde tukikohdasta (km). Kauempana oleva keikka jää jakamattomaksi. */
export const TEAM_RADIUS_KM = 100;

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

// Muita nimiä etäisyystaulukon kunnille: ruotsinkieliset nimet, entiset kunnat ja taajamat.
const CITY_ALIASES = new Map<string, string>([
  ['helsingfors', 'helsinki'], ['esbo', 'espoo'], ['vanda', 'vantaa'], ['grankulla', 'kauniainen'],
  ['kervo', 'kerava'], ['träskända', 'järvenpää'], ['kyrkslätt', 'kirkkonummi'], ['sjundeå', 'siuntio'], ['sibbo', 'sipoo'],
  ['borgå', 'porvoo'], ['lojo', 'lohja'], ['hyvinge', 'hyvinkää'], ['lovisa', 'loviisa'], ['ekenäs', 'raasepori'], ['hangö', 'hanko'],
  ['tavastehus', 'hämeenlinna'], ['lahtis', 'lahti'], ['åbo', 'turku'], ['björneborg', 'pori'], ['raumo', 'rauma'],
  ['tammerfors', 'tampere'], ['birkala', 'pirkkala'], ['lembois', 'lempäälä'], ['tavastkyro', 'hämeenkyrö'], ['ikalis', 'ikaalinen'],
  ['virdois', 'virrat'], ['kuru', 'ylöjärvi'], ['viljakkala', 'ylöjärvi'], ['vammala', 'sastamala'], ['toijala', 'akaa'],
  ['viiala', 'akaa'], ['sahalahti', 'kangasala'], ['kuhmalahti', 'kangasala'], ['luopioinen', 'pälkäne'], ['teisko', 'tampere'],
  ['längelmäki', 'orivesi'],
  // Kaupunginosat ja kauppakeskukset, kun osoitteessa ei ole kuntaa (esim. "Picnic Columbus Vuosaari", "Tripla").
  // Yhdysnimistä riittää viimeinen osa ("Pohjois-Haaga" -> haaga, "Etu-Töölö" -> töölö).
  ...districtsOf('helsinki', [
    'kruununhaka', 'kluuvi', 'kaartinkaupunki', 'kamppi', 'punavuori', 'eira', 'ullanlinna', 'katajanokka', 'kallio',
    'sörnäinen', 'alppila', 'alppiharju', 'vallila', 'hermanni', 'toukola', 'arabianranta', 'kumpula', 'käpylä', 'pasila',
    'meilahti', 'ruskeasuo', 'töölö', 'lauttasaari', 'ruoholahti', 'jätkäsaari', 'munkkiniemi', 'munkkivuori',
    'pitäjänmäki', 'konala', 'kannelmäki', 'malminkartano', 'haaga', 'huopalahti', 'oulunkylä', 'maunula', 'pakila',
    'paloheinä', 'tuomarinkylä', 'malmi', 'pukinmäki', 'tapanila', 'puistola', 'jakomäki', 'suutarila', 'siltamäki',
    'tapaninvainio', 'herttoniemi', 'roihuvuori', 'laajasalo', 'kulosaari', 'vartiokylä', 'itäkeskus', 'myllypuro',
    'kontula', 'mellunmäki', 'vuosaari', 'kalasatama', 'viikki', 'latokartano', 'pihlajamäki', 'pihlajisto', 'lassila',
    'kurkimäki', 'suomenlinna', 'östersundom', 'tripla', 'columbus', 'itis', 'redi',
  ]),
  ...districtsOf('espoo', [
    'leppävaara', 'tapiola', 'otaniemi', 'keilaniemi', 'matinkylä', 'olari', 'espoonlahti', 'kivenlahti', 'soukka',
    'kauklahti', 'niittykumpu', 'karakallio', 'laajalahti', 'westend', 'haukilahti', 'latokaski', 'suurpelto', 'kalajärvi',
    'viherlaakso', 'perkkaa', 'mankkaa', 'sello',
  ]),
  ...districtsOf('vantaa', [
    'tikkurila', 'myyrmäki', 'martinlaakso', 'hakunila', 'koivukylä', 'korso', 'aviapolis', 'kivistö', 'louhela',
    'vantaankoski', 'havukoski', 'rekola', 'nikinmäki', 'simonkylä', 'länsimäki', 'kaivoksela', 'varisto', 'pähkinärinne',
    'hämeenkylä', 'tammisto', 'pakkala', 'kartanonkoski', 'jokiniemi', 'hiekkaharju', 'ylästö', 'jumbo', 'flamingo',
  ]),
  ...districtsOf('tampere', [
    'hervanta', 'kaleva', 'tammela', 'pispala', 'hatanpää', 'härmälä', 'lielahti', 'tesoma', 'lentävänniemi', 'kaukajärvi',
    'linnainmaa', 'atala', 'peltolammi', 'multisilta', 'vuores', 'nekala', 'takahuhti', 'annala', 'messukylä', 'hallila',
    'lukonmäki', 'lamminpää', 'amuri', 'kaakinmaa', 'viinikka', 'rantaperkiö', 'ratina',
  ]),
  ['ideapark', 'lempäälä'],
]);

function districtsOf(city: string, names: string[]): [string, string][] {
  return names.map((name) => [name, city]);
}

// Kaukaisia kaupunkeja, joita etäisyystaulukossa ei ole: yli 100 km kummastakin tukikohdasta.
const FAR_CITIES = new Set([
  'oulu', 'kuopio', 'vaasa', 'joensuu', 'seinäjoki', 'rovaniemi', 'kokkola', 'kajaani', 'savonlinna', 'kemi', 'tornio',
  'iisalmi', 'varkaus', 'pieksämäki',
]);
const FAR: Record<BaseId, number> = { helsinki: Infinity, tampere: Infinity };

// Postinumero, kun kuntaa ei tunnisteta: 00–09 on Uuttamaata enintään noin 100 km Helsingistä
// (00–02 pääkaupunkiseutua), 33–37 Tampereen seutua. Muista ei arvata (esim. 38xxx on osin Satakuntaa).
function kmFromPostalCode(code: string): Record<BaseId, number> | null {
  const prefix = Number(code.slice(0, 2));
  if (prefix <= 2) return { helsinki: 15, tampere: 170 };
  if (prefix <= 9) return { helsinki: 70, tampere: 170 };
  if (prefix >= 33 && prefix <= 37) return { helsinki: 180, tampere: 40 };
  return null;
}

/** Osoitteen likimääräinen etäisyys tukikohdista (km) kunnan nimestä tai postinumerosta. null = ei tunnistettu. */
export function kmFromBasesOfAddress(address: string | null | undefined): Record<BaseId, number> | null {
  if (!address) return null;
  // Viimeinen tunnettu kunta ratkaisee ("Tampereentie 5, Helsinki" on Helsinki: kadunnimi on eri sana).
  const tokens = address.toLowerCase().match(/\p{L}+/gu) ?? [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const km = kmFromBasesOfCity(CITY_ALIASES.get(token) ?? token);
    if (km) return km;
    if (FAR_CITIES.has(token)) return FAR;
  }
  const codes = address.match(/\b\d{5}\b/g);
  return codes ? kmFromPostalCode(codes[codes.length - 1]) : null;
}

const BASES: readonly BaseId[] = ['helsinki', 'tampere'];
const TEAM_OF_BASE: Record<BaseId, string> = { helsinki: TEAM_HELSINKI, tampere: TEAM_TAMPERE };

/** Liidin tiimi lähtö- ja kohdeosoitteesta (säännöt tiedoston alussa). null = jakamaton (omistaja valitsee). */
export function suggestTeamId(input: { fromAddress?: string | null; toAddress?: string | null }): string | null {
  const addresses = [input.fromAddress, input.toAddress].map((a) => a?.trim()).filter((a): a is string => Boolean(a));
  if (addresses.length === 0) return null;
  const places = addresses.map(kmFromBasesOfAddress);
  if (places.some((p) => p === null)) return null;
  const known = places as Record<BaseId, number>[];

  // Tiimit, joiden säteellä ovat kaikki osoitteet. Jos molempien, lähempi (tasapelissä Helsinki).
  const inRange = BASES.filter((base) => known.every((p) => p[base] <= TEAM_RADIUS_KM));
  if (inRange.length === 0) return null;
  const total = (base: BaseId) => known.reduce((sum, p) => sum + p[base], 0);
  return TEAM_OF_BASE[inRange.reduce((best, base) => (total(base) < total(best) ? base : best))];
}
