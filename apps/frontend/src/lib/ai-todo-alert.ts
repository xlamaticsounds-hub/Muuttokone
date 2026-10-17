// Discord-ilmoituksen teksti kiireellisistä huomioista. Erillään lähetyksestä, jotta se on testattava.

export type AlertTodo = { title: string; reason: string };

const MAX_LINES = 8;
const trim = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Yksi viesti per ajo (ei yhtä per huomio), ettei ensimmäinen ajo spämmää kanavaa. */
export function formatUrgentAlert(todos: AlertTodo[], dashboardUrl?: string): { title: string; description: string } | null {
  if (todos.length === 0) return null;
  const lines = todos.slice(0, MAX_LINES).map((t) => `• **${trim(t.title, 110)}**\n  ${trim(t.reason, 140)}`);
  if (todos.length > MAX_LINES) lines.push(`…ja ${todos.length - MAX_LINES} muuta`);
  if (dashboardUrl) lines.push(`\n[Avaa hallintapaneeli](${dashboardUrl})`);
  return {
    title: todos.length === 1 ? '🔔 Uusi kiireellinen huomio' : `🔔 ${todos.length} uutta kiireellistä huomiota`,
    description: lines.join('\n'),
  };
}
