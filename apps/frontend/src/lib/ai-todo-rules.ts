import type { LeadStatus } from '@prisma/client';
import { LEAD_STATUS_LABELS } from '@/lib/lead-status';

// AI-huomiolistan aikaan perustuvat säännöt (ei tarvitse tekoälyä): puhtaita funktioita, jotta ne
// voi testata. Sähköpostista johdetut huomiot (ehdotukset, vastaamattomat) tulevat mail-ingest.ts:stä.

export const FOLLOW_UP_AFTER_DAYS = 4; // tarjous lähetetty, asiakas ei ole vastannut
export const FOLLOW_UP_MAX_DAYS = 30; // sitä vanhempaa tarjousta ei enää kannata jahdata
export const NOT_INVOICED_AFTER_DAYS = 3; // keikka tehty, laskua ei ole vielä merkitty
export const UNPAID_AFTER_DAYS = 14; // tehty/laskutettu, maksua ei ole tullut

export type TodoDraft = {
  type: 'follow_up' | 'not_invoiced' | 'unpaid';
  priority: number;
  title: string;
  reason: string;
  dedupeKey: string;
};

type LeadForTodos = {
  id: string;
  status: LeadStatus;
  updatedAt: Date;
  completedAt: Date | null;
};

const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 86_400_000);

/**
 * Aikaan perustuvat huomiot. `baseline` on hetki jolloin AI aloitti postin luvun: Laskutettu- ja
 * Maksettu-tilat ovat uusia, joten sitä vanhemmat Tehty-keikat ovat lähes varmasti jo maksettuja
 * vaikka tila ei sitä kerro — niistä ei nosteta laskutus- tai maksuhuomioita (ilman baselinea
 * ensimmäinen ajo täyttäisi listan vääristä hälytyksistä). Ilman baselinea (null) näitä sääntöjä
 * ei ajeta lainkaan.
 */
export function leadTimeTodos(lead: LeadForTodos, customer: string, now: Date, baseline: Date | null = null): TodoDraft[] {
  const drafts: TodoDraft[] = [];

  if (lead.status === 'PROPOSAL_SENT') {
    const days = daysBetween(lead.updatedAt, now);
    if (days >= FOLLOW_UP_AFTER_DAYS && days <= FOLLOW_UP_MAX_DAYS) {
      drafts.push({
        type: 'follow_up',
        priority: 2,
        title: `Seuraa tarjousta: ${customer}`,
        reason: `Tarjous lähetetty ${days} päivää sitten eikä tila ole muuttunut. Lähetä muistutus tai soita.`,
        dedupeKey: `follow_up:${lead.id}`,
      });
    }
  }

  if ((lead.status === 'COMPLETED' || lead.status === 'INVOICED') && baseline) {
    const since = lead.completedAt ?? lead.updatedAt;
    if (since >= baseline) {
      const days = daysBetween(since, now);
      if (days >= UNPAID_AFTER_DAYS) {
        drafts.push({
          type: 'unpaid',
          priority: 1,
          title: `Maksua ei ole tullut: ${customer}`,
          reason: `Keikka on tehty ${days} päivää sitten, eikä maksuilmoitusta ole tullut. Tarkista ukko.fi ja lähetä tarvittaessa muistutus.`,
          dedupeKey: `unpaid:${lead.id}`,
        });
      } else if (lead.status === 'COMPLETED' && days >= NOT_INVOICED_AFTER_DAYS) {
        drafts.push({
          type: 'not_invoiced',
          priority: 2,
          title: `Keikka tehty, muista laskuttaa: ${customer}`,
          reason: `Keikka on merkitty tehdyksi ${days} päivää sitten, mutta tilaa Laskutettu ei ole asetettu.`,
          dedupeKey: `not_invoiced:${lead.id}`,
        });
      }
    }
  }

  return drafts;
}

/**
 * Onko avoin huomio vielä ajankohtainen kun liidin tila on nyt `leadStatus`? Muuten se suljetaan
 * automaattisesti (esim. ehdotus "Maksettu" kun liidi on jo Maksettu).
 */
export function isTodoStillRelevant(todo: { type: string; suggestedStatus: LeadStatus | null }, leadStatus: LeadStatus): boolean {
  switch (todo.type) {
    case 'status_suggestion':
      return todo.suggestedStatus != null && leadStatus !== todo.suggestedStatus && !isBeyond(leadStatus, todo.suggestedStatus);
    case 'follow_up':
      return leadStatus === 'PROPOSAL_SENT';
    case 'not_invoiced':
      return leadStatus === 'COMPLETED';
    case 'unpaid':
      return leadStatus === 'COMPLETED' || leadStatus === 'INVOICED';
    case 'payment_needs_completion':
      return leadStatus === 'WON';
    default:
      return true; // needs_reply, payment_unmatched ym.: sulkeutuvat muilla säännöillä tai käsin
  }
}

const PIPELINE: LeadStatus[] = ['NEW', 'SCHEDULED', 'PROPOSAL_SENT', 'WON', 'COMPLETED', 'INVOICED', 'PAID'];
/** Liidi on jo pidemmällä putkessa kuin ehdotettu tila (ehdotus on vanhentunut). */
function isBeyond(current: LeadStatus, suggested: LeadStatus): boolean {
  const a = PIPELINE.indexOf(current);
  const b = PIPELINE.indexOf(suggested);
  return a !== -1 && b !== -1 && a > b;
}

export const statusLabel = (status: LeadStatus) => LEAD_STATUS_LABELS[status];
