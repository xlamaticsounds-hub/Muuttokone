'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';
import { createLog } from '@/server/repo/logs';
import { updateLeadStatus } from '@/server/actions';

export type AiTodoResult = { success: true } | { success: false; message: string };

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  return session;
}

/** "Tee ehdotettu": vaihtaa liidin tilan samalla tavalla kuin käsin (kalenteri, lokit, säännöt) ja sulkee huomion. */
export async function applyAiTodo(id: string): Promise<AiTodoResult> {
  const session = await requireSession();
  const todo = await prisma.aiTodo.findUnique({ where: { id } });
  if (!todo || todo.status !== 'OPEN') return { success: false, message: 'Huomiota ei löytynyt tai se on jo käsitelty.' };
  if (!todo.leadId || !todo.suggestedStatus) return { success: false, message: 'Tällä huomiolla ei ole tehtävää toimenpidettä.' };

  try {
    await updateLeadStatus(todo.leadId, todo.suggestedStatus);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Tilan vaihto epäonnistui.' };
  }
  await prisma.aiTodo.update({ where: { id }, data: { status: 'DONE', resolvedAt: new Date() } });
  await createLog({
    entityType: 'Lead',
    entityId: todo.leadId,
    action: 'ai_todo.applied',
    message: `AI:n ehdotus hyväksytty: ${todo.title}`,
    data: { todoId: id, suggestedStatus: todo.suggestedStatus },
    actorId: session.user?.email ?? null,
  });
  return { success: true };
}

/** "Valmis" (hoidettu käsin) tai "Ohita" (ei tarvita). Kumpikaan ei palaa listalle samasta syystä. */
export async function resolveAiTodo(id: string, outcome: 'DONE' | 'DISMISSED'): Promise<AiTodoResult> {
  await requireSession();
  const todo = await prisma.aiTodo.findUnique({ where: { id } });
  if (!todo) return { success: false, message: 'Huomiota ei löytynyt.' };
  await prisma.aiTodo.update({ where: { id }, data: { status: outcome, resolvedAt: new Date() } });
  return { success: true };
}

/** "Päivitä nyt": ajaa saman lukukierroksen kuin ajastus (posti -> huomiot -> ilmoitukset). */
export async function runMailCycleNow(): Promise<{ success: boolean; message: string }> {
  await requireSession();
  const { runMailCycle } = await import('@/server/mail-cycle');
  try {
    const result = await runMailCycle('manual');
    if (!result.ran) return { success: false, message: result.reason };
    const r = result.record;
    if (r.errors.length > 0 && r.scanned === 0) return { success: false, message: `Luku epäonnistui: ${r.errors[0]}` };
    const parts = [`${r.scanned} uutta viestiä`];
    if (r.applied) parts.push(`${r.applied} päivitystä`);
    if (r.suggested) parts.push(`${r.suggested} ehdotusta`);
    if (r.todosCreated) parts.push(`${r.todosCreated} uutta huomiota`);
    return { success: true, message: `Luettu: ${parts.join(', ')}.${r.errors.length ? ` (${r.errors.length} virhettä)` : ''}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Lukukierros epäonnistui.' };
  }
}

export type ReplyDraftResult =
  | { success: true; to: string; subject: string; body: string; usedCustomerMessage: boolean }
  | { success: false; message: string };

/**
 * Tekee tekoälyluonnoksen vastaukseksi (needs_reply) tai muistutukseksi (follow_up). Ei lähetä mitään:
 * luonnos näytetään ihmiselle, joka muokkaa ja lähettää sen omasta sähköpostistaan.
 */
export async function draftReplyForTodo(id: string): Promise<ReplyDraftResult> {
  await requireSession();
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { success: false, message: 'AI-palvelua ei ole määritetty (GOOGLE_GENERATIVE_AI_API_KEY puuttuu).' };
  }

  const todo = await prisma.aiTodo.findUnique({ where: { id } });
  if (!todo || !todo.leadId) return { success: false, message: 'Huomiota tai liidiä ei löytynyt.' };
  if (todo.type !== 'needs_reply' && todo.type !== 'follow_up') {
    return { success: false, message: 'Tälle huomiolle ei voi tehdä vastausluonnosta.' };
  }
  const kind = todo.type;

  const lead = await prisma.lead.findUnique({ where: { id: todo.leadId }, include: { contact: true } });
  if (!lead) return { success: false, message: 'Liidiä ei löytynyt.' };
  const to = lead.contact.email;
  if (!to) return { success: false, message: 'Asiakkaalla ei ole sähköpostiosoitetta — soita hänelle.' };

  const [{ google }, { generateObject }, { z }, rules, format, status, summaryMod, fetchMod] = await Promise.all([
    import('@ai-sdk/google'),
    import('ai'),
    import('zod'),
    import('@/lib/reply-draft'),
    import('@/server/lead-format'),
    import('@/lib/lead-status'),
    import('@/server/email-summary'),
    import('@/server/mail-fetch'),
  ]);

  // Asiakkaan viesti haetaan postipalvelimelta vain tarvittaessa (sisältöä ei säilytetä tietokannassa)
  let original: { subject: string; text: string } | null = null;
  if (kind === 'needs_reply' && todo.sourceMessageId) {
    const event = await prisma.mailEvent.findFirst({ where: { messageId: todo.sourceMessageId } });
    if (event && (event.mailbox === 'tarjous' || event.mailbox === 'info') && (event.folder === 'inbox' || event.folder === 'sent')) {
      original = await fetchMod.fetchMessageText(event.mailbox, event.folder, todo.sourceMessageId);
    }
  }

  const price = format.defaultFinalPrice(lead);
  const summary = summaryMod.parseEmailSummary(lead.emailSummary);
  const customerName = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas';
  const prompt = rules.buildDraftPrompt({
    kind,
    customerName,
    statusLabel: status.LEAD_STATUS_LABELS[lead.status],
    moveDate: lead.requestedDate ? lead.requestedDate.toLocaleDateString('fi-FI', { timeZone: 'UTC' }) : null,
    route: [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → ') || null,
    priceLabel: price != null ? `${price} € sis. alv` : null,
    threadSummary: summary?.summary ?? null,
    customerMessage: original?.text ?? null,
    daysSinceQuote: Math.max(0, Math.floor((Date.now() - lead.updatedAt.getTime()) / 86_400_000)),
  });

  try {
    const { object } = await generateObject({
      model: google('gemini-flash-lite-latest'),
      schema: z.object({
        subject: z.string().describe('Sähköpostin aihe'),
        body: z.string().describe('Viestin teksti rivinvaihtoineen, alkaen tervehdyksestä'),
      }),
      system: rules.DRAFT_SYSTEM_PROMPT,
      prompt,
    });
    const subject =
      kind === 'needs_reply' && original?.subject ? `Re: ${original.subject.replace(/^(re|vs):\s*/i, '')}` : object.subject.trim();
    return { success: true, to, subject, body: rules.normalizeDraftBody(object.body), usedCustomerMessage: Boolean(original) };
  } catch (error) {
    console.error('[draftReplyForTodo] AI-luonnos epäonnistui', error);
    return { success: false, message: 'Luonnoksen teko epäonnistui. Yritä uudelleen.' };
  }
}
