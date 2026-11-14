// Tukikohtalisä: tyhjä ajo tukikohdasta keikalle ja takaisin.
//
// Tiimipalaverin päätöksellä (4.11.2026) laskuri lisää tukikohtalisän hintaan automaattisesti
// (pricing.ts: applyBaseTrip), ilman päivä- tai kumppanialennusta. Hallinnan varoitus jää vanhoille
// liideille, joiden hinnassa lisää ei vielä ole (formData.baseTripSurcharge puuttuu).
//
// Laskuri hinnoittelee vain matkan lähtöosoitteesta kohdeosoitteeseen. Kun muutto on kaukana
// tukikohdasta, auto ajaa ensin tyhjänä tukikohdasta lähtöosoitteelle ja lopuksi kohteesta
// takaisin. Pitkän muuton hinta kattaa jo paluuajon, mutta paikallisen muuton kaukana (esim. Hamina →
// Hamina) ei: 5 km:n hinta, mutta noin 300 km tyhjää ajoa. Kannattavuusanalyysin (20.10.2026) mukaan
// yksiön ja kaksion tuntiansio jää silloin noin 3–13 €/h per henkilö.
//
// Tukikohtia on kaksi: Helsinki ja Tampere (Hervanta, Teinvarsi-parkki, 14.11.2026 alkaen). Keikka
// lasketaan siitä tukikohdasta, josta tyhjää ajoa tulee vähemmän (tasapelissä Helsinki). Sama sääntö
// ehdottaa liidille tiimiä (lib/teams.ts).
//
// Arvio tehdään kuntatasolla (likimääräiset tieetäisyydet tukikohdista), joten sitä ei tarvitse
// Google-kyselyä eikä tukikohtien osoitteita koodissa. Tulos on suuntaa-antava: "noin".

// Laskurin km-hinta (PRICING_CONSTANTS.ratePerKm) on vain auton osuus: muuton ajoaika laskutetaan sen
// lisäksi tuntihinnalla. Tyhjää ajoa ei laskuteta tunneilla, joten tukikohtalisän km-hinta kattaa myös
// tiimin ajoajan (auto + palkat + omistajien osuus noin 70 km/h keskinopeudella).

/** Lisä per tyhjä km sis. ALV, kun keikalla on 1–2 henkilöä (kantoapu, kuljettaja + auto, kuljetus). ALV 0: 1,10 €. */
export const BASE_TRIP_RATE_PER_KM = 1.38;
/** Sama kun keikalla on 3 henkilöä (muutto, täysi palvelu). ALV 0: 1,50 €. */
export const BASE_TRIP_RATE_PER_KM_CREW3 = 1.88;
/** Tukikohdan lähialueen ajo, jota ei veloiteta erikseen (km, tyhjät osuudet yhteensä). */
export const BASE_TRIP_FREE_KM = 30;
/** Tätä pienempää lisää ei veloiteta eikä näytetä varoituksena (€ sis. ALV, ALV 0: 60 €). */
export const BASE_TRIP_MIN_SURCHARGE = 75;
/** Tätä suuremmalla lisällä laskuri ei näytä hintaa: keikka hinnoitellaan tarjouksella (€ sis. ALV). */
export const BASE_TRIP_QUOTE_THRESHOLD = 400;

export type BaseId = 'helsinki' | 'tampere';

/**
 * Likimääräinen tieetäisyys tukikohdista kunnan keskustaan, km: [Helsinki, Tampere (Hervanta)].
 * Avain pienillä kirjaimilla.
 */
