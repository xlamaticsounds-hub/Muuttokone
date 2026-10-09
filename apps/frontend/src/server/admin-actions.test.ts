import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hallinnan server actionit: toteutuneeksi merkitseminen, tilanvaihdon suojaukset ja
// alennuskoodien tallennus. Kirjautuminen, tietokanta ja kalenteri korvataan mockeilla.
const mocks = vi.hoisted(() => {
  const state = {
    session: { user: { email: 'admin@example.com' } } as { user: { email: string } } | null,
    leads: new Map<string, Record<string, any>>(),
    codes: new Map<string, Record<string, any>>(),
    logs: [] as Record<string, any>[],
    reports: [] as Record<string, any>[],
  };
  const prisma = {
    lead: {
      findUnique: vi.fn(async ({ where }: any) => state.leads.get(where.id) ?? null),
      update: vi.fn(async ({ where, data }: any) => {
        const updated = { ...state.leads.get(where.id), ...data };
        state.leads.set(where.id, updated);
        return updated;
      }),
    },
    discountCode: {
      findUnique: vi.fn(async ({ where }: any) => [...state.codes.values()].find((c) => c.code === where.code) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `dc_${state.codes.size + 1}`, ...data };
        state.codes.set(row.id, row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const row = { ...state.codes.get(where.id), ...data };
        state.codes.set(where.id, row);
        return row;
      }),
    },
    log: { create: vi.fn(async ({ data }: any) => (state.logs.push(data), data)) },
    partnerReport: {
      findMany: vi.fn(async ({ where }: any) => state.reports.filter((r) => !where?.status || r.status === where.status)),
    },
  };
  const syncCalendarWithLeadStatus = vi.fn(async () => {});
  const recreateConfirmedLeadEvent = vi.fn(async () => {});
  return { state, prisma, syncCalendarWithLeadStatus, recreateConfirmedLeadEvent };
});

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => mocks.state.session) }));
vi.mock('@/server/auth', () => ({ authOptions: {} }));
vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/google-calendar', () => ({
  syncCalendarWithLeadStatus: mocks.syncCalendarWithLeadStatus,
  recreateConfirmedLeadEvent: mocks.recreateConfirmedLeadEvent,
}));

const { markLeadCompleted } = await import('./lead-completion-actions');
const { updateLeadStatus } = await import('./actions');
const { saveDiscountCode, setDiscountCodeActive } = await import('./discount-code-actions');

const codeForm = {
  code: 'km-mankkaa',
  partner: 'Kiinteistömaailma',
  office: 'Mankkaa',
  agentName: '',
  discountPercent: '10',
  commissionPercent: '5',
  active: true,
  validFrom: '',
  validUntil: '',
};

beforeEach(() => {
  mocks.state.session = { user: { email: 'admin@example.com' } };
  mocks.state.leads.clear();
  mocks.state.codes.clear();
  mocks.state.logs = [];
  mocks.state.reports = [];
  mocks.syncCalendarWithLeadStatus.mockClear();
  mocks.recreateConfirmedLeadEvent.mockClear();
  mocks.state.leads.set('lead_1', {
    id: 'lead_1',
    status: 'WON',
    completedAt: null,
    finalPrice: null,
    calendarEventId: 'evt_1',
  });
});

