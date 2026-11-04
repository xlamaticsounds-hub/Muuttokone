// Tukikohtalisä: tyhjä ajo tukikohdasta keikalle ja takaisin.
//
// Tiimipalaverin päätöksellä (4.11.2026) laskuri lisää tukikohtalisän hintaan automaattisesti
// (pricing.ts: applyBaseTrip), ilman päivä- tai kumppanialennusta. Hallinnan varoitus jää vanhoille
// liideille, joiden hinnassa lisää ei vielä ole (formData.baseTripSurcharge puuttuu).
//
// Laskuri hinnoittelee vain matkan lähtöosoitteesta kohdeosoitteeseen. Kun muutto on kaukana
// tukikohdasta (Helsinki), auto ajaa ensin tyhjänä tukikohdasta lähtöosoitteelle ja lopuksi kohteesta
// takaisin. Pitkän muuton hinta kattaa jo paluuajon, mutta paikallisen muuton kaukana (esim. Hamina →
// Hamina) ei: 5 km:n hinta, mutta noin 300 km tyhjää ajoa. Kannattavuusanalyysin (20.10.2026) mukaan
// yksiön ja kaksion tuntiansio jää silloin noin 3–13 €/h per henkilö.
//
// Arvio tehdään kuntatasolla (likimääräiset tieetäisyydet Helsingistä), joten sitä ei tarvitse
// Google-kyselyä eikä tukikohdan osoitetta koodissa. Tulos on suuntaa-antava: "noin".

// Laskurin km-hinta (PRICING_CONSTANTS.ratePerKm) on vain auton osuus: muuton ajoaika laskutetaan sen
// lisäksi tuntihinnalla. Tyhjää ajoa ei laskuteta tunneilla, joten tukikohtalisän km-hinta kattaa myös
// tiimin ajoajan (auto + palkat + omistajien osuus noin 70 km/h keskinopeudella).

/** Lisä per tyhjä km sis. ALV, kun keikalla on 1–2 henkilöä (kantoapu, kuljettaja + auto, kuljetus). ALV 0: 1,10 €. */
export const BASE_TRIP_RATE_PER_KM = 1.38;
/** Sama kun keikalla on 3 henkilöä (muutto, täysi palvelu). ALV 0: 1,50 €. */
export const BASE_TRIP_RATE_PER_KM_CREW3 = 1.88;
/** Pääkaupunkiseudun sisäinen ajo, jota ei veloiteta erikseen (km, tyhjät osuudet yhteensä). */
export const BASE_TRIP_FREE_KM = 30;
/** Tätä pienempää lisää ei veloiteta eikä näytetä varoituksena (€ sis. ALV, ALV 0: 60 €). */
export const BASE_TRIP_MIN_SURCHARGE = 75;
/** Tätä suuremmalla lisällä laskuri ei näytä hintaa: keikka hinnoitellaan tarjouksella (€ sis. ALV). */
export const BASE_TRIP_QUOTE_THRESHOLD = 400;

/** Likimääräinen tieetäisyys tukikohdasta (Helsinki) kunnan keskustaan, km. Avain pienillä kirjaimilla. */
const KM_FROM_BASE: Record<string, number> = {
  // Pääkaupunkiseutu (tukikohdan lähialue: tyypillinen keikkaan kuuluva ajo)
  helsinki: 10, vantaa: 15, espoo: 20, kauniainen: 20,
  // Muu Uusimaa
  kerava: 30, sipoo: 30, tuusula: 35, kirkkonummi: 40, siuntio: 40, järvenpää: 40, nurmijärvi: 40, vihti: 55,
  hyvinkää: 55, mäntsälä: 55, lohja: 55, porvoo: 50, pornainen: 50, inkoo: 55, askola: 60, karkkila: 70,
  pukkila: 70, loviisa: 90, lapinjärvi: 100, raasepori: 100, hanko: 120,
  // Kanta-Häme
  riihimäki: 70, hausjärvi: 65, loppi: 80, janakkala: 85, hämeenlinna: 100, hattula: 105, forssa: 115,
  // Päijät-Häme
  orimattila: 80, hollola: 100, lahti: 105, asikkala: 115, heinola: 135,
  // Kymenlaakso ja Etelä-Karjala
  pyhtää: 115, kouvola: 135, kotka: 135, hamina: 150, virolahti: 170, lappeenranta: 220, imatra: 260,
  // Pirkanmaa
  valkeakoski: 150, akaa: 160, lempäälä: 165, kangasala: 175, tampere: 180, pirkkala: 185, nokia: 190,
  ylöjärvi: 195, orivesi: 210,
  // Varsinais-Suomi ja Satakunta
  salo: 100, paimio: 140, lieto: 160, turku: 165, kaarina: 170, raisio: 170, naantali: 175, parainen: 190,
  uusikaupunki: 230, pori: 250, rauma: 255,
  // Muita
  mikkeli: 230, jyväskylä: 270,
};

export type BaseTripAdvice = {
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
    if (Object.prototype.hasOwnProperty.call(KM_FROM_BASE, key)) return { key, name: key.charAt(0).toUpperCase() + key.slice(1) };
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

  const fromKm = KM_FROM_BASE[from.key];
  const toKm = KM_FROM_BASE[to.key];
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

/** Yksi rivi Discordiin, kalenteriin ja listoihin. */
export function baseTripSummary(advice: BaseTripAdvice): string {
  const place = advice.fromCity === advice.toCity ? advice.fromCity : `${advice.fromCity}–${advice.toCity}`;
  if (advice.includedInPrice != null) {
    return `noin ${Math.round(advice.extraEmptyKm)} km tyhjää ajoa tukikohdasta (${place}). Tukikohtalisä ${eur(advice.includedInPrice)} sisältyy laskurin hintaan.`;
  }
  return `noin ${Math.round(advice.extraEmptyKm)} km tyhjää ajoa tukikohdasta (${place}), jota laskurin hinta ei kata. Ehdotettu lisä noin ${eur(advice.surcharge)} (3 hengellä noin ${eur(advice.surchargeCrew3)}).`;
}