const KM_FROM_BASES: Record<string, readonly [helsinki: number, tampere: number]> = {
  // Pääkaupunkiseutu (Helsingin tukikohdan lähialue: tyypillinen keikkaan kuuluva ajo)
  helsinki: [10, 170], vantaa: [15, 160], espoo: [20, 175], kauniainen: [20, 175],
  // Muu Uusimaa
  kerava: [30, 160], sipoo: [30, 170], tuusula: [35, 150], kirkkonummi: [40, 195], siuntio: [40, 190],
  järvenpää: [40, 150], nurmijärvi: [40, 140], vihti: [55, 165], hyvinkää: [55, 120], mäntsälä: [55, 145],
  lohja: [55, 180], porvoo: [50, 190], pornainen: [50, 165], inkoo: [55, 205], askola: [60, 175],
  karkkila: [70, 135], pukkila: [70, 165], loviisa: [90, 200], lapinjärvi: [100, 185], raasepori: [100, 215],
  hanko: [120, 245],
  // Kanta-Häme
  riihimäki: [70, 105], hausjärvi: [65, 115], loppi: [80, 105], janakkala: [85, 90], hämeenlinna: [100, 75],
  hattula: [105, 70], forssa: [115, 90],
  // Päijät-Häme
  orimattila: [80, 150], hollola: [100, 115], lahti: [105, 125], asikkala: [115, 120], heinola: [135, 155],
  // Kymenlaakso ja Etelä-Karjala
  pyhtää: [115, 215], kouvola: [135, 185], kotka: [135, 230], hamina: [150, 240], virolahti: [170, 265],
  lappeenranta: [220, 270], imatra: [260, 305],
  // Pirkanmaa (Tampereen tukikohdan lähialue)
  tampere: [180, 10], kangasala: [175, 15], lempäälä: [165, 15], pirkkala: [185, 15], nokia: [190, 25],
  ylöjärvi: [195, 25], valkeakoski: [150, 30], vesilahti: [175, 30], akaa: [160, 35], pälkäne: [165, 35],
  orivesi: [210, 45], hämeenkyrö: [220, 45], urjala: [145, 55], ikaalinen: [235, 60], juupajoki: [225, 60],
  sastamala: [190, 65], ruovesi: [245, 70], punkalaidun: [155, 75], mänttä: [240, 85], vilppula: [245, 85],
  kuhmoinen: [195, 85], parkano: [265, 90], virrat: [270, 95], kihniö: [285, 110],
  // Varsinais-Suomi ja Satakunta
  salo: [100, 165], paimio: [140, 165], lieto: [160, 145], turku: [165, 165], kaarina: [170, 170],
  raisio: [170, 175], naantali: [175, 185], parainen: [190, 195], loimaa: [155, 100], uusikaupunki: [230, 195],
  huittinen: [180, 90], pori: [250, 120], rauma: [255, 155], kankaanpää: [270, 115],
  // Muita
  mikkeli: [230, 235], jyväskylä: [270, 145],
};

const isKnownCity = (key: string) => Object.prototype.hasOwnProperty.call(KM_FROM_BASES, key);

/** Kunnan lähin tukikohta (tasapelissä Helsinki). null, kun kuntaa ei ole taulukossa. */
export function nearestBaseOfCity(cityKey: string): BaseId | null {
  if (!isKnownCity(cityKey)) return null;
  const [helsinki, tampere] = KM_FROM_BASES[cityKey];
  return tampere < helsinki ? 'tampere' : 'helsinki';
}

export type BaseTripAdvice = {
  /** Tukikohta, josta keikka lasketaan (lähempi). */
  base: BaseId;
  fromCity: string;
  toCity: string;
  /** Tukikohdasta lähtöosoitteelle ja kohteesta tukikohtaan, km. */
  fromKm: number;
  toKm: number;
  /** Muuton oma matka, jonka laskurin hinta jo kattaa, km. */
  loadedKm: number;
  /** Tyhjä ajo, jota hinta ei kata (km). */
  extraEmptyKm: number;
  /** Lisä € sis. ALV (1–2 hengen keikka / 3 hengen muutto), pyöristetty 5 €:oon. */
  surcharge: number;
  surchargeCrew3: number;
  /** Liidin hintaan jo sisältyvä tukikohtalisä (€), kun liidi on tehty laskurilla 4.11.2026 jälkeen. */
  includedInPrice: number | null;
};

/** Poimii osoitteesta kunnan (viimeinen tunnettu kunnan nimi). Postinumerot ja "Finland/Suomi" ohitetaan. */
export function cityFromAddress(address: string | null | undefined): { key: string; name: string } | null {
  if (!address) return null;
  // Sanat kirjaimina: "Hämeenlinnantie" ei ole "Hämeenlinna" (kadunnimi ei saa laukaista osumaa).
  const tokens = address.toLowerCase().match(/\p{L}+/gu) ?? [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const key = tokens[i];
    if (isKnownCity(key)) return { key, name: key.charAt(0).toUpperCase() + key.slice(1) };
  }
  return null;
}

const roundTo5 = (euros: number) => Math.round(euros / 5) * 5;

