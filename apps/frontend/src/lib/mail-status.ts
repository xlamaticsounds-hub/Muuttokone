import { toHelsinkiDateInput } from '@/lib/helsinki-time';

// Etusivun "AI luki postit" -rivin tekstit. Ajastus pyörii 15 min välein; jos edellisestä lukukerrasta
// on yli 45 min, jokin on pielessä (ajastus, tunnukset tai palvelin) ja siitä pitää huomauttaa.
export const MAIL_STALE_AFTER_MINUTES = 45;

const timeFormat = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', day: 'numeric', month: 'numeric' });

export function describeLastRun(atIso: string | null, now: Date): { label: string; stale: boolean } {
  if (!atIso) return { label: 'ei vielä luettu', stale: true };
  const at = new Date(atIso);
  if (Number.isNaN(at.getTime())) return { label: 'ei vielä luettu', stale: true };

  const time = timeFormat.format(at).replace(':', '.');
  const today = toHelsinkiDateInput(now);
  const yesterday = toHelsinkiDateInput(new Date(now.getTime() - 86_400_000));
  const day = toHelsinkiDateInput(at);
  const when = day === today ? `tänään ${time}` : day === yesterday ? `eilen ${time}` : `${dayFormat.format(at)} ${time}`;
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  return { label: when, stale: minutes > MAIL_STALE_AFTER_MINUTES };
}
