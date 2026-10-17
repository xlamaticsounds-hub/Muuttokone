import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getAppState, setAppState } from '@/server/app-state';
import { sendDiscordEmbed } from '@/server/discord-webhook';
import { buildMorningBrief, type BriefJob } from '@/lib/morning-brief';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { INACTIVE_JOB_STATUSES } from '@/lib/lead-status';

export const runtime = 'nodejs';

const LAST_SENT_KEY = 'morningBrief.lastSentDay';

// Lead.formData:ssa voi olla asiakkaan toivoma kellonaika (HH:MM), ks. dashboard/page.tsx
function preferredTimeOf(formData: unknown): string | null {
  try {
    const raw = typeof formData === 'string' ? JSON.parse(formData) : formData;
    const payload = (raw as { payload?: Record<string, unknown> } | null)?.payload ?? (raw as Record<string, unknown> | null);
    const time = payload?.preferred_time ?? payload?.preferredTime;
    return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time) ? time : null;
  } catch {
    return null;
  }
}

/**
 * Aamuyhteenveto Discordiin (.github/workflows/morning-brief-cron.yaml, joka aamu): päivän keikat,
 * huomenna tulevat ja avoimet huomiot. Suojattu CRON_SECRET:illä. Lähtee kerran päivässä
 * (?force=1 ohittaa tarkistuksen), ?dry=1 palauttaa viestin lähettämättä sitä.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET ei ole määritetty palvelimelle.' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const force = req.nextUrl.searchParams.get('force') === '1';
  const todayKey = toHelsinkiDateInput(new Date());

  if (!dry && !force && (await getAppState<string>(LAST_SENT_KEY)) === todayKey) {
    return NextResponse.json({ skipped: 'Aamuyhteenveto on jo lähetetty tänään.' }, { status: 202 });
  }

  try {
    // requestedDate tallennetaan UTC-keskiyönä, joten Suomen päivä haetaan UTC-keskiyönä
    const today = new Date(`${todayKey}T00:00:00Z`);
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const dayAfter = new Date(today.getTime() + 2 * 86_400_000);
    const active = { status: { notIn: INACTIVE_JOB_STATUSES } };

    const [leadsToday, jobsTomorrow, overdue, todos, todosTotal] = await Promise.all([
      prisma.lead.findMany({ where: { ...active, requestedDate: { gte: today, lt: tomorrow } }, include: { contact: true } }),
      prisma.lead.count({ where: { ...active, requestedDate: { gte: tomorrow, lt: dayAfter } } }),
      prisma.lead.count({ where: { ...active, requestedDate: { lt: today } } }),
      prisma.aiTodo.findMany({ where: { status: 'OPEN' }, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }], take: 5 }),
      prisma.aiTodo.count({ where: { status: 'OPEN' } }),
    ]);

    const jobsToday: BriefJob[] = leadsToday.map((lead) => ({
      time: preferredTimeOf(lead.formData),
      customer: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas',
      route: [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → '),
      status: lead.status,
    }));

    const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
    const message = buildMorningBrief({
      todayKey,
      jobsToday,
      jobsTomorrow,
      todos: todos.map((t) => ({ priority: t.priority, title: t.title })),
      todosTotal,
      overdue,
      dashboardUrl: base ? `${base}/hallinta/dashboard` : undefined,
    });

    if (dry) return NextResponse.json({ dry: true, message });
    if (!message) return NextResponse.json({ skipped: 'Ei kerrottavaa tälle päivälle.' });
    if (!process.env.DISCORD_WEBHOOK_URL) return NextResponse.json({ error: 'DISCORD_WEBHOOK_URL ei ole määritetty.' }, { status: 503 });

    const sent = await sendDiscordEmbed({ ...message, color: 0xf59e0b });
    if (!sent) return NextResponse.json({ error: 'Discord ei hyväksynyt viestiä.' }, { status: 502 });
    await setAppState(LAST_SENT_KEY, todayKey);
    return NextResponse.json({ sent: true, jobsToday: jobsToday.length, todos: todosTotal });
  } catch (error) {
    console.error('[cron/morning-brief] Ajo epäonnistui', error);
    return NextResponse.json({ error: 'Ajo epäonnistui.' }, { status: 500 });
  }
}
