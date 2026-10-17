import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ImapFlow } from 'imapflow';
import type { Contact, Lead, LeadStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { createTodo } from '@/server/ai-todos';
import { connectImap, resolveSentFolderPath, type MailAccount } from '@/server/imap';
import { defaultFinalPrice } from '@/server/lead-format';
import {
  amountsMatch,
  canAutoTransition,
  canSuggestTransition,
  QUOTE_STAGE_STATUSES,
  isAutomatedSender,
  isUkkoSender,
  htmlToText,
  namesMatch,
  parseUkkoPayment,
  pickLeadForEmail,
} from '@/lib/mail-rules';
import { COMPLETED_STATUSES, LEAD_STATUS_LABELS } from '@/lib/lead-status';

/**
 * AI lukee sekä tarjous@- että info@-postilaatikon (saapuneet + lähetetyt), kohdistaa viestit
 * liideihin ja
 *  - kirjaa ukko.fi-maksuilmoitukset (liidi -> Maksettu),
 *  - päivittää liidin tilaa asiakkaan/oman viestin perusteella (tarjous lähetetty, voitettu, hävitty).
 *
 * AI_MAIL_MODE=suggest (oletus): mitään ei muuteta, vaan muutokset kirjataan AiTodo-ehdotuksiksi
 * hallintapaneelin etusivulle. AI_MAIL_MODE=apply: varmat muutokset tehdään suoraan, epävarmat
 * ja riskialttiit (peruminen) jäävät silti ehdotuksiksi. Säännöt: lib/mail-rules.ts.
 */

const ACCOUNTS: MailAccount[] = ['tarjous', 'info'];
const LOOKBACK_DAYS = 3;
// Turvaraja: kuinka monta uutta viestiä kansiota kohti käsitellään yhdellä ajolla (loput seuraavalla)
const MAX_NEW_PER_FOLDER = Math.max(1, Number(process.env.MAIL_INGEST_MAX_NEW_PER_FOLDER) || 25);
const MAX_BODY_CHARS = 3000;
const AUTO_APPLY_CONFIDENCE = 0.85;
const SUGGEST_CONFIDENCE = 0.6;
const MODEL = 'gemini-flash-lite-latest';

export type IngestMode = 'suggest' | 'apply';
export const getIngestMode = (): IngestMode => (process.env.AI_MAIL_MODE === 'apply' ? 'apply' : 'suggest');

export type IngestSummary = {
  mode: IngestMode;
  scanned: number;
  applied: number;
  suggested: number;
  unmatchedPayments: number;
  errors: string[];
};

type RawMail = {
  mailbox: MailAccount;
  folder: 'inbox' | 'sent';
  messageId: string;
  from: string | null;
  to: string[];
  subject: string;
  date: Date;
  text: string;
};

type Outcome = 'applied' | 'suggested' | 'none' | 'unmatched';
type ProcessResult = { kind: string; leadId: string | null; analysis: unknown; outcome: Outcome };
type LeadWithContact = Lead & { contact: Contact };

const fullName = (c: Pick<Contact, 'firstName' | 'lastName' | 'companyName'>) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Asiakas';

// ---------- IMAP ----------

async function fetchNewMails(client: ImapFlow, mailbox: MailAccount, folder: 'inbox' | 'sent', path: string): Promise<RawMail[]> {
  const { simpleParser } = await import('mailparser');
  await client.mailboxOpen(path, { readOnly: true });
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const uids = (await client.search({ since }, { uid: true })) || [];
  if (uids.length === 0) return [];

  // Ensin vain kirjekuoret (kevyt), sitten koko viesti vain uusista
  const idByUid = new Map<number, string>();
  for await (const msg of client.fetch(uids, { envelope: true, uid: true }, { uid: true })) {
    idByUid.set(msg.uid, msg.envelope?.messageId || `noid:${folder}:${msg.uid}`);
  }
  const known = await prisma.mailEvent.findMany({
    where: { mailbox, messageId: { in: [...idByUid.values()] } },
    select: { messageId: true },
  });
  const knownIds = new Set(known.map((k) => k.messageId));
  const newUids = [...idByUid.entries()].filter(([, id]) => !knownIds.has(id)).map(([uid]) => uid).sort((a, b) => a - b).slice(-MAX_NEW_PER_FOLDER);
  if (newUids.length === 0) return [];

  const mails: RawMail[] = [];
  for await (const msg of client.fetch(newUids, { source: true, uid: true }, { uid: true })) {
    if (!msg.source) continue;
    try {
      const parsed = await simpleParser(msg.source);
      const addrs = (field: typeof parsed.to) =>
        (Array.isArray(field) ? field : field ? [field] : []).flatMap((f) => f.value.map((v) => (v.address ?? '').toLowerCase())).filter(Boolean);
      mails.push({
        mailbox,
        folder,
        messageId: idByUid.get(msg.uid)!,
        from: parsed.from?.value[0]?.address?.toLowerCase() ?? null,
        to: addrs(parsed.to),
        subject: parsed.subject ?? '(ei aihetta)',
        date: parsed.date ?? new Date(),
        text: ((parsed.text && parsed.text.trim()) || (typeof parsed.html === 'string' ? htmlToText(parsed.html) : '')).slice(0, MAX_BODY_CHARS),
      });
    } catch (err) {
      console.warn('[mail-ingest] viestin jäsennys epäonnistui, ohitetaan', err);
    }
  }
  return mails;
}

// ---------- AI ----------

const IntentSchema = z.object({
  intent: z.enum(['accepts_quote', 'declines_quote', 'cancels_booking', 'reschedule_request', 'question', 'quote_sent', 'other']),
  confidence: z.number().min(0).max(1).describe('Kuinka varma luokittelu on (0-1)'),
  summary: z.string().describe('Yhden lauseen suomenkielinen tiivistelmä viestistä'),
});

async function classifyIntent(mail: RawMail, lead: LeadWithContact) {
  const outbound = mail.folder === 'sent';
  const { object } = await generateObject({
    model: google(MODEL),
    schema: IntentSchema,
    system:
      'Olet Muuttokone.fi-muuttopalvelun avustaja. Luokittele yksi sähköpostiviesti. Asiakkaan viesti: accepts_quote = asiakas ' +
      'hyväksyy tarjouksen / vahvistaa tilauksen selvästi; declines_quote = asiakas kieltäytyy tai valitsee toisen; cancels_booking = ' +
      'asiakas perumassa jo sovittua muuttoa; reschedule_request = haluaa muuttaa päivää; question = kysymys; other = muu. ' +
      'Meidän lähettämä viesti: quote_sent = viestissä annetaan hinta/tarjous asiakkaalle; muuten other. Ole varovainen: ' +
      'pelkkä kiitos tai kysymys ei ole hyväksyntä. Anna matala confidence jos epävarma.',
    prompt:
      `Liidin nykyinen tila: ${LEAD_STATUS_LABELS[lead.status]}\nAsiakas: ${fullName(lead.contact)}\n` +
      `Suunta: ${outbound ? 'MEIDÄN lähettämä viesti asiakkaalle' : 'ASIAKKAAN viesti meille'}\nAihe: ${mail.subject}\n\n${mail.text}`,
  });
  return object;
}

// ---------- Toiminnot ----------

async function markOpenInvoicePaid(contactId: string, leadId: string) {
  const open = await prisma.invoice.findMany({ where: { contactId, status: { in: ['SENT', 'UNPAID', 'OVERDUE'] } } });
  if (open.length !== 1) return; // epäselvä -> ei arvata
  await prisma.invoice.update({ where: { id: open[0].id }, data: { status: 'PAID' } });
  await createLog({
    entityType: 'Invoice',
    entityId: open[0].id,
    action: 'invoice.paid_by_ai',
    message: `Lasku ${open[0].invoiceNumber} merkitty maksetuksi ukko.fi-ilmoituksen perusteella (liidi ${leadId})`,
    actorId: 'ai-mail',
  });
}

/** Tilan muutos AI:n toimesta: tarkistaa säännöt, kirjaa lokiin ja synkronoi kalenterin kuten käsin tehty muutos. */
export async function applyAutomatedStatus(leadId: string, to: LeadStatus, reason: string, messageId: string): Promise<boolean> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || !canAutoTransition(lead.status, to)) return false;

  const updated = await prisma.lead.update({ where: { id: leadId }, data: { status: to } });
  await createLog({
    entityType: 'Lead',
    entityId: leadId,
    action: 'lead.status_changed_by_ai',
    message: `AI päivitti tilan sähköpostin perusteella: ${LEAD_STATUS_LABELS[lead.status]} -> ${LEAD_STATUS_LABELS[to]} (${reason})`,
    data: { from: lead.status, to, reason, messageId },
    actorId: 'ai-mail',
  });

  const { syncCalendarWithLeadStatus, recreateConfirmedLeadEvent } = await import('@/server/google-calendar');
  await syncCalendarWithLeadStatus(updated, to);
  if (to === 'WON' && !updated.calendarEventId && updated.requestedDate) await recreateConfirmedLeadEvent(updated.id);
  if (to === 'PAID') await markOpenInvoicePaid(lead.contactId, leadId);
  return true;
}

