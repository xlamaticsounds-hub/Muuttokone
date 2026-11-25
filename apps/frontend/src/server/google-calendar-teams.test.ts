import { beforeEach, describe, expect, it, vi } from 'vitest';

// Tiimien omat kalenterit: Tampereen keikat Tampereen kalenteriin (GOOGLE_CALENDAR_ID_TAMPERE) ja vanhojen
// merkintöjen siirto yhteisestä kalenterista. Google Calendar korvataan muistissa olevilla kalentereilla.
const mocks = vi.hoisted(() => {
  process.env.GCP_SERVICE_ACCOUNT_KEY = '{}';
  process.env.GOOGLE_CALENDAR_ID = 'cal_shared';
  process.env.GOOGLE_CALENDAR_ID_TAMPERE = 'cal_tampere';

  type Event = Record<string, any>;
  const calendars = new Map<string, Map<string, Event>>();
  const cal = (id: string) => {
    if (!calendars.has(id)) calendars.set(id, new Map());
    return calendars.get(id)!;
  };
  const notFound = () => Object.assign(new Error('Not Found'), { code: 404 });
  let nextId = 1;
  const events = {
    insert: vi.fn(async ({ calendarId, requestBody }: any) => {
      const id = `evt_${nextId++}`;
      cal(calendarId).set(id, { ...requestBody, id });
      return { data: { id, htmlLink: null } };
    }),
    get: vi.fn(async ({ calendarId, eventId }: any) => {
      const event = cal(calendarId).get(eventId);
      if (!event) throw notFound();
      return { data: event };
    }),
    patch: vi.fn(async ({ calendarId, eventId, requestBody }: any) => {
      const event = cal(calendarId).get(eventId);
      if (!event) throw notFound();
      Object.assign(event, requestBody);
      return { data: event };
    }),
    delete: vi.fn(async ({ calendarId, eventId }: any) => {
      if (!cal(calendarId).delete(eventId)) throw notFound();
      return {};
    }),
    move: vi.fn(async ({ calendarId, eventId, destination }: any) => {
      const event = cal(calendarId).get(eventId);
      if (!event) throw notFound();
      cal(calendarId).delete(eventId);
      cal(destination).set(eventId, event);
      return { data: event };
    }),
    list: vi.fn(async ({ calendarId }: any) => ({ data: { items: Array.from(cal(calendarId).values()) } })),
  };

  const leads = new Map<string, Record<string, any>>();
  const prisma = {
    lead: {
      findUnique: vi.fn(async ({ where }: any) => leads.get(where.id) ?? null),
      findMany: vi.fn(async ({ where }: any) =>
        Array.from(leads.values()).filter(
          (lead) =>
            where.teamId.in.includes(lead.teamId) &&
            (lead.calendarEventId || lead.boxRental?.deliveryEventId || lead.boxRental?.pickupEventId),
        ),
      ),
    },
  };
  return { calendars, cal, events, leads, prisma };
});

vi.mock('@googleapis/calendar', () => ({ calendar: () => ({ events: mocks.events }) }));
vi.mock('google-auth-library', () => ({ GoogleAuth: class {} }));
vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/repo/logs', () => ({ createLog: vi.fn(async () => ({})) }));
vi.mock('@/server/repo/leads', () => ({ setLeadCalendarEventId: vi.fn(async () => {}) }));

const {
  calendarIdForTeam,
  cancelCalendarEvent,
  confirmCalendarEvent,
  createTentativeLeadEvent,
  findOverlappingEvents,
  moveTeamEventsToTeamCalendars,
  teamsWithOwnCalendar,
  upsertAllDayEvent,
} = await import('./google-calendar');

const details = (leadId: string) => ({
  leadId,
  customerName: 'Testi Asiakas',
  fromAddress: 'Hämeenkatu 1, Tampere',
  toAddress: 'Hervanta, Tampere',
  requestedDate: new Date('2026-12-01T00:00:00Z'),
  notes: null,
  hallintaUrl: 'https://example.com',
});

const inCalendar = (calendarId: string) => Array.from(mocks.cal(calendarId).keys()).sort();

beforeEach(() => {
  mocks.calendars.clear();
  mocks.leads.clear();
  for (const fn of Object.values(mocks.events)) fn.mockClear();
  mocks.prisma.lead.findUnique.mockClear();
  mocks.prisma.lead.findMany.mockClear();
  process.env.GOOGLE_CALENDAR_ID_TAMPERE = 'cal_tampere';
  mocks.leads.set('tre', { id: 'tre', teamId: 'tampere', calendarEventId: null, boxRental: null });
  mocks.leads.set('hki', { id: 'hki', teamId: 'helsinki', calendarEventId: null, boxRental: null });
  mocks.leads.set('none', { id: 'none', teamId: null, calendarEventId: null, boxRental: null });
});

