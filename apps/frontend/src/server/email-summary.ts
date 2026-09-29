import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ImapFlow } from 'imapflow';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { connectImap, resolveSentFolderPath } from '@/server/imap';

// Rajat estävät loputonta ketjua räjäyttämästä AI-promptia (ja IMAP-hakua kestämästä ikuisuuksia).
const MAX_MESSAGES_PER_FOLDER = 40;
const MAX_TOTAL_MESSAGES = 40;
const MAX_BODY_CHARS = 3000;

export type EmailSummaryData = {
  summary: string;
  agreedDates: { date: string; description: string }[];
  openQuestions: string[];
  messageCount: number;
  generatedAt: string; // ISO
};

export type EmailSummaryResult = { success: true; data: EmailSummaryData } | { success: false; message: string };

// Lead.emailSummary on Prisma Json-kenttä, joten sen muoto pitää tarkistaa ajossa — sama
// varovaisuus kuin Lead.formData:ssa (parseLeadFormData) ja Invoice.items:ssä (parseInvoiceItems).
export function parseEmailSummary(json: unknown): EmailSummaryData | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.summary !== 'string' || typeof obj.generatedAt !== 'string') return null;
  return {
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
}

type ParsedEntry = { date: Date; subject: string; text: string; direction: 'inbound' | 'outbound' };

function formatDateFi(date: Date): string {
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function searchFolder(
  client: ImapFlow,
  mailbox: string,
  criteria: Record<string, unknown>,
  direction: 'inbound' | 'outbound',
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
      entries.push({
        date: parsed.date ?? new Date(0),
        subject: parsed.subject ?? '(ei aihetta)',
        text: (parsed.text ?? '').slice(0, MAX_BODY_CHARS),
        direction,
      });
    } catch (err) {
      console.warn('email-summary: viestin jäsennys epäonnistui, ohitetaan', err);
    }
  }
  return entries;
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
 * Käy IMAP:lla läpi tarjous@muuttokone.fi-postilaatikon INBOX:in ja Lähetetyt-kansion,
 * etsii viestit joissa liidin yhteystiedon sähköpostiosoite esiintyy (liidin luontipäivästä
 * eteenpäin), ja pyytää AI:ta (Gemini) tekemään niistä yhteenvedon + poimimaan sovitut ajat.
 * Tulos tallennetaan Lead.emailSummary-kenttään. Kutsutaan joko liidin sivun napista tai
 * ajastetusta /api/cron/email-summaries-reitistä.
 *
 * Palauttaa aina tuloksen (ei heitä) — sama periaate kuin send-quote.ts/send-receipt.ts:ssä.
 */
export async function generateLeadEmailSummary(leadId: string): Promise<EmailSummaryResult> {
  try {
    return await generateLeadEmailSummaryInner(leadId);
  } catch (err) {
    console.error('generateLeadEmailSummary: unexpected error', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Odottamaton virhe yhteenvedon luonnissa.',
    };
  }
}

async function generateLeadEmailSummaryInner(leadId: string): Promise<EmailSummaryResult> {
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
  const customerEmail = lead.contact.email;
  if (!customerEmail) {
    return { success: false, message: 'Tällä liidillä ei ole sähköpostiosoitetta — ei voida hakea sähköpostikeskustelua.' };
  }

  const client = await connectImap();
  let entries: ParsedEntry[];
  try {
    const inboundEntries = await searchFolder(
      client,
      'INBOX',
      { from: customerEmail, since: lead.createdAt },
      'inbound',
    );
    const sentPath = await resolveSentFolderPath(client);
    const outboundEntries = await searchFolder(
      client,
      sentPath,
      { to: customerEmail, since: lead.createdAt },
      'outbound',
    );
    entries = [...inboundEntries, ...outboundEntries]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-MAX_TOTAL_MESSAGES);
  } finally {
    await client.logout().catch(() => {});
  }

  if (entries.length === 0) {
    const data: EmailSummaryData = {
      summary: 'Ei löytynyt sähköpostikeskustelua tälle asiakkaalle.',
      agreedDates: [],
      openQuestions: [],
      messageCount: 0,
      generatedAt: new Date().toISOString(),
    };
    await prisma.lead.update({ where: { id: leadId }, data: { emailSummary: data } });
    return { success: true, data };
  }

  const transcript = entries
    .map((e) => `[${formatDateFi(e.date)}] ${e.direction === 'inbound' ? 'Asiakas' : 'Muuttokone.fi'} — ${e.subject}\n${e.text}`)
    .join('\n\n---\n\n');

  const { object } = await generateObject({
    model: google('gemini-flash-lite-latest'),
    schema: SummarySchema,
    system: `Olet Muuttokone.fi-muuttopalvelun avustaja. Tehtäväsi on lukea sähköpostiketju asiakkaan ja
    yrityksen välillä ja tehdä siitä lyhyt, hyödyllinen yhteenveto myyjälle/asiakaspalvelulle suomeksi.
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
  };

  await prisma.lead.update({ where: { id: leadId }, data: { emailSummary: data } });

  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.email_summary_generated',
    message: `Sähköpostiyhteenveto luotu (${entries.length} viestiä läpikäyty)`,
    data: { messageCount: entries.length, agreedDatesCount: object.agreedDates.length },
  });

  return { success: true, data };
}
