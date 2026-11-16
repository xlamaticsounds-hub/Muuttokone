import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    owner: true,
    leads: [] as any[],
    logs: [] as any[],
    sent: [] as any[],
  };
  const prisma = {
    lead: {
      findMany: vi.fn(async () => state.leads.map((l) => ({ ...l }))),
      findUnique: vi.fn(async ({ where }: any) => {
        const lead = state.leads.find((l) => l.id === where.id);
        return lead ? { ...lead } : null;
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(state.leads.find((l) => l.id === where.id), data)),
    },
  };
  return { state, prisma };
});

vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/server/access', () => ({
  getOwnerSession: vi.fn(async () => (mocks.state.owner ? { user: { email: 'owner@example.com' }, actor: { role: 'OWNER' } } : null)),
}));
vi.mock('@/server/repo/logs', () => ({ createLog: vi.fn(async (entry: any) => mocks.state.logs.push(entry)) }));
vi.mock('@/server/mailer', () => ({
  isSmtpConfigured: () => true,
  sendMail: vi.fn(async (mail: any) => mocks.state.sent.push(mail)),
}));
vi.mock('@/server/google-calendar', () => ({ syncCalendarWithLeadStatus: vi.fn(async () => undefined) }));
vi.mock('@/server/review-requests', () => ({
  getReviewSettings: vi.fn(async () => ({ enabled: false, googleReviewUrl: 'https://g.page/r/abc/review', googleReviewUrlTampere: '' })),
}));

import { completePastJobs, listPastConfirmedJobs } from './bulk-completion-actions';

const DAY = 24 * 60 * 60 * 1000;
const dayAt = (daysFromToday: number) => {
  const today = new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' })}T00:00:00Z`);
  return new Date(today.getTime() + daysFromToday * DAY);
};
const lead = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  status: 'WON',
  requestedDate: dayAt(-2),
  finalPrice: null,
  priceAfterDiscount: 450,
  formData: null,
  fromAddress: 'Katu 1, Helsinki',
  teamId: 'helsinki',
  calendarEventId: null,
  contact: { firstName: 'Asiakas', lastName: id, companyName: null, email: `${id}@example.com` },
  ...over,
});

beforeEach(() => {
  mocks.state.owner = true;
  mocks.state.logs = [];
  mocks.state.sent = [];
  mocks.state.leads = [
    lead('eilen', { requestedDate: dayAt(-1) }),
    lead('vanha', { requestedDate: dayAt(-30) }),
    lead('eihintaa', { priceAfterDiscount: null }),
    lead('tuleva', { requestedDate: dayAt(3) }),
    lead('tehty', { status: 'COMPLETED' }),
    lead('eipostia', { contact: { firstName: 'X', lastName: null, companyName: null, email: null } }),
  ];
});

describe('menneiden keikkojen joukkomerkintä', () => {
  it('vain omistajat', async () => {
    mocks.state.owner = false;
    expect((await listPastConfirmedJobs()).success).toBe(false);
    expect((await completePastJobs([{ leadId: 'eilen', sendReview: true }])).success).toBe(false);
  });

  it('lista: vain menneet vahvistetut, arvostelupyyntöä ehdotetaan viime viikon keikoille', async () => {
    const result = await listPastConfirmedJobs();
    if (!result.success) throw new Error(result.message);
    const byId = Object.fromEntries(result.jobs.map((j) => [j.id, j]));
    expect(Object.keys(byId).sort()).toEqual(['eihintaa', 'eilen', 'eipostia', 'vanha']);
    expect(byId.eilen).toMatchObject({ price: 450, suggestReview: true, hasEmail: true });
    expect(byId.vanha.suggestReview).toBe(false);
    expect(byId.eihintaa.price).toBeNull();
    expect(byId.eipostia).toMatchObject({ hasEmail: false, suggestReview: false });
  });

  it('merkintä: toteutumispäivä = keikan päivä, pyyntö vain rastitetuille, muille ohitusmerkintä', async () => {
    const result = await completePastJobs([
      { leadId: 'eilen', sendReview: true },
      { leadId: 'vanha', sendReview: false },
      { leadId: 'eihintaa', sendReview: true },
      { leadId: 'tuleva', sendReview: true },
      { leadId: 'tehty', sendReview: true },
    ]);
    expect(result).toEqual({ success: true, completed: 2, reviewsSent: 1, reviewsFailed: 0, skipped: 3 });

    const eilen = mocks.state.leads.find((l) => l.id === 'eilen');
    expect(eilen).toMatchObject({ status: 'COMPLETED', finalPrice: 450 });
    expect(eilen.completedAt).toEqual(dayAt(-1));
    expect(mocks.state.leads.find((l) => l.id === 'tuleva').status).toBe('WON');

    expect(mocks.state.sent.map((m) => m.to)).toEqual(['eilen@example.com']);
    const actions = mocks.state.logs.map((l) => `${l.entityId}:${l.action}`);
    expect(actions).toContain('eilen:lead.review_requested');
    expect(actions).toContain('vanha:lead.review_skipped');
    expect(actions).not.toContain('vanha:lead.review_requested');
  });
});