describe('tiimien kalenterit', () => {
  it('Tampereella oma kalenteri, muut yhteisessä', () => {
    expect(calendarIdForTeam('tampere')).toBe('cal_tampere');
    expect(calendarIdForTeam('helsinki')).toBe('cal_shared');
    expect(calendarIdForTeam(null)).toBe('cal_shared');
    expect(teamsWithOwnCalendar()).toEqual(['tampere']);
  });

  it('uusi Tampereen keikka menee Tampereen kalenteriin, Helsingin ja jakamaton yhteiseen', async () => {
    const tre = await createTentativeLeadEvent(details('tre'));
    const hki = await createTentativeLeadEvent(details('hki'));
    const none = await createTentativeLeadEvent(details('none'));
    expect(inCalendar('cal_tampere')).toEqual([tre!.eventId]);
    expect(inCalendar('cal_shared')).toEqual([hki!.eventId, none!.eventId].sort());
  });

  it('päällekkäisyydet katsotaan oman tiimin kalenterista', async () => {
    await createTentativeLeadEvent(details('hki'));
    expect(await findOverlappingEvents('tre', new Date('2026-12-01T00:00:00Z'))).toEqual([]);
    expect(await findOverlappingEvents('none', new Date('2026-12-01T00:00:00Z'))).toHaveLength(1);
  });

  it('vahvistus siirtää yhteisessä kalenterissa olevan Tampereen keikan Tampereen kalenteriin', async () => {
    mocks.cal('cal_shared').set('old', { id: 'old', status: 'tentative', description: '(Alustava merkintä — x)' });
    mocks.leads.get('tre')!.calendarEventId = 'old';
    await confirmCalendarEvent('tre', 'old');
    expect(inCalendar('cal_shared')).toEqual([]);
    expect(mocks.cal('cal_tampere').get('old')).toMatchObject({ status: 'confirmed' });
  });

  it('peruminen poistaa merkinnän, vaikka se olisi vielä vanhassa kalenterissa', async () => {
    mocks.cal('cal_shared').set('old', { id: 'old', status: 'tentative' });
    await cancelCalendarEvent('tre', 'old');
    expect(inCalendar('cal_shared')).toEqual([]);
    expect(inCalendar('cal_tampere')).toEqual([]);
  });

  it('laatikkovuokran koko päivän merkintä Tampereen kalenteriin', async () => {
    const id = await upsertAllDayEvent('tre', null, { summary: 'Nouto', description: '', dateKey: '2026-12-10', confirmed: true });
    expect(inCalendar('cal_tampere')).toEqual([id]);
  });

  it('kertasiirto: Tampereen keikat ja laatikkomerkinnät siirtyvät, Helsingin eivät; toinen ajo ei tee mitään', async () => {
    const shared = mocks.cal('cal_shared');
    for (const id of ['tre_job', 'tre_delivery', 'tre_pickup', 'hki_job']) shared.set(id, { id, status: 'confirmed' });
    mocks.leads.get('tre')!.calendarEventId = 'tre_job';
    mocks.leads.get('tre')!.boxRental = { deliveryEventId: 'tre_delivery', pickupEventId: 'tre_pickup' };
    mocks.leads.get('hki')!.calendarEventId = 'hki_job';

    expect(await moveTeamEventsToTeamCalendars()).toEqual({ leads: 1, moved: 3, failed: 0 });
    expect(inCalendar('cal_tampere')).toEqual(['tre_delivery', 'tre_job', 'tre_pickup']);
    expect(inCalendar('cal_shared')).toEqual(['hki_job']);

    expect(await moveTeamEventsToTeamCalendars()).toEqual({ leads: 1, moved: 0, failed: 0 });
  });

  it('ilman Tampereen kalenteria kaikki kuten ennen: yhteinen kalenteri, ei ylimääräisiä hakuja', async () => {
    delete process.env.GOOGLE_CALENDAR_ID_TAMPERE;
    const created = await createTentativeLeadEvent(details('tre'));
    await confirmCalendarEvent('tre', created!.eventId);
    expect(inCalendar('cal_shared')).toEqual([created!.eventId]);
    expect(mocks.events.move).not.toHaveBeenCalled();
    expect(mocks.prisma.lead.findUnique).not.toHaveBeenCalled();
    expect(await moveTeamEventsToTeamCalendars()).toEqual({ leads: 0, moved: 0, failed: 0 });
  });
});
