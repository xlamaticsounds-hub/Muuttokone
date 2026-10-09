import type { ImapFlow } from 'imapflow';

// Yhteinen sähköpostin lähetys kaikille asiakkaalle lähteville viesteille (tarjous, lasku,
// maksumuistutus, kuitti, varausvahvistus). Lähettää tarjous@muuttokone.fi -postilaatikon
// kautta (Zoner SMTP) ja tallentaa kopion postilaatikon Lähetetyt-kansioon, jotta kaikki
// asiakkaalle lähetetty näkyy myös sähköpostiohjelmassa.

export type MailAttachment = { filename: string; content: Buffer; contentType: string };

export type OutgoingMail = {
  to: string;
  cc?: string; // esim. kumppaniraportin kopio meille
  subject: string;
  html: string;
  attachments?: MailAttachment[];
};

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export const SMTP_NOT_CONFIGURED_MESSAGE =
  'Sähköpostiasetuksia (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ei ole vielä määritetty palvelimelle.';

/**
 * Lähettää viestin SMTP:llä. Heittää virheen jos SMTP-lähetys epäonnistuu — kutsuja
 * muuttaa sen käyttäjälle näytettäväksi viestiksi. Lähetetyt-kopion epäonnistuminen ei
 * heitä, koska viesti on silloin jo mennyt perille asiakkaalle.
 */
export async function sendMail(mail: OutgoingMail): Promise<void> {
  const senderName = process.env.QUOTE_EMAIL_FROM_NAME || 'Muuttokone.fi';
  const mailOptions = {
    from: `"${senderName}" <${process.env.SMTP_USER}>`,
    to: mail.to,
    ...(mail.cc && { cc: mail.cc }),
    subject: mail.subject,
    html: mail.html,
    attachments: mail.attachments,
  };

  // Ladataan nodemailer vasta täällä (ei moduulin huipulla) jotta puuttuvat SMTP-asetukset
  // eivät kaada koko sovellusta buildissa/importissa — vain lähetystä kutsuttaessa.
  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions);

  // SMTP-lähetys itsessään ei jätä mitään kopiota mihinkään IMAP-kansioon (se on
  // webmail-clientin oma toiminto, ei jotain minkä SMTP-protokolla tekee).
  try {
    await appendSentCopy(mailOptions);
  } catch (err) {
    console.error('sendMail: IMAP append to Sent folder failed (email itself was sent OK)', err);
  }
}

/**
 * Rakentaa lähetetyn viestin uudelleen RFC822-raakamuotoon ja tallentaa siitä kopion
 * postilaatikon "Lähetetyt"-kansioon IMAP APPEND -komennolla. Käyttää samoja
 * SMTP_HOST/USER/PASSWORD-tunnuksia oletuksena (sama Zoner-tili), mutta ne voi
 * ylikirjoittaa erillisillä IMAP_*-muuttujilla jos IMAP on eri palvelimella.
 */
async function appendSentCopy(mailOptions: Record<string, unknown>): Promise<void> {
  const host = process.env.IMAP_HOST || process.env.SMTP_HOST;
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    console.warn('appendSentCopy: IMAP-asetuksia ei ole määritetty, ohitetaan Lähetetyt-kopio.');
    return;
  }

  // nodemailerin oma MailComposer tuottaa saman rfc822-raakaviestin jonka transporter.sendMail
  // lähettäisi SMTP:llä (liitteineen) — IMAP APPEND vaatii raa'an MIME-viestin.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mailComposerModule: any = await import('nodemailer/lib/mail-composer/index.js');
  const MailComposer = mailComposerModule.default ?? mailComposerModule;
  const composer = new MailComposer(mailOptions);
  const raw: Buffer = await new Promise((resolve, reject) => {
    composer.compile().build((err: Error | null, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });

  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  try {
    const sentPath = await resolveSentFolderPath(client);
    await client.append(sentPath, raw, ['\\Seen']);
  } finally {
    await client.logout();
  }
}

/**
 * IMAP-palvelimet nimeävät Lähetetyt-kansion eri tavoin (esim. "Sent", "INBOX.Sent",
 * "Lähetetyt"). Käytetään IMAP_SENT_FOLDER-ympäristömuuttujaa jos asetettu, muuten
 * SPECIAL-USE-lipulla (\Sent) merkittyä kansiota ja lopuksi tunnettuja nimiä.
 */
async function resolveSentFolderPath(client: ImapFlow): Promise<string> {
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
