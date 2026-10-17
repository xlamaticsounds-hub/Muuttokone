import { prisma } from '@/server/db';
import { getAppState, setAppState } from '@/server/app-state';
import { runMailIngest, type IngestSummary } from '@/server/mail-ingest';
import { refreshAiTodos } from '@/server/ai-todos';
import { sendDiscordEmbed } from '@/server/discord-webhook';
import { formatUrgentAlert } from '@/lib/ai-todo-alert';
import { createLog } from '@/server/repo/logs';

export const LAST_RUN_KEY = 'mailIngest.lastRun';

export type MailCycleRecord = {
  at: string; // ISO
  trigger: 'cron' | 'manual';
  mode: IngestSummary['mode'];
  scanned: number;
  applied: number;
  suggested: number;
  unmatchedPayments: number;
  todosCreated: number;
  todosClosed: number;
  alertsSent: number;
  errors: string[];
};

export type MailCycleResult = { ran: true; record: MailCycleRecord } | { ran: false; reason: string };

const globalForCycle = globalThis as unknown as { __mailCycleRunning?: boolean };

/**
 * Yksi täysi kierros: lue posti -> päivitä huomiolista -> ilmoita uusista kiireellisistä Discordiin
 * -> tallenna ajon tulos tilariville. Sekä ajastus (cron) että "Päivitä nyt" -nappi käyttävät tätä.
 * Samaan aikaan pyörii vain yksi kierros (muuten kaksi ajoa voisi käsitellä samat viestit).
 */
export async function runMailCycle(trigger: 'cron' | 'manual'): Promise<MailCycleResult> {
  if (globalForCycle.__mailCycleRunning) return { ran: false, reason: 'Edellinen lukukierros on vielä käynnissä.' };
  globalForCycle.__mailCycleRunning = true;
  const startedAt = new Date();

  try {
    const summary = await runMailIngest();
    // Huomiolista päivitetään aina, vaikka sähköpostiluku epäonnistuisi (aikapohjaiset huomiot eivät tarvitse sitä)
    const todos = await refreshAiTodos();
    const alertsSent = await notifyNewUrgentTodos(startedAt);

    const record: MailCycleRecord = {
      at: new Date().toISOString(),
      trigger,
      mode: summary.mode,
      scanned: summary.scanned,
      applied: summary.applied,
      suggested: summary.suggested,
      unmatchedPayments: summary.unmatchedPayments,
      todosCreated: todos.created,
      todosClosed: todos.closed,
      alertsSent,
      errors: summary.errors,
    };
    await setAppState(LAST_RUN_KEY, record);

    // Lokiin vain ajot joissa tapahtui jotain (muuten Lokit-sivu täyttyisi tyhjistä 15 min ajoista)
    if (record.scanned > 0 || record.errors.length > 0 || record.todosCreated > 0) {
      await createLog({
        entityType: 'System',
        entityId: 'mail-cycle',
        action: 'mail_cycle.run',
        message: `AI luki postin (${trigger}): ${record.scanned} uutta viestiä, ${record.applied} päivitystä, ${record.suggested} ehdotusta${record.errors.length ? `, ${record.errors.length} virhettä` : ''}`,
        data: { ...record },
      }).catch(() => {});
    }
    return { ran: true, record };
  } finally {
    globalForCycle.__mailCycleRunning = false;
  }
}

/**
 * Uudet kiireelliset huomiot (priority 1) tältä kierrokselta yhtenä Discord-viestinä. Ei lähetetä jos
 * tietokanta puuttuu (paikallinen mock-tila), ettei kehitysajo ilmoita oikealle kanavalle.
 */
async function notifyNewUrgentTodos(since: Date): Promise<number> {
  if (!process.env.DATABASE_URL || !process.env.DISCORD_WEBHOOK_URL) return 0;
  const urgent = await prisma.aiTodo.findMany({
    where: { status: 'OPEN', priority: 1, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  const message = formatUrgentAlert(urgent, base ? `${base}/hallinta/dashboard` : undefined);
  if (!message) return 0;
  const ok = await sendDiscordEmbed({ ...message, color: 0xef4444 });
  return ok ? urgent.length : 0;
}

export async function getLastMailCycle(): Promise<MailCycleRecord | null> {
  return getAppState<MailCycleRecord>(LAST_RUN_KEY);
}
