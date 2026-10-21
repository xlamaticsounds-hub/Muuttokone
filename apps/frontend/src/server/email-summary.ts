import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ImapFlow } from 'imapflow';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { connectImap, resolveSentFolderPath, type MailAccount } from '@/server/imap';
import {
  PLATFORM_DOMAIN,
  dedupeMessages,
  isPlatformJobSubject,
  leadMailSearchKeys,
  speakerLabel,
  type MailDirection,
} from '@/lib/mail-search';

// Rajat estävät loputonta ketjua räjäyttämästä AI-promptia (ja IMAP-hakua kestämästä ikuisuuksia).
const MAX_MESSAGES_PER_FOLDER = 40;
const MAX_TOTAL_MESSAGES = 40;
const MAX_BODY_CHARS = 3000;
// Muuttomaailma-alustan tarjousyhteenveto voi tulla ennen kuin liidi on luotu hallintaan
const PLATFORM_LOOKBACK_MS = 3 * 86_400_000;

/** Luettavat postilaatikot: tarjous@ (tarjoukset) ja info@ (mm. kaikki Muuttomaailma-liidit). */
const ACCOUNTS: MailAccount[] = ['tarjous', 'info'];
const ACCOUNT_LABEL: Record<MailAccount, string> = { tarjous: 'tarjous@', info: 'info@' };

export type EmailSummaryData = {
  summary: string;
  agreedDates: { date: string; description: string }[];
  openQuestions: string[];
  messageCount: number;
  generatedAt: string; // ISO
  /** Postilaatikot jotka haussa oikeasti luettiin, esim. ["tarjous@", "info@"] (puuttuu vanhoista yhteenvedoista). */
  mailboxes?: string[];
};

export type EmailSummaryResult = { success: true; data: EmailSummaryData } | { success: false; message: string };

// Lead.emailSummary on Prisma Json-kenttä, joten sen muoto pitää tarkistaa ajossa — sama
// varovaisuus kuin Lead.formData:ssa (parseLeadFormData) ja Invoice.items:ssä (parseInvoiceItems).
export function parseEmailSummary(json: unknown): EmailSummaryData | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.summary !== 'string' || typeof obj.generatedAt !== 'string') return null;
  const parsed: EmailSummaryData = {
    summary: obj.summary,
    agreedDates: Array.isArray(obj.agreedDates)
      ? obj.agreedDates
          .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
          .map((d) => ({
            date: typeof d.date === 'string' ? d.date : '',
            description: typeof d.description === 'string' ? d.description : '',
          }))
      : [],
    openQuestions: Array.isArray(obj.openQuestions) ? obj.openQuestions.filter((q): q is string => typeof q === 'string') : [],
    messageCount: typeof obj.messageCount === 'number' ? obj.messageCount : 0,
    generatedAt: obj.generatedAt,
  };
  if (Array.isArray(obj.mailboxes)) parsed.mailboxes = obj.mailboxes.filter((m): m is string => typeof m === 'string');
  return parsed;
}

type ParsedEntry = { date: Date; subject: string; text: string; direction: MailDirection; messageId: string | null };