// ---------- Viestin käsittely ----------

async function handlePayment(mail: RawMail, mode: IngestMode): Promise<ProcessResult> {
  const payment = parseUkkoPayment(mail.subject, mail.text);
  if (!payment) {
    // Muu ukko.fi-posti (mainokset ym.). Jos aihe silti viittaa maksuun, nostetaan ihmiselle.
    if (/maksu/i.test(mail.subject)) {
      await createTodo({
        leadId: null,
        type: 'payment_unmatched',
        priority: 1,
        title: `ukko.fi-maksuilmoitusta ei voitu tulkita: ${mail.subject.slice(0, 80)}`,
        reason: 'Viestin muoto poikkesi odotetusta. Tarkista maksu ukko.fi:stä ja päivitä liidi käsin.',
        sourceMessageId: mail.messageId,
        dedupeKey: `payment_unmatched:${mail.messageId}`,
      });
      return { kind: 'ukko_payment', leadId: null, analysis: null, outcome: 'unmatched' };
    }
    return { kind: 'ukko_other', leadId: null, analysis: null, outcome: 'none' };
  }

  // Ehdokkaat: keikat jotka voivat olla maksamatta
  const candidates: LeadWithContact[] = await prisma.lead.findMany({
    where: { status: { in: ['WON', 'COMPLETED', 'INVOICED'] } },
    include: { contact: true },
    orderBy: { updatedAt: 'desc' },
    take: 300,
  });

  let matches = candidates.filter((l) => namesMatch(fullName(l.contact), payment.customerName) || namesMatch(l.contact.companyName, payment.customerName));
  if (payment.amount != null) {
    const byAmount = matches.filter((l) => amountsMatch(payment.amount, defaultFinalPrice(l)));
    if (byAmount.length > 0) matches = byAmount;
  }
  // Laskutetut/tehdyt ensin: niillä maksu on odotettavissa
  const billable = matches.filter((l) => (COMPLETED_STATUSES as LeadStatus[]).includes(l.status));
  if (billable.length > 0) matches = billable;

  const describe = `lasku ${payment.invoiceNumber}, ${payment.customerName ?? 'tuntematon'}, ${payment.amount != null ? `${payment.amount} €` : 'summa ei tiedossa'}`;

  if (matches.length !== 1) {
    await createTodo({
      leadId: matches.length === 0 ? null : matches[0].id,
      type: 'payment_unmatched',
      priority: 1,
      title: `Maksu saapui, mutta liidiä ei voitu kohdistaa: ${payment.customerName ?? 'tuntematon maksaja'}`,
      reason: `ukko.fi-ilmoitus (${describe}). ${matches.length === 0 ? 'Sopivaa liidiä ei löytynyt.' : `${matches.length} sopivaa liidiä — valitse oikea käsin.`}`,
      sourceMessageId: mail.messageId,
      dedupeKey: `payment_unmatched:${mail.messageId}`,
    });
    return { kind: 'ukko_payment', leadId: null, analysis: payment, outcome: 'unmatched' };
  }

  const lead = matches[0];
  if (lead.status === 'WON') {
    // Maksu ilman Tehty-merkintää: lopullista hintaa ei voi arvata -> ihminen merkitsee Tehdyksi
    await createTodo({
      leadId: lead.id,
      type: 'payment_needs_completion',
      priority: 1,
      title: `${fullName(lead.contact)} on maksanut, mutta keikkaa ei ole merkitty Tehdyksi`,
      reason: `ukko.fi-ilmoitus (${describe}). Merkitse keikka ensin Tehdyksi lopullisella hinnalla, sitten Maksetuksi.`,
      sourceMessageId: mail.messageId,
      dedupeKey: `payment_needs_completion:${lead.id}:${mail.messageId}`,
    });
    return { kind: 'ukko_payment', leadId: lead.id, analysis: payment, outcome: 'suggested' };
  }

  if (mode === 'apply' && (await applyAutomatedStatus(lead.id, 'PAID', `ukko.fi-maksuilmoitus (${describe})`, mail.messageId))) {
    return { kind: 'ukko_payment', leadId: lead.id, analysis: payment, outcome: 'applied' };
  }
  await createTodo({
    leadId: lead.id,
    type: 'status_suggestion',
    priority: 1,
    title: `Merkitse maksetuksi: ${fullName(lead.contact)}`,
    reason: `ukko.fi-ilmoitus maksusta (${describe}).`,
    suggestedStatus: 'PAID',
    sourceMessageId: mail.messageId,
    dedupeKey: `status_suggestion:${lead.id}:PAID`,
  });
  return { kind: 'ukko_payment', leadId: lead.id, analysis: payment, outcome: 'suggested' };
}