describe('markLeadCompleted', () => {
  it('asettaa tilan, toteutumishetken ja lopullisen hinnan', async () => {
    const before = Date.now();
    expect(await markLeadCompleted('lead_1', '648,50')).toEqual({ success: true });
    const lead = mocks.state.leads.get('lead_1')!;
    expect(lead.status).toBe('COMPLETED');
    expect(lead.finalPrice).toBe(648.5);
    expect(lead.completedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(mocks.state.logs.at(-1)).toMatchObject({ action: 'lead.completed', actorId: 'admin@example.com' });
    expect(mocks.syncCalendarWithLeadStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'lead_1' }), 'COMPLETED');
  });

  it('hinnan korjaus säilyttää alkuperäisen toteutumishetken', async () => {
    const original = new Date('2026-10-05T10:00:00Z');
    mocks.state.leads.set('lead_1', { id: 'lead_1', status: 'COMPLETED', completedAt: original, finalPrice: 600, calendarEventId: null });
    expect(await markLeadCompleted('lead_1', 650)).toEqual({ success: true });
    const lead = mocks.state.leads.get('lead_1')!;
    expect(lead.completedAt).toEqual(original);
    expect(lead.finalPrice).toBe(650);
    expect(mocks.state.logs.at(-1)).toMatchObject({ action: 'lead.final_price_updated' });
    expect(mocks.syncCalendarWithLeadStatus).not.toHaveBeenCalled();
  });

  it.each(['', '0', 'abc', '-100', '200000'])('hylkää virheellisen hinnan %j', async (input) => {
    const result = await markLeadCompleted('lead_1', input);
    expect(result.success).toBe(false);
    expect(mocks.state.leads.get('lead_1')!.status).toBe('WON');
  });

  it('vaatii kirjautumisen', async () => {
    mocks.state.session = null;
    expect(await markLeadCompleted('lead_1', '648')).toEqual({ success: false, message: 'Kirjaudu sisään.' });
    expect(mocks.state.leads.get('lead_1')!.status).toBe('WON');
  });
});

describe('updateLeadStatus', () => {
  it('ei salli tilaa COMPLETED ilman lopullista hintaa', async () => {
    await expect(updateLeadStatus('lead_1', 'COMPLETED')).rejects.toThrow('Merkitse toteutuneeksi');
    expect(mocks.state.leads.get('lead_1')!.status).toBe('WON');
  });

  it('peruttu: tila vaihtuu, kalenteri synkronoidaan ja muutos kirjataan', async () => {
    await updateLeadStatus('lead_1', 'CANCELLED');
    expect(mocks.state.leads.get('lead_1')!.status).toBe('CANCELLED');
    expect(mocks.syncCalendarWithLeadStatus).toHaveBeenCalledWith(expect.anything(), 'CANCELLED');
    expect(mocks.state.logs.at(-1)).toMatchObject({ action: 'lead.status_changed', data: { from: 'WON', to: 'CANCELLED' } });
  });

  it('toteutuneen kumoaminen: tila vaihtuu, toteutumishetki ja hinta säilyvät historiana', async () => {
    const completedAt = new Date('2026-10-05T10:00:00Z');
    mocks.state.leads.set('lead_1', { id: 'lead_1', status: 'COMPLETED', completedAt, finalPrice: 650, calendarEventId: 'evt_1' });
    await updateLeadStatus('lead_1', 'WON');
    const lead = mocks.state.leads.get('lead_1')!;
    expect(lead.status).toBe('WON'); // raportti ottaa vain tilan COMPLETED -> ei enää raportissa
    expect(lead.completedAt).toEqual(completedAt);
    expect(lead.finalPrice).toBe(650);
  });

  it('peruttu -> vahvistettu luo poistetun kalenterimerkinnän uudelleen', async () => {
    mocks.state.leads.set('lead_1', {
      id: 'lead_1',
      status: 'CANCELLED',
      completedAt: null,
      finalPrice: null,
      calendarEventId: null,
      requestedDate: new Date('2026-11-07T00:00:00Z'),
    });
    await updateLeadStatus('lead_1', 'WON');
    expect(mocks.recreateConfirmedLeadEvent).toHaveBeenCalledWith('lead_1');
  });

  it('vahvistettu jolla on jo kalenterimerkintä: ei uutta merkintää', async () => {
    mocks.state.leads.set('lead_1', { id: 'lead_1', status: 'CONTACTED', calendarEventId: 'evt_1', requestedDate: new Date() });
    await updateLeadStatus('lead_1', 'WON');
    expect(mocks.recreateConfirmedLeadEvent).not.toHaveBeenCalled();
  });
});

