// Liidin sähköpostihaun puhtaat apufunktiot (ei IMAP- tai AI-riippuvuuksia, jotta ne ovat testattavissa).
// Käyttäjä: server/email-summary.ts (liidin sivun "Yhteenveto sähköposteista").
//
// Muuttomaailma-liidit: alusta lähettää info@-osoitteeseen yhteenvedon meidän tarjouksestamme
// ("Muuttotarjous: A - B (#123), Etunimi S.") ja ilmoituksen voitetusta keikasta ("Uusi muuttokeikka!"),
// mutta viesteissä ei ole asiakkaan sähköpostiosoitetta. Ne löydetään pyynnön katuosoitteesta, joka
// on viestin lopussa ("Mistä / Mihin"). Asiakkaan omat vastaukset löytyvät sähköpostiosoitteella.

export type MailDirection = 'inbound' | 'outbound' | 'platform';

/** Muuttomaailma-palvelun lähettäjädomain. */
export const PLATFORM_DOMAIN = 'muuttomaailma.fi';

/**
 * Katuosoite haettavaksi viestin tekstistä: katu + talonumero ("Viholankatu 12 A11, 37120 Nokia" -> "Viholankatu 12").
 * Palauttaa null jos osoitteessa ei ole talonumeroa (pelkkä kaupunki ei kelpaa hakuavaimeksi: osuisi liian moneen viestiin).
 */
export function streetSearchKey(address: string | null | undefined): string | null {
  if (!address) return null;
  const first = address.split(',')[0]?.trim() ?? '';
  // Talonumero 1–3 numeroa (postinumero tai muu pitkä numerosarja ei ole talonumero)
  const match = first.match(/^(\p{L}[\p{L}\s.'-]*?\s\d{1,3})(?!\d)/u);
  if (!match) return null;
  const key = match[1].replace(/\s+/g, ' ').trim();
  // Liian lyhyt avain (esim. "Katu 5") osuisi moneen viestiin
  return key.length >= 8 ? key : null;
}

/** Hakuavaimet liidille: asiakkaan sähköposti ja enintään kaksi katuosoitetta (lähtö, kohde). */
export function leadMailSearchKeys(lead: {
  fromAddress?: string | null;
  toAddress?: string | null;
  contact?: { email?: string | null } | null;
}): { email: string | null; streets: string[] } {
  const email = lead.contact?.email?.trim() || null;
  const streets = [...new Set([streetSearchKey(lead.fromAddress), streetSearchKey(lead.toAddress)].filter((k): k is string => k !== null))];
  return { email, streets };
}

/** Muuttomaailman yksittäistä keikkaa koskevat viestit (ei päiväkoosteita eikä tapahtumayhteenvetoja). */
export function isPlatformJobSubject(subject: string | null | undefined): boolean {
  return /^(?:(?:re|vs|fw|fwd):\s*)*(?:muuttotarjous:|uusi muuttokeikka)/i.test((subject ?? '').trim());
}

export function speakerLabel(direction: MailDirection): string {
  if (direction === 'inbound') return 'Asiakas';
  if (direction === 'platform') return 'Muuttomaailma (tarjous tai ilmoitus)';
  return 'Muuttokone.fi';
}

/** Sama viesti voi olla molemmissa postilaatikoissa (esim. vastaus kopiona): pidetään yksi. */
export function dedupeMessages<T extends { messageId?: string | null; date: Date; subject: string; direction: MailDirection }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.messageId ? `id:${item.messageId}` : `${item.direction}|${item.date.getTime()}|${item.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
