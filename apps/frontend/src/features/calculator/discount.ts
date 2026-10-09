import { VAT_RATE, type PriceBreakdown } from './pricing';

// Kumppanien alennuskoodit (esim. Kiinteistömaailma) ja niistä maksettava välityspalkkio.
// Puhdas moduuli ilman tietokantaa: laskuri käyttää tätä näyttääkseen alennuksen, palvelin
// (api/submit, server/lead-format.ts) laskee saman uudelleen liidiä tallennettaessa —
// selaimen lähettämään hintaan ei luoteta. Koodin haku tietokannasta: server/discount-codes.ts.

/** Tietokannan DiscountCode-rivin kentät joita voimassaolon tarkistus ja laskenta tarvitsevat. */
export type DiscountCodeRecord = {
  code: string;
  partner: string;
  office: string | null;
  agentName: string | null;
  discountPercent: number;
  commissionPercent: number;
  active: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
};

export type DiscountCodeCheck =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'not_found' | 'inactive' | 'not_started' | 'expired'; message: string };

/**
 * Koodit tallennetaan ja haetaan aina tässä muodossa, joten vertailu ei välitä kirjainkoosta
 * eikä ääkkösistä: asiakas kirjoittaa brändin nimen luontevasti "Kiinteistömaailma", koodi on
 * KIINTEISTOMAAILMA — molemmat kelpaavat.
 */
export function normalizeDiscountCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[ÄÅ]/g, 'A')
    .replace(/Ö/g, 'O');
}

export function checkDiscountCode(record: DiscountCodeRecord | null, now: Date = new Date()): DiscountCodeCheck {
  if (!record) return { ok: false, reason: 'not_found', message: 'Alennuskoodia ei löytynyt. Tarkista koodi.' };
  if (!record.active) return { ok: false, reason: 'inactive', message: 'Alennuskoodi ei ole enää voimassa.' };
  if (record.validFrom && now < record.validFrom) {
    return { ok: false, reason: 'not_started', message: 'Alennuskoodi ei ole vielä voimassa.' };
  }
  if (record.validUntil && now > record.validUntil) {
    return { ok: false, reason: 'expired', message: 'Alennuskoodi ei ole enää voimassa.' };
  }
  return { ok: true };
}

function formatPercent(percent: number): string {
  return `${percent.toLocaleString('fi-FI', { maximumFractionDigits: 2 })} %`;
}

/** Asiakkaalle näytettävä teksti, esim. "Kiinteistömaailma-etu -10 %". */
export function discountLabel(partner: string, discountPercent: number): string {
  return `${partner}-etu -${formatPercent(discountPercent)}`;
}

export type PartnerDiscount = {
  discountPercent: number;
  priceBeforeDiscount: number; // koko hinta täysinä euroina (sis. alv)
  discountableAmount: number; // muuton osuus josta alennus lasketaan (€, ei pyöristetty)
  discountAmount: number; // täysinä euroina
  priceAfterDiscount: number; // priceBeforeDiscount - discountAmount
};

/**
 * Kumppanialennus lasketaan muuton hinnasta päiväalennuksen ja vähimmäishintojen JÄLKEEN
 * (alennukset kertautuvat, ja koodi saa viedä hinnan vähimmäishinnan alle). Kilometrikorvaus
 * on osa muuttoa. Alennus EI koske muuttosiivousta, kierrätyksen jätemaksuja eikä
 * laatikkovuokraa — ne maksetaan täysimääräisinä.
 *
 * Pyöristys täysiin euroihin niin, että näytettävät luvut täsmäävät aina keskenään:
 * ennen = round(total), alennus = round(muuton osuus × %), jälkeen = ennen - alennus.
 */
export function computePartnerDiscount(
  breakdown: Pick<PriceBreakdown, 'total' | 'addOnsTotal' | 'boxRental'>,
  discountPercent: number,
): PartnerDiscount {
  const priceBeforeDiscount = Math.round(breakdown.total);
  const discountableAmount = Math.max(
    0,
    breakdown.total - (breakdown.addOnsTotal ?? 0) - (breakdown.boxRental?.total ?? 0),
  );
  const discountAmount = Math.round((discountableAmount * discountPercent) / 100);
  return {
    discountPercent,
    priceBeforeDiscount,
    discountableAmount,
    discountAmount,
    priceAfterDiscount: priceBeforeDiscount - discountAmount,
  };
}

const roundCents = (value: number) => Math.round(value * 100) / 100;

/**
 * Kumppanille maksettava välityspalkkio toteutuneesta muutosta: prosentti lopullisesta
 * laskutetusta hinnasta ilman arvonlisäveroa. finalPriceGross on sis. alv (kuten kaikki
 * muuttohinnat), tulokset senttiin pyöristettyinä.
 */
export function computeCommission(
  finalPriceGross: number,
  commissionPercent: number,
  vatRate: number = VAT_RATE,
): { finalPriceNet: number; commissionAmount: number } {
  const finalPriceNet = roundCents(finalPriceGross / (1 + vatRate));
  return { finalPriceNet, commissionAmount: roundCents((finalPriceNet * commissionPercent) / 100) };
}
