import { connectImap, resolveSentFolderPath, type MailAccount } from '@/server/imap';
import { htmlToText } from '@/lib/mail-rules';

/**
 * Hakee yksittäisen viestin tekstin Message-ID:llä suoraan postipalvelimelta (viestien sisältöä ei
 * tallenneta tietokantaan, vain tunnisteet). Palauttaa null jos viestiä ei löydy tai haku epäonnistuu.
 */
export async function fetchMessageText(
  mailbox: MailAccount,
  folder: 'inbox' | 'sent',
  messageId: string,
  maxChars = 3000,
): Promise<{ subject: string; text: string } | null> {
  if (messageId.startsWith('noid:')) return null;
  let client: Awaited<ReturnType<typeof connectImap>> | null = null;
  try {
    client = await connectImap(mailbox);
    const path = folder === 'sent' ? await resolveSentFolderPath(client) : 'INBOX';
    await client.mailboxOpen(path, { readOnly: true });
    const uids = await client.search({ header: { 'message-id': messageId } }, { uid: true });
    if (!uids || uids.length === 0) return null;

    const { simpleParser } = await import('mailparser');
    for await (const msg of client.fetch([uids[uids.length - 1]], { source: true }, { uid: true })) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const text = (parsed.text && parsed.text.trim()) || (typeof parsed.html === 'string' ? htmlToText(parsed.html) : '');
      return { subject: parsed.subject ?? '', text: text.slice(0, maxChars) };
    }
    return null;
  } catch (error) {
    console.warn('[mail-fetch] viestin haku epäonnistui', error);
    return null;
  } finally {
    await client?.logout().catch(() => {});
  }
}