function formatDateFi(date: Date): string {
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------- IMAP-yhteydet ----------

/**
 * Yksi IMAP-yhteys per postilaatikko, jota voi käyttää useamman liidin yhteenvetoihin peräkkäin
 * (ajastettu ajo käy läpi kaikki liidit: yhteyden avaus joka liidille ja joka laatikolle olisi hidasta).
 * Yhteys avataan vasta kun sitä tarvitaan; epäonnistunut yhteys muistetaan, ettei sitä yritetä
 * uudelleen jokaiselle liidille saman ajon aikana.
 */
export type MailSession = {
  client(account: MailAccount): Promise<ImapFlow>;
  sentPath(account: MailAccount): Promise<string>;
  /** Hylkää (ja sulkee) yhteyden, esim. kun sen käyttö kaatui — seuraava käyttö avaa uuden. */
  drop(account: MailAccount): Promise<void>;
  close(): Promise<void>;
};

export function createMailSession(): MailSession {
  const clients = new Map<MailAccount, Promise<ImapFlow>>();
  const sentPaths = new Map<MailAccount, string>();
  const failures = new Map<MailAccount, Error>();

  const session: MailSession = {
    client(account) {
      const failed = failures.get(account);
      if (failed) return Promise.reject(failed);
      let pending = clients.get(account);
      if (!pending) {
        pending = connectImap(account).catch((err) => {
          failures.set(account, err instanceof Error ? err : new Error(String(err)));
          clients.delete(account);
          throw err;
        });
        clients.set(account, pending);
      }
      return pending;
    },
    async sentPath(account) {
      const cached = sentPaths.get(account);
      if (cached) return cached;
      const path = await resolveSentFolderPath(await session.client(account));
      sentPaths.set(account, path);
      return path;
    },
    async drop(account) {
      const pending = clients.get(account);
      clients.delete(account);
      sentPaths.delete(account);
      const client = await pending?.catch(() => null);
      await client?.logout().catch(() => {});
    },
    async close() {
      for (const account of [...clients.keys()]) await session.drop(account);
    },
  };
  return session;
}

async function searchFolder(
  client: ImapFlow,
  mailbox: string,
  criteria: Record<string, unknown>,
  direction: MailDirection,
  subjectFilter?: (subject: string) => boolean,
): Promise<ParsedEntry[]> {
  const { simpleParser } = await import('mailparser');

  await client.mailboxOpen(mailbox, { readOnly: true });
  const uids = await client.search(criteria, { uid: true });
  if (!uids || uids.length === 0) return [];

  // search() palauttaa UID:t nousevassa järjestyksessä — viimeiset N ovat uusimmat viestit.
  const capped = uids.slice(-MAX_MESSAGES_PER_FOLDER);

  const entries: ParsedEntry[] = [];
  for await (const msg of client.fetch(capped, { source: true }, { uid: true })) {
    if (!msg.source) continue;
    try {
      const parsed = await simpleParser(msg.source);
      const subject = parsed.subject ?? '(ei aihetta)';
      if (subjectFilter && !subjectFilter(subject)) continue;
      entries.push({
        date: parsed.date ?? new Date(0),
        subject,
        text: (parsed.text ?? '').slice(0, MAX_BODY_CHARS),
        direction,
        messageId: parsed.messageId ?? null,
      });
    } catch (err) {
      console.warn('email-summary: viestin jäsennys epäonnistui, ohitetaan', err);
    }
  }
  return entries;
}

/**
 * Kerää liidin viestit molemmista postilaatikoista. Yhden laatikon tulokset otetaan mukaan vasta kun sen haku
 * onnistui kokonaan; epäonnistunut laatikko kirjataan `failures`-listaan eikä estä toisen lukemista.
 */
export async function collectLeadMails(
  session: MailSession,
  params: { email: string | null; streets: string[]; since: Date; platformSince: Date },
): Promise<{ found: ParsedEntry[]; scanned: MailAccount[]; failures: string[] }> {
  const found: ParsedEntry[] = [];
  const scanned: MailAccount[] = [];
  const failures: string[] = [];

  for (const account of ACCOUNTS) {
    try {
      const client = await session.client(account);
      const fromAccount: ParsedEntry[] = [];
      if (params.email) {
        fromAccount.push(...(await searchFolder(client, 'INBOX', { from: params.email, since: params.since }, 'inbound')));
        const sentPath = await session.sentPath(account);
        fromAccount.push(...(await searchFolder(client, sentPath, { to: params.email, since: params.since }, 'outbound')));
      }
      if (account === 'info') {
        for (const street of params.streets) {
          try {
            fromAccount.push(
              ...(await searchFolder(client, 'INBOX', { from: PLATFORM_DOMAIN, text: street, since: params.platformSince }, 'platform', isPlatformJobSubject)),
            );
          } catch (err) {
            // Täydentävä haku: sen epäonnistuminen ei saa estää muuta yhteenvetoa
            console.warn('email-summary: Muuttomaailma-viestien haku epäonnistui', err);
          }
        }
      }
      found.push(...fromAccount);
      scanned.push(account);
    } catch (err) {
      failures.push(`${ACCOUNT_LABEL[account]}: ${err instanceof Error ? err.message : String(err)}`);
      await session.drop(account);
    }
  }
  return { found, scanned, failures };
}

const SummarySchema = z.object({
  summary: z.string().describe('Lyhyt, 2-4 lauseen yhteenveto koko sähköpostikeskustelusta suomeksi.'),
  agreedDates: z
    .array(
      z.object({
        date: z.string().describe('Sovittu päivämäärä tai ajankohta sellaisena kuin viesteissä mainittu, esim. "15.10.2026" tai "viikolla 42"'),
        description: z.string().describe('Mitä kyseiseen ajankohtaan liittyy, esim. "muuttopäivä vahvistettu" tai "kartoituskäynti"'),
      }),
    )
    .describe('Kaikki viesteissä mainitut sovitut tai ehdotetut ajankohdat/aikataulut, aikajärjestyksessä.'),
  openQuestions: z.array(z.string()).describe('Avoimet, vielä vastaamattomat kysymykset tai sopimatta olevat asiat.'),
});

/**
 * Käy IMAP:lla läpi sekä tarjous@- että info@muuttokone.fi-postilaatikon (saapuneet ja Lähetetyt):
 *  - viestit joissa liidin yhteystiedon sähköpostiosoite on lähettäjänä tai vastaanottajana (liidin luontipäivästä eteenpäin),
 *  - info@-laatikosta Muuttomaailma-alustan tarjousyhteenvedot ja voitetun keikan ilmoitukset, jotka löytyvät
 *    pyynnön katuosoitteesta (viesteissä ei ole asiakkaan sähköpostia, ja kaikki Muuttomaailma-liidit tulevat info@:iin),
 * ja pyytää AI:ta (Gemini) tekemään niistä yhteenvedon + poimimaan sovitut ajat.
 * Tulos tallennetaan Lead.emailSummary-kenttään. Kutsutaan joko liidin sivun napista tai
 * ajastetusta /api/cron/email-summaries-reitistä (joka antaa yhteisen `session`-yhteyden).
 *
 * Palauttaa aina tuloksen (ei heitä) — sama periaate kuin send-quote.ts/send-receipt.ts:ssä.
 */
export async function generateLeadEmailSummary(leadId: string, session?: MailSession): Promise<EmailSummaryResult> {
  const ownSession = session ? null : createMailSession();
  try {
    return await generateLeadEmailSummaryInner(leadId, session ?? ownSession!);
  } catch (err) {
    console.error('generateLeadEmailSummary: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe yhteenvedon luonnissa.',
    };
  } finally {
    await ownSession?.close();
  }
}

async function generateLeadEmailSummaryInner(leadId: string, session: MailSession): Promise<EmailSummaryResult> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { success: false, message: 'AI-palvelua ei ole määritetty (GOOGLE_GENERATIVE_AI_API_KEY puuttuu).' };
  }
  const hasImapConfig =
    (process.env.IMAP_HOST || process.env.SMTP_HOST) &&
    (process.env.IMAP_USER || process.env.SMTP_USER) &&
    (process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD);
  if (!hasImapConfig) {
    return { success: false, message: 'Sähköpostiasetuksia (IMAP_HOST/IMAP_USER/IMAP_PASSWORD) ei ole määritetty palvelimelle.' };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
  if (!lead) {
    return { success: false, message: 'Liidiä ei löytynyt.' };
  }
  const { email: customerEmail, streets } = leadMailSearchKeys(lead);
  if (!customerEmail && streets.length === 0) {
    return {
      success: false,
      message: 'Tällä liidillä ei ole sähköpostiosoitetta eikä katuosoitetta — ei voida hakea sähköpostikeskustelua.',
    };
  }

  const { found, scanned, failures } = await collectLeadMails(session, {
    email: customerEmail,
    streets,
    since: lead.createdAt,
    platformSince: new Date(lead.createdAt.getTime() - PLATFORM_LOOKBACK_MS),
  });

  if (scanned.length === 0) {
    return { success: false, message: `Postilaatikoihin ei saatu yhteyttä (${failures.join('; ')}).` };
  }
  if (failures.length > 0) console.warn('email-summary: osa postilaatikoista jäi lukematta', failures);

  const mailboxes = scanned.map((a) => ACCOUNT_LABEL[a]);
  const entries = dedupeMessages(found)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-MAX_TOTAL_MESSAGES);

  if (entries.length === 0) {
    const data: EmailSummaryData = {
      summary: 'Ei löytynyt sähköpostikeskustelua tälle asiakkaalle.',
      agreedDates: [],
      openQuestions: [],
      messageCount: 0,
      generatedAt: new Date().toISOString(),
      mailboxes,
    };
    await prisma.lead.update({ where: { id: leadId }, data: { emailSummary: data } });
    return { success: true, data };
  }

  const transcript = entries
    .map((e) => `[${formatDateFi(e.date)}] ${speakerLabel(e.direction)} — ${e.subject}\n${e.text}`)
    .join('\n\n---\n\n');

  const { object } = await generateObject({
    model: google('gemini-flash-lite-latest'),
    schema: SummarySchema,
    system: `Olet Muuttokone.fi-muuttopalvelun avustaja. Tehtäväsi on lukea sähköpostiketju asiakkaan ja
    yrityksen välillä ja tehdä siitä lyhyt, hyödyllinen yhteenveto myyjälle/asiakaspalvelulle suomeksi.
    Viesteissä voi olla mukana myös Muuttomaailma-palvelun lähettämiä viestejä: "Yhteenveto tarjouksestasi" on
    yrityksen palvelun kautta asiakkaalle lähettämä tarjous (hinta, ehdot ja pyynnön tiedot) ja "Uusi muuttokeikka"
    ilmoittaa että asiakas on hyväksynyt tarjouksen.
    Kiinnitä erityistä huomiota kaikkiin mainittuihin päivämääriin ja ajankohtiin (muuttopäivä,
    kartoituskäynti, soittoaika ym.) — poimi ne kaikki agreedDates-listaan, vaikka ne olisivat vasta
    ehdotettuja eikä lopullisesti vahvistettuja. Älä keksi mitään mitä viesteissä ei sanota.`,
    prompt: `Tässä sähköpostiketju (vanhimmasta uusimpaan):\n\n${transcript}`,
  });

  const data: EmailSummaryData = {
    summary: object.summary,
    agreedDates: object.agreedDates,
    openQuestions: object.openQuestions,
    messageCount: entries.length,
    generatedAt: new Date().toISOString(),
    mailboxes,
  };

  await prisma.lead.update({ where: { id: leadId }, data: { emailSummary: data } });

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.email_summary_generated',
    message: `Sähköpostiyhteenveto luotu (${entries.length} viestiä läpikäyty, ${mailboxes.join(' + ')})`,
    data: { messageCount: entries.length, agreedDatesCount: object.agreedDates.length, mailboxes },
  });

  return { success: true, data };
}
