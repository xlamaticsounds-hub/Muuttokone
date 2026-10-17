import type { LeadStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { defaultFinalPrice } from '@/server/lead-format';
import { completeTargetFor, type CompleteLeadTarget } from '@/app/hallinta/liidit/complete-target';
import {
  CLOSED_STAGES,
  PIPELINE_STAGES,
  formatEuros,
  sortStageCards,
  stageAgeWarning,
  stageFor,
  sumValues,
  summarizeMail,
  type LastMail,
  type MailEventLike,
} from '@/lib/pipeline';

const DAY_MS = 86_400_000;
const CLOSED_LIMIT = 8; // suljetuista vaiheista (Maksettu, Peruttu, Hävitty) näytetään tuoreimmat
const MAIL_WINDOW_DAYS = 30;
const OPEN_STATUSES: LeadStatus[] = ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'COMPLETED', 'INVOICED'];

export type PipelineTodo = { id: string; type: string; suggestedStatus: LeadStatus | null };

export type PipelineCardData = {
  id: string;
  name: string;
  phone: string | null;
  route: string;
  moveDate: string | null; // valmiiksi muotoiltu (UTC-päivä)
  status: LeadStatus; // liidin oikea tila
  valueLabel: string | null;
  ageDays: number;
  stale: boolean;
  partner: string | null;
  todos: PipelineTodo[];
  lastMail: LastMail | null;
  completeTarget: CompleteLeadTarget;
};

export type PipelineColumn = {
  status: LeadStatus;
  cards: PipelineCardData[];
  total: number; // kaikki vaiheessa olevat (suljetuilla enemmän kuin kortteja näytetään)
  sumLabel: string | null;
  missingValue: number; // montako korttia ilman hintaa (summa on vähintään tämä)
};

export type PipelineSummaryItem = { key: string; label: string; hint: string; count: number; sumLabel: string | null };

type InternalCard = PipelineCardData & { stage: LeadStatus; value: number | null; createdTs: number; updatedTs: number; moveTs: number | null };

/**
 * Pipeline-näkymän data: kortit sarakkeittain, AI:n avoimet huomiot ja viimeisin sähköposti liidiä kohti sekä
 * euromäärät vaiheittain. AI-tiedot ovat lisätietoa — jos niiden taulut puuttuvat (migraatiota ei ole ajettu),
 * pipeline toimii silti ilman niitä.
 */