async function findLeadForAddresses(addresses: string[]): Promise<LeadWithContact | null> {
  // Omat osoitteet (myös lähetetyissä kopiona) eivät ole asiakkaita
  const external = addresses.filter((a) => a && !a.endsWith('@muuttokone.fi'));
  if (external.length === 0) return null;
  const leads = await prisma.lead.findMany({
    where: { OR: external.map((email) => ({ contact: { email: { equals: email, mode: 'insensitive' as const } } })) },
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return pickLeadForEmail(leads);
}

async function handleCustomerMail(mail: RawMail, mode: IngestMode): Promise<ProcessResult> {
  const outbound = mail.folder === 'sent';
  if (!outbound && isAutomatedSender(mail.from)) return { kind: 'other', leadId: null, analysis: null, outcome: 'none' };

  const lead = await findLeadForAddresses(outbound ? mail.to : mail.from ? [mail.from] : []);
  if (!lead) return { kind: 'other', leadId: null, analysis: null, outcome: 'none' };

  const kind = outbound ? 'customer_outbound' : 'customer_inbound';
  // Meidän lähettämä viesti voi muuttaa tilaa vain tarjousvaiheessa (esim. käsin kirjoitettu tarjous).
  // Muulloin (varausvahvistus, kuitti, jatkokeskustelu) tekoälyä ei tarvita — eikä se saa tulkita
  // järjestelmän omia viestejä uusiksi tarjouksiksi. Viesti kirjataan silti: se kertoo että vastattu.
  if (outbound && !QUOTE_STAGE_STATUSES.includes(lead.status)) return { kind, leadId: lead.id, analysis: null, outcome: 'none' };

  const analysis = await classifyIntent(mail, lead);

  const target: LeadStatus | null = outbound
    ? analysis.intent === 'quote_sent' ? 'PROPOSAL_SENT' : null
    : analysis.intent === 'accepts_quote' ? 'WON'
      : analysis.intent === 'declines_quote' ? 'LOST'
        : analysis.intent === 'cancels_booking' ? 'CANCELLED'
          : null;

  const done = (outcome: Outcome): ProcessResult => ({ kind, leadId: lead.id, analysis, outcome });
  if (!target || lead.status === target || analysis.confidence < SUGGEST_CONFIDENCE) return done('none');
  // Ei ehdoteta taaksepäin (esim. Voitettu -> Tarjous lähetetty) eikä valmiille/arkistoidulle liidille
  if (!canSuggestTransition(lead.status, target)) return done('none');

  const who = fullName(lead.contact);
  if (mode === 'apply' && analysis.confidence >= AUTO_APPLY_CONFIDENCE && canAutoTransition(lead.status, target)) {
    if (await applyAutomatedStatus(lead.id, target, analysis.summary, mail.messageId)) return done('applied');
  }

  // Peruminen on aina ehdotus; myös muut, jos tila ei saa automaattisesti vaihtua tai varmuus on matala
  await createTodo({
    leadId: lead.id,
    type: 'status_suggestion',
    priority: target === 'CANCELLED' || target === 'WON' ? 1 : 2, // hyväksyntä ja peruminen vaativat nopean reaktion
    title: `Vaihda tilaksi ${LEAD_STATUS_LABELS[target]}: ${who}`,
    reason: `${analysis.summary} (varmuus ${Math.round(analysis.confidence * 100)} %, nykyinen tila ${LEAD_STATUS_LABELS[lead.status]})`,
    suggestedStatus: target,
    sourceMessageId: mail.messageId,
    dedupeKey: `status_suggestion:${lead.id}:${target}`,
  });
  return done('suggested');
}

async function processMail(mail: RawMail, mode: IngestMode): Promise<ProcessResult> {
  if (mail.folder === 'inbox' && isUkkoSender(mail.from)) return handlePayment(mail, mode);
  return handleCustomerMail(mail, mode);
}

// ---------- Ajo ----------

export async function runMailIngest(): Promise<IngestSummary> {
  const mode = getIngestMode();
  const summary: IngestSummary = { mode, scanned: 0, applied: 0, suggested: 0, unmatchedPayments: 0, errors: [] };

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    summary.errors.push('GOOGLE_GENERATIVE_AI_API_KEY puuttuu.');
    return summary;
  }

  for (const account of ACCOUNTS) {
    let client: ImapFlow;
    try {
      client = await connectImap(account);
    } catch (err) {
      summary.errors.push(`${account}: yhteys epäonnistui (${err instanceof Error ? err.message : String(err)})`);
      continue;
    }

    try {
      const folders: { folder: 'inbox' | 'sent'; path: string }[] = [
        { folder: 'inbox', path: 'INBOX' },
        { folder: 'sent', path: await resolveSentFolderPath(client) },
      ];
      for (const { folder, path } of folders) {
        let mails: RawMail[] = [];
        try {
          mails = await fetchNewMails(client, account, folder, path);
        } catch (err) {
          summary.errors.push(`${account}/${folder}: luku epäonnistui (${err instanceof Error ? err.message : String(err)})`);
          continue;
        }
        for (const mail of mails) {
          summary.scanned += 1;
          try {
            const result = await processMail(mail, mode);
            await prisma.mailEvent.create({
              data: {
                mailbox: account,
                folder,
                messageId: mail.messageId,
                fromAddress: mail.from,
                toAddress: mail.to.join(', ') || null,
                subject: mail.subject,
                receivedAt: mail.date,
                kind: result.kind,
                leadId: result.leadId,
                analysis: (result.analysis ?? undefined) as never,
                outcome: result.outcome,
              },
            });
            if (result.outcome === 'applied') summary.applied += 1;
            if (result.outcome === 'suggested') summary.suggested += 1;
            if (result.outcome === 'unmatched') summary.unmatchedPayments += 1;
          } catch (err) {
            // Ei kirjata MailEventiä: viesti yritetään uudelleen seuraavalla ajolla
            console.error('[mail-ingest] viestin käsittely epäonnistui', err);
            summary.errors.push(`${account}/${folder}: ${mail.subject.slice(0, 40)} — ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    } finally {
      await client.logout().catch(() => {});
    }
  }
  return summary;
}
