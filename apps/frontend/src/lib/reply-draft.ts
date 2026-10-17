// Vastausluonnoksen promptin rakennus ja siivous. Erillään AI-kutsusta jotta se on testattava.

export type DraftKind = 'needs_reply' | 'follow_up';

export const DRAFT_SYSTEM_PROMPT =
  'Olet Muuttokone.fi-muuttopalvelun asiakaspalvelija. Kirjoita sähköpostiluonnos suomeksi. ' +
  'Puhuttele asiakasta sinuttelemalla (sinä, sinun) johdonmukaisesti. Sävy on ystävällinen, asiallinen ja lyhyt: ' +
  'tervehdys, 1–2 lyhyttä asiakappaletta ja lopetus, kappaleiden välissä tyhjä rivi. ' +
  'ÄLÄ KEKSI hintoja, aikoja, saatavuutta tai lupauksia, joita ei ole annettu alla olevissa tiedoissa. ' +
  'Jos asiakas kysyy jotain, mihin tiedot eivät vastaa, kirjoita että palaat asiaan tai pyydä puuttuva tieto. ' +
  'Lopeta täsmälleen: "Ystävällisin terveisin,\nMuuttokone.fi". Älä lisää allekirjoitukseen muuta.';

export type DraftFacts = {
  kind: DraftKind;
  customerName: string;
  statusLabel: string;
  moveDate: string | null; // valmiiksi muotoiltu, esim. "18.10.2026"
  route: string | null;
  priceLabel: string | null; // esim. "650 € sis. alv"
  threadSummary: string | null;
  customerMessage: string | null; // asiakkaan viimeisin viesti (needs_reply)
  daysSinceQuote: number | null; // follow_up
};

export function buildDraftPrompt(f: DraftFacts): string {
  const facts = [
    `Asiakas: ${f.customerName}`,
    `Liidin tila: ${f.statusLabel}`,
    f.moveDate && `Muuttopäivä: ${f.moveDate}`,
    f.route && `Reitti: ${f.route}`,
    f.priceLabel && `Hinta (tarjottu/arvioitu): ${f.priceLabel}`,
    f.threadSummary && `Aiemman keskustelun yhteenveto: ${f.threadSummary}`,
  ].filter(Boolean);

  const task =
    f.kind === 'needs_reply'
      ? `Tehtävä: kirjoita vastaus asiakkaan viimeisimpään viestiin.\n\nAsiakkaan viesti:\n"""\n${f.customerMessage ?? '(viestin sisältöä ei saatu haettua — kirjoita yleinen, avoin vastaus ja kysy mitä asiakas tarvitsee)'}\n"""`
      : `Tehtävä: kirjoita ystävällinen muistutus tarjouksesta${f.daysSinceQuote != null ? ` (tarjous lähetetty ${f.daysSinceQuote} päivää sitten)` : ''}. Kysy onko asiakas ehtinyt miettiä tarjousta ja tarjoa vastata kysymyksiin. Älä painosta.`;

  return `${facts.join('\n')}\n\n${task}`;
}

/** mailto-linkki valmiilla aiheella ja tekstillä (rivinvaihdot säilyvät). */
export function mailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Siivoaa mallin tulosta: poistaa ylimääräiset lainausmerkit ja varmistaa yhtenäisen allekirjoituksen. */
export function normalizeDraftBody(body: string): string {
  let text = body.replace(/\r\n/g, '\n').trim();
  text = text.replace(/^["“]+|["”]+$/g, '').trim();
  if (!/Muuttokone\.fi\s*$/i.test(text)) text = `${text}\n\nYstävällisin terveisin,\nMuuttokone.fi`;
  return text;
}