export async function loadPipeline(now = new Date()): Promise<{ columns: PipelineColumn[]; summary: PipelineSummaryItem[] }> {
  const include = { contact: true, discount: { select: { partner: true } } } as const;

  const [openLeads, closedLists, closedCounts] = await Promise.all([
    prisma.lead.findMany({ where: { status: { in: OPEN_STATUSES } }, include }),
    Promise.all(CLOSED_STAGES.map((status) => prisma.lead.findMany({ where: { status }, include, orderBy: { updatedAt: 'desc' }, take: CLOSED_LIMIT }))),
    Promise.all(CLOSED_STAGES.map((status) => prisma.lead.count({ where: { status } }))),
  ]);
  const leads = [...openLeads, ...closedLists.flat()];
  const leadIds = new Set(leads.map((lead) => lead.id));

  const todosByLead = new Map<string, PipelineTodo[]>();
  try {
    const todos = await prisma.aiTodo.findMany({ where: { status: 'OPEN', leadId: { not: null } }, orderBy: { priority: 'asc' } });
    for (const todo of todos) {
      if (!todo.leadId || !leadIds.has(todo.leadId)) continue;
      todosByLead.set(todo.leadId, [...(todosByLead.get(todo.leadId) ?? []), { id: todo.id, type: todo.type, suggestedStatus: todo.suggestedStatus }]);
    }
  } catch (error) {
    console.warn('[pipeline] AI-huomioita ei voitu hakea', error);
  }

  const mailByLead = new Map<string, LastMail>();
  try {
    const since = new Date(now.getTime() - MAIL_WINDOW_DAYS * DAY_MS);
    const events = await prisma.mailEvent.findMany({
      where: { leadId: { not: null }, receivedAt: { gte: since } },
      orderBy: { receivedAt: 'desc' },
      take: 2000,
    });
    const grouped = new Map<string, MailEventLike[]>();
    for (const event of events) {
      if (!event.leadId || !leadIds.has(event.leadId)) continue;
      grouped.set(event.leadId, [...(grouped.get(event.leadId) ?? []), { kind: event.kind, receivedAt: event.receivedAt, analysis: event.analysis }]);
    }
    for (const [leadId, list] of grouped) {
      const last = summarizeMail(list, now);
      if (last) mailByLead.set(leadId, last);
    }
  } catch (error) {
    console.warn('[pipeline] Sähköpostitapahtumia ei voitu hakea', error);
  }

  const cards: InternalCard[] = [];
  for (const lead of leads) {
    const stage = stageFor(lead.status);
    if (!stage) continue;
    const value = defaultFinalPrice(lead);
    const ageDays = Math.max(0, Math.floor((now.getTime() - lead.updatedAt.getTime()) / DAY_MS));
    cards.push({
      id: lead.id,
      name: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas',
      phone: lead.contact.phone,
      route: [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → '),
      // requestedDate tallennetaan UTC-keskiyönä, joten päivä luetaan UTC:nä
      moveDate: lead.requestedDate ? lead.requestedDate.toLocaleDateString('fi-FI', { timeZone: 'UTC' }) : null,
      status: lead.status,
      stage,
      value,
      valueLabel: value != null ? formatEuros(value) : null,
      ageDays,
      stale: stageAgeWarning(stage, ageDays),
      partner: lead.discountCode ? lead.discountPartner ?? lead.discount?.partner ?? 'Kumppani' : null,
      todos: todosByLead.get(lead.id) ?? [],
      lastMail: mailByLead.get(lead.id) ?? null,
      completeTarget: completeTargetFor(lead),
      createdTs: lead.createdAt.getTime(),
      updatedTs: lead.updatedAt.getTime(),
      moveTs: lead.requestedDate ? lead.requestedDate.getTime() : null,
    });
  }

  const strip = ({ stage: _stage, value: _value, createdTs: _c, updatedTs: _u, moveTs: _m, ...card }: InternalCard): PipelineCardData => card;

  const columns: PipelineColumn[] = PIPELINE_STAGES.map((status) => {
    const inStage = cards.filter((card) => card.stage === status);
    const closedIndex = CLOSED_STAGES.indexOf(status);
    const isClosed = closedIndex >= 0;
    const { sum, missing } = sumValues(inStage.map((card) => card.value));
    return {
      status,
      cards: sortStageCards(status, inStage).map(strip),
      total: isClosed ? closedCounts[closedIndex] : inStage.length,
      sumLabel: !isClosed && sum > 0 ? formatEuros(sum) : null, // suljettujen summa olisi harhaanjohtava (vain tuoreimmat näkyvät)
      missingValue: isClosed ? 0 : missing,
    };
  });

  const summarize = (key: string, label: string, hint: string, stages: LeadStatus[]): PipelineSummaryItem => {
    const selected = cards.filter((card) => stages.includes(card.stage));
    const { sum } = sumValues(selected.map((card) => card.value));
    return { key, label, hint, count: selected.length, sumLabel: sum > 0 ? formatEuros(sum) : null };
  };
  const summary = [
    summarize('quoted', 'Tarjottu', 'Tarjous lähetetty, asiakas ei ole vielä vahvistanut', ['PROPOSAL_SENT']),
    summarize('won', 'Voitettu', 'Vahvistettu, keikkaa ei ole vielä tehty', ['WON']),
    summarize('receivable', 'Saamiset', 'Keikka tehty, mutta maksua ei ole vielä tullut (Tehty + Laskutettu)', ['COMPLETED', 'INVOICED']),
  ];

  return { columns, summary };
}
