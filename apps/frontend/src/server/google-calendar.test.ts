import { beforeEach, describe, expect, it, vi } from 'vitest';

// Kalenterin korjausnappi (resyncLeadCalendarEvent) ja merkinnän kellonaika. Google Calendar,
// tietokanta ja lokit korvataan mockeilla.
const mocks = vi.hoisted(() => {
  process.env.GCP_SERVICE_ACCOUNT_KEY = '{}';
  process.env.GOOGLE_CALENDAR_ID = 'cal_1';
  const state = { leads: new Map<string, Record<string, any>>() };
  const events = {
    insert: vi.fn(async (_req: any) => ({ data: { id: 'evt_new', htmlLink: null } })),
    patch: vi.fn(async (_req: any) => ({ data: { status: 'tentative' } })),
    get: vi.fn(async (_req: any) => ({ data: { description: '(Alustava merkintä — vahvistuu…)' } })),
    delete: vi.fn(async () => ({})),
    list: vi.fn(async () => ({ data: { items: [] } })),
  };
  const prisma = { lead: { findUnique: vi.fn(async ({ where }: any) => state.leads.get(where.id) ?? null) } };
  const setLeadCalendarEventId = vi.fn(async (id: string, eventId: string | null) => {
    state.leads.get(id)!.calendarEventId = eventId;
  });
  return { state, events, prisma, setLeadCalendarEventId };
});

vi.mock('@googleapis/calendar', () => ({ calendar: () => ({ events: mocks.events }) }));
vi.mock('google-auth-library', () => ({ GoogleAuth: class {} }));
vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/repo/logs', () => ({ createLog: vi.fn(async () => ({})) }));
vi.mock('@/server/repo/leads', () => ({ setLeadCalendarEventId: mocks.setLeadCalendarEventId }));

const { createTentativeLeadEvent, resyncLeadCalendarEvent } = await import('./google-calendar');

const lead = (overrides: Record<string, any> = {}) => ({
  id: 'lead_1',
  status: 'WON',
  requestedDate: new Date('2026-11-04T00:00:00Z'),
  calendarEventId: 'evt_old',
  formData: { external: { source: 'muuttomaailma' }, preferredTime: 'klo 10' },
  fromAddress: 'A',
  toAddress: 'B',
  notes: null,
  contact: { firstName: 'Testi', lastName: 'Asiakas' },
  ...overrides,
});

const patchedStart = () => mocks.events.patch.mock.calls[0][0].requestBody.start.dateTime;

beforeEach(() => {
  mocks.state.leads.clear();
  for (const fn of Object.values(mocks.events)) fn.mockClear();
  mocks.setLeadCalendarEventId.mockClear();
});

describe('resyncLeadCalendarEvent', () => {
  it('siirtää väärään aikaan menneen merkinnän liidin kellonajalle ja vahvistaa sen', async () => {
    mocks.state.leads.set('lead_1', lead());
    const result = await resyncLeadCalendarEvent('lead_1');
    expect(result).toEqual({ ok: true, message: 'Kalenteri päivitetty: ke 4.11. klo 10.00.' });
    expect(patchedStart()).toBe('2026-11-04T08:00:00.000Z'); // klo 10 Suomen aikaa
    expect(mocks.events.patch).toHaveBeenLastCalledWith(expect.objectContaining({ requestBody: expect.objectContaining({ status: 'confirmed' }) }));
    expect(mocks.events.insert).not.toHaveBeenCalled();
  });

  it('luo uuden merkinnän, jos vanha on poistettu kalenterista', async () => {
    mocks.state.leads.set('lead_1', lead());
    mocks.events.patch.mockRejectedValueOnce(Object.assign(new Error('Gone'), { code: 410 }));
    const result = await resyncLeadCalendarEvent('lead_1');
    expect(result).toEqual({ ok: true, message: 'Lisätty kalenteriin: ke 4.11. klo 10.00.' });
    expect(mocks.events.insert.mock.calls[0][0].requestBody.start.dateTime).toBe('2026-11-04T08:00:00.000Z');
    expect(mocks.state.leads.get('lead_1')!.calendarEventId).toBe('evt_new');
  });

  it('luo puuttuvan merkinnän vahvistetulle keikalle', async () => {
    mocks.state.leads.set('lead_1', lead({ calendarEventId: null }));
    expect((await resyncLeadCalendarEvent('lead_1')).ok).toBe(true);
    expect(mocks.events.insert).toHaveBeenCalledTimes(1);
    expect(mocks.state.leads.get('lead_1')!.calendarEventId).toBe('evt_new');
  });

  it('ei vie vahvistamatonta keikkaa kalenteriin', async () => {
    mocks.state.leads.set('lead_1', lead({ calendarEventId: null, status: 'PROPOSAL_SENT' }));
    const result = await resyncLeadCalendarEvent('lead_1');
    expect(result.ok).toBe(false);
    expect(mocks.events.insert).not.toHaveBeenCalled();
  });

  it('vaatii päivän', async () => {
    mocks.state.leads.set('lead_1', lead({ requestedDate: null }));
    expect(await resyncLeadCalendarEvent('lead_1')).toEqual({ ok: false, message: 'Keikalla ei ole päivää. Lisää päivä ensin.' });
    expect(mocks.events.patch).not.toHaveBeenCalled();
  });
});

describe('createTentativeLeadEvent', () => {
  const details = {
    leadId: 'lead_1',
    customerName: 'Testi Asiakas',
    fromAddress: 'A',
    toAddress: 'B',
    requestedDate: new Date('2026-11-04T00:00:00Z'),
    notes: null,
    hallintaUrl: 'https://example.com',
  };

  it('käyttää muualta kirjatun keikan suomalaista kellonaikaa', async () => {
    await createTentativeLeadEvent({ ...details, preferredTime: '10.30' });
    const body = mocks.events.insert.mock.calls[0][0].requestBody;
    expect(body.start.dateTime).toBe('2026-11-04T08:30:00.000Z');
    expect(body.description).toContain('Toivottu kellonaika: 10.30\n');
  });

  it('kertoo kuvauksessa, jos aikaa ei tunnistettu', async () => {
    await createTentativeLeadEvent({ ...details, preferredTime: 'sovitaan myöhemmin' });
    const body = mocks.events.insert.mock.calls[0][0].requestBody;
    expect(body.start.dateTime).toBe('2026-11-04T07:00:00.000Z');
    expect(body.description).toContain('Toivottu kellonaika: sovitaan myöhemmin (ei tunnistettu, merkitty klo 9.00)');
  });
});