export function baseTripAdvice(input: {
  fromAddress?: string | null;
  toAddress?: string | null;
  /** Muuton oma matka (laskurin etäisyys), jos tiedossa. */
  distanceKm?: number | null;
}): BaseTripAdvice | null {
  const from = cityFromAddress(input.fromAddress);
  const to = cityFromAddress(input.toAddress);
  if (!from || !to) return null;

  // Lähempi tukikohta: vähemmän tyhjää ajoa yhteensä (tasapelissä Helsinki).
  const [fromHki, fromTre] = KM_FROM_BASES[from.key];
  const [toHki, toTre] = KM_FROM_BASES[to.key];
  const base: BaseId = fromTre + toTre < fromHki + toHki ? 'tampere' : 'helsinki';
  const fromKm = base === 'tampere' ? fromTre : fromHki;
  const toKm = base === 'tampere' ? toTre : toHki;
  const sameCity = from.key === to.key;
  const known = typeof input.distanceKm === 'number' && Number.isFinite(input.distanceKm) && input.distanceKm >= 0 ? input.distanceKm : null;

  // Ilman tunnettua etäisyyttä arvioidaan vain saman kunnan sisäinen muutto (ei arvata kuntien välistä matkaa).
  if (known === null && !sameCity) return null;

  // Muuton oma matka ei voi olla lyhyempi kuin kuntien etäisyyserotus tukikohdasta (kolmioepäyhtälö) —
  // suojaa tilanteelta, jossa laskurin etäisyyshaku epäonnistui ja jäi oletukseen 5 km.
  const loadedKm = Math.max(known ?? 0, Math.abs(fromKm - toKm), sameCity ? 5 : 0);
  const extraEmptyKm = Math.max(0, fromKm + toKm - loadedKm - BASE_TRIP_FREE_KM);

  const surchargeCrew3 = roundTo5(extraEmptyKm * BASE_TRIP_RATE_PER_KM_CREW3);
  if (surchargeCrew3 < BASE_TRIP_MIN_SURCHARGE) return null;

  return {
    base,
    fromCity: from.name,
    toCity: to.name,
    fromKm,
    toKm,
    loadedKm,
    extraEmptyKm,
    surcharge: roundTo5(extraEmptyKm * BASE_TRIP_RATE_PER_KM),
    surchargeCrew3,
    includedInPrice: null,
  };
}

/**
 * Laskurin tukikohtalisä (€ sis. ALV): 3 hengen hinta täydelle muuttopalvelulle, 1–2 hengen hinta
 * kantoavulle, kuljettaja + autolle ja kuljetukselle. 0, kun lisä jää alle BASE_TRIP_MIN_SURCHARGE.
 */
export function baseTripCharge(input: {
  fromAddress?: string | null;
  toAddress?: string | null;
  distanceKm?: number | null;
  crew3: boolean;
}): { advice: BaseTripAdvice; surcharge: number } | null {
  const advice = baseTripAdvice(input);
  if (!advice) return null;
  const surcharge = input.crew3 ? advice.surchargeCrew3 : advice.surcharge;
  return surcharge >= BASE_TRIP_MIN_SURCHARGE ? { advice, surcharge } : null;
}

/** Liidin kentistä (osoitteet + laskurin formData.distanceKm). Vuokraus- ja työapuliideille ei arviota. */
export function leadBaseTripAdvice(lead: {
  fromAddress?: string | null;
  toAddress?: string | null;
  formData?: unknown;
}): BaseTripAdvice | null {
  let data: Record<string, unknown> = {};
  try {
    const parsed = typeof lead.formData === 'string' ? JSON.parse(lead.formData) : lead.formData;
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    // formData ei ole JSON — jatketaan ilman etäisyyttä
  }
  const payload = data.payload && typeof data.payload === 'object' ? (data.payload as Record<string, unknown>) : null;
  const serviceType = typeof data.serviceType === 'string' ? data.serviceType : payload?.service_type;
  if (serviceType === 'vuokraus' || serviceType === 'tyoapu') return null;

  const advice = baseTripAdvice({
    fromAddress: lead.fromAddress,
    toAddress: lead.toAddress,
    distanceKm: typeof data.distanceKm === 'number' ? data.distanceKm : null,
  });
  if (!advice) return null;
  const included = typeof data.baseTripSurcharge === 'number' && data.baseTripSurcharge > 0 ? data.baseTripSurcharge : null;
  return { ...advice, includedInPrice: included };
}

const eur = (value: number) => `${value.toLocaleString('fi-FI')} €`;

const baseFrom = (advice: BaseTripAdvice) => (advice.base === 'tampere' ? 'Tampereen tukikohdasta' : 'Helsingin tukikohdasta');

/** Yksi rivi Discordiin, kalenteriin ja listoihin. */
export function baseTripSummary(advice: BaseTripAdvice): string {
  const place = advice.fromCity === advice.toCity ? advice.fromCity : `${advice.fromCity}–${advice.toCity}`;
  if (advice.includedInPrice != null) {
    return `noin ${Math.round(advice.extraEmptyKm)} km tyhjää ajoa ${baseFrom(advice)} (${place}). Tukikohtalisä ${eur(advice.includedInPrice)} sisältyy laskurin hintaan.`;
  }
  return `noin ${Math.round(advice.extraEmptyKm)} km tyhjää ajoa ${baseFrom(advice)} (${place}), jota laskurin hinta ei kata. Ehdotettu lisä noin ${eur(advice.surcharge)} (3 hengellä noin ${eur(advice.surchargeCrew3)}).`;
}
