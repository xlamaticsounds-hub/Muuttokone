import type { LeadStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { isTodoStillRelevant, leadTimeTodos } from '@/lib/ai-todo-rules';

const fullName = (c: { firstName: string | null; lastName: string | null; companyName: string | null }) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || 'Asiakas';

const NEEDS_REPLY_GRACE_HOURS = 6; // annetaan aikaa vastata ennen kuin se nousee listalle
const NEEDS_REPLY_WINDOW_DAYS = 14;
const URGENT_REPLY_AFTER_DAYS = 2;

/** Luo huomion. Sama dedupeKey ei nouse uudelleen, vaikka aiempi olisi tehty tai ohitettu. */
export async function createTodo(params: {
  leadId: string | null;
  type: string;
  priority: number;
  title: string;
  reason: string;
  suggestedStatus?: LeadStatus | null;
  sourceMessageId?: string | null;
  dedupeKey: string;
}) {
  await prisma.aiTodo.upsert({
    where: { dedupeKey: params.dedupeKey },
    update: {},
    // status asetetaan eksplisiittisesti (ei vain tietokannan oletuksella), jotta huomio näkyy listassa varmasti
    create: { ...params, status: 'OPEN', suggestedStatus: params.suggestedStatus ?? null, sourceMessageId: params.sourceMessageId ?? null },
  });
}

async function resolveTodo(id: string) {
  await prisma.aiTodo.update({ where: { id }, data: { status: 'DONE', resolvedAt: new Date() } });
}

/**
 * Hetki jolloin AI aloitti: AI_TODO_BASELINE (ISO-päivä) tai ensimmäisen käsitellyn viestin aika.
 * Null jos AI ei ole vielä käsitellyt yhtään viestiä (silloin laskutus/maksusääntöjä ei ajeta).
 */
async function aiTodoBaseline(): Promise<Date | null> {
  const fromEnv = process.env.AI_TODO_BASELINE ? new Date(process.env.AI_TODO_BASELINE) : null;
  if (fromEnv && !Number.isNaN(fromEnv.getTime())) return fromEnv;
  const first = await prisma.mailEvent.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  return first?.createdAt ?? null;
}

/**
 * Pitää huomiolistan ajan tasalla: sulkee vanhentuneet, luo aikapohjaiset (seuranta, laskuttamatta,
 * maksamatta) ja "vastaa asiakkaalle" -huomiot sähköpostitapahtumista. Ajetaan cronissa
 * sähköpostiluvun jälkeen.
 */
export async function refreshAiTodos(now = new Date()): Promise<{ created: number; closed: number }> {
  let closed = 0;
  const before = await prisma.aiTodo.count({});

  // 1. Sulje vanhentuneet
  const open = await prisma.aiTodo.findMany({ where: { status: 'OPEN', leadId: { not: null } } });
  if (open.length > 0) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: [...new Set(open.map((t) => t.leadId as string))] } },
      select: { id: true, status: true },
    });
    const statusById = new Map(leads.map((l) => [l.id, l.status]));
    for (const todo of open) {
      const status = statusById.get(todo.leadId as string);
      if (status && !isTodoStillRelevant(todo, status)) {
        await resolveTodo(todo.id);
        closed += 1;
      }
    }
  }

  // 2. Aikapohjaiset huomiot (laskutus/maksu vain AI:n käyttöönoton jälkeen tehdyistä keikoista)
  const baseline = await aiTodoBaseline();
  const candidates = await prisma.lead.findMany({
    where: { status: { in: ['PROPOSAL_SENT', 'COMPLETED', 'INVOICED'] } },
    include: { contact: true },
    take: 500,
  });
  for (const lead of candidates) {
    for (const draft of leadTimeTodos(lead, fullName(lead.contact), now, baseline)) {
      await createTodo({ leadId: lead.id, ...draft });
      if (draft.type === 'unpaid') {
        // Maksuhuomio korvaa aiemman "muista laskuttaa" -huomion
        const older = await prisma.aiTodo.findMany({ where: { leadId: lead.id, type: 'not_invoiced', status: 'OPEN' } });
        for (const todo of older) {
          await resolveTodo(todo.id);
          closed += 1;
        }
      }
    }
  }

  // 3. Vastaamattomat asiakasviestit
  const since = new Date(now.getTime() - NEEDS_REPLY_WINDOW_DAYS * 86_400_000);
  const events = await prisma.mailEvent.findMany({
    where: { leadId: { not: null }, kind: { in: ['customer_inbound', 'customer_outbound'] }, receivedAt: { gte: since } },
    orderBy: { receivedAt: 'asc' },
  });
  const byLead = new Map<string, typeof events>();
  for (const e of events) byLead.set(e.leadId as string, [...(byLead.get(e.leadId as string) ?? []), e]);

  for (const [leadId, list] of byLead) {
    const lastInbound = [...list].reverse().find((e) => e.kind === 'customer_inbound' && (e.analysis as { intent?: string } | null)?.intent && (e.analysis as { intent?: string }).intent !== 'other');
    const replied = lastInbound ? list.some((e) => e.kind === 'customer_outbound' && e.receivedAt > lastInbound.receivedAt) : true;

    if (replied) {
      const stale = await prisma.aiTodo.findMany({ where: { leadId, type: 'needs_reply', status: 'OPEN' } });
      for (const todo of stale) {
        await resolveTodo(todo.id);
        closed += 1;
      }
      continue;
    }
    if (!lastInbound) continue;
    const ageMs = now.getTime() - lastInbound.receivedAt.getTime();
    if (ageMs < NEEDS_REPLY_GRACE_HOURS * 3_600_000) continue;

    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { contact: true } });
    if (!lead || ['ARCHIVED', 'LOST', 'CANCELLED', 'PAID'].includes(lead.status)) continue;
    const analysis = lastInbound.analysis as { summary?: string } | null;
    await createTodo({
      leadId,
      type: 'needs_reply',
      priority: ageMs > URGENT_REPLY_AFTER_DAYS * 86_400_000 ? 1 : 2,
      title: `Vastaa asiakkaalle: ${fullName(lead.contact)}`,
      reason: analysis?.summary ?? `Asiakas lähetti viestin "${lastInbound.subject ?? ''}" eikä siihen ole vastattu.`,
      sourceMessageId: lastInbound.messageId,
      dedupeKey: `needs_reply:${leadId}:${lastInbound.id}`,
    });
  }

  const after = await prisma.aiTodo.count({});
  return { created: Math.max(0, after - before), closed };
}