describe('ei tuplapalkkiota: kumottu ja uudelleen toteutuneeksi merkitty', () => {
  const originalCompletion = new Date('2026-09-28T10:00:00Z');

  beforeEach(() => {
    // Toteutui syyskuussa, kumottiin myöhemmin (completedAt säilyi historiana)
    mocks.state.leads.set('lead_1', { id: 'lead_1', status: 'WON', completedAt: originalCompletion, finalPrice: 650, calendarEventId: null });
  });

  it('jo lähetetyssä raportissa -> alkuperäinen kuukausi säilyy (ei uudelleen lokakuun raporttiin)', async () => {
    mocks.state.reports = [
      {
        status: 'SENT',
        data: { partner: 'Kiinteistömaailma', periodLabel: 'syyskuu 2026', groups: [{ rows: [{ leadId: 'lead_1' }] }] },
      },
    ];
    expect(await markLeadCompleted('lead_1', '650')).toEqual({ success: true });
    expect(mocks.state.leads.get('lead_1')!.completedAt).toEqual(originalCompletion);
    expect(mocks.state.logs.at(-1)!.data).toMatchObject({ alreadyReported: true });
  });

  it('laskutusmerkintä liidillä riittää, vaikka lähetetty raportti olisi luotu uudelleen', async () => {
    mocks.state.leads.set('lead_1', {
      id: 'lead_1',
      status: 'WON',
      completedAt: originalCompletion,
      finalPrice: 650,
      calendarEventId: null,
      partnerReportedAt: new Date('2026-10-01T08:00:00Z'),
    });
    mocks.state.reports = [
      { status: 'DRAFT', data: { partner: 'Kiinteistömaailma', periodLabel: 'syyskuu 2026', groups: [] } },
    ];
    await markLeadCompleted('lead_1', '650');
    expect(mocks.state.leads.get('lead_1')!.completedAt).toEqual(originalCompletion);
  });

  it('ei lähetetyssä raportissa (esim. vahingossa merkitty) -> uusi toteutumispäivä', async () => {
    mocks.state.reports = [
      { status: 'SENT', data: { partner: 'Kiinteistömaailma', periodLabel: 'syyskuu 2026', groups: [{ rows: [{ leadId: 'muu' }] }] } },
      { status: 'DRAFT', data: { partner: 'Kiinteistömaailma', periodLabel: 'syyskuu 2026', groups: [{ rows: [{ leadId: 'lead_1' }] }] } },
    ];
    const before = Date.now();
    await markLeadCompleted('lead_1', '650');
    expect(mocks.state.leads.get('lead_1')!.completedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('saveDiscountCode / setDiscountCodeActive', () => {
  it('lisää uuden koodin normalisoituna', async () => {
    const result = await saveDiscountCode(null, codeForm);
    expect(result.success).toBe(true);
    const saved = [...mocks.state.codes.values()][0];
    expect(saved).toMatchObject({ code: 'KM-MANKKAA', office: 'Mankkaa', agentName: null, discountPercent: 10 });
    expect(mocks.state.logs.at(-1)).toMatchObject({ action: 'discount_code.created', entityType: 'DiscountCode' });
  });

  it('ei salli samaa koodia kahdesti (kirjainkoosta riippumatta)', async () => {
    await saveDiscountCode(null, codeForm);
    const result = await saveDiscountCode(null, { ...codeForm, code: 'KM-Mankkaa' });
    expect(result).toEqual({ success: false, message: 'Koodi KM-MANKKAA on jo olemassa.' });
    expect(mocks.state.codes.size).toBe(1);
  });

  it('muokkaus samalla koodilla onnistuu', async () => {
    const created = await saveDiscountCode(null, codeForm);
    const id = created.success ? created.id : '';
    const result = await saveDiscountCode(id, { ...codeForm, commissionPercent: '6' });
    expect(result.success).toBe(true);
    expect(mocks.state.codes.get(id)!.commissionPercent).toBe(6);
  });

  it('palauttaa lomakevirheen tallentamatta', async () => {
    const result = await saveDiscountCode(null, { ...codeForm, discountPercent: '0' });
    expect(result.success).toBe(false);
    expect(mocks.state.codes.size).toBe(0);
  });

  it('poistaa käytöstä ja ottaa takaisin käyttöön', async () => {
    const created = await saveDiscountCode(null, codeForm);
    const id = created.success ? created.id : '';
    await setDiscountCodeActive(id, false);
    expect(mocks.state.codes.get(id)!.active).toBe(false);
    await setDiscountCodeActive(id, true);
    expect(mocks.state.codes.get(id)!.active).toBe(true);
  });

  it('vaatii kirjautumisen', async () => {
    mocks.state.session = null;
    expect(await saveDiscountCode(null, codeForm)).toEqual({ success: false, message: 'Kirjaudu sisään.' });
    expect(mocks.state.codes.size).toBe(0);
  });
});
