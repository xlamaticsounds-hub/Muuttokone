import type { ImapFlow } from 'imapflow';

/**
 * Yhteinen IMAP-apuri tarjous@muuttokone.fi-postilaatikkoon (sama tili kuin SMTP-lähetys
 * käyttää oletuksena). Sama perusmalli kuin send-quote.ts:n appendSentCopy/resolveSentFolderPath
 * — tarkoituksella oma, itsenäinen kopio (ei jaettu import send-quote.ts:stä), koska
 * send-quote.ts on tätä kirjoitettaessa vielä keskeneräinen, committaamaton ominaisuus eikä
 * sitä haluta tässä yhteydessä koskea. Kun se joskus valmistuu, nämä kaksi voi yhdistää.
 */
export async function connectImap(): Promise<ImapFlow> {
  const host = process.env.IMAP_HOST || process.env.SMTP_HOST;
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error('IMAP-asetuksia (IMAP_HOST/IMAP_USER/IMAP_PASSWORD tai SMTP_*) ei ole määritetty palvelimelle.');
  }

  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  return client;
}

/**
 * IMAP-palvelimet nimeävät Lähetetyt-kansion eri tavoin — sama tunnistuslogiikka kuin
 * send-quote.ts:ssä: ensin SPECIAL-USE-lipulla (\Sent) merkitty kansio, sitten tunnetut
 * nimet, ja lopuksi IMAP_SENT_FOLDER-ympäristömuuttuja jos asetettu.
 */
export async function resolveSentFolderPath(client: ImapFlow): Promise<string> {
  const override = process.env.IMAP_SENT_FOLDER;
  if (override) return override;

  const mailboxes = await client.list();

  const bySpecialUse = mailboxes.find((box) => box.specialUse === '\\Sent');
  if (bySpecialUse) return bySpecialUse.path;

  const commonNames = new Set(['Sent', 'Sent Items', 'INBOX.Sent', 'Lähetetyt', 'INBOX.Lähetetyt']);
  const byName = mailboxes.find((box) => commonNames.has(box.name) || commonNames.has(box.path));
  if (byName) return byName.path;

  console.warn(
    `resolveSentFolderPath: ei löytynyt Lähetetyt-kansiota automaattisesti (kansiot: ${mailboxes.map((b) => b.path).join(', ')}). Käytetään "Sent" — aseta IMAP_SENT_FOLDER jos tämä on väärin.`,
  );
  return 'Sent';
}
