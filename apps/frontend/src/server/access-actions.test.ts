import { beforeEach, describe, expect, it, vi } from 'vitest';

// Roolien rajat server actioneissa: partionjohtaja ja aluevastaava eivät pääse käsiksi siihen, mitä
// heidän ei kuulu nähdä, vaikka kutsuisivat toimintoa suoraan (valikon piilotus ei riitä).
// Kirjautuminen ja tietokanta korvataan muistissa olevilla tauluilla.
const mocks = vi.hoisted(() => {
  type Row = Record<string, any>;
  const state = {
    sessionEmail: 'owner@example.com' as string | null,
    users: [] as Row[],
    leads: [] as Row[],
    entries: [] as Row[],
    workers: [] as Row[],
    rentals: [] as Row[],
    logs: [] as Row[],
  };
  const byId = (rows: Row[], id: string) => rows.find((r) => r.id === id) ?? null;
  const matches = (row: Row, where: Row = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && 'in' in value) return (value.in as unknown[]).includes(row[key]);
      if (value && typeof value === 'object' && 'notIn' in value) return !(value.notIn as unknown[]).includes(row[key]);
      return row[key] === value;
    });
  const logMatches = (row: Row, where: Row = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('in' in value) return (value.in as unknown[]).includes(row[key]);
        if ('gt' in value) return row[key] > value.gt;
        if ('gte' in value) return row[key] >= value.gte;
      }
      return row[key] === value;
    });
  let seq = 0;
  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: any) => state.users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null),
      findFirst: vi.fn(async ({ where }: any) => state.users.find((u) => matches(u, where)) ?? null),
      count: vi.fn(async ({ where }: any) => state.users.filter((u) => matches(u, where)).length),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `user_${++seq}`, ...data };
        state.users.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(byId(state.users, where.id)!, data)),
      updateMany: vi.fn(async () => ({ count: 1 })),
      delete: vi.fn(async ({ where }: any) => {
        state.users = state.users.filter((u) => u.id !== where.id);
        return {};
      }),
    },
    lead: {
      findUnique: vi.fn(async ({ where }: any) => byId(state.leads, where.id)),
      findMany: vi.fn(async ({ where }: any) => state.leads.filter((l) => matches(l, where))),
      update: vi.fn(async ({ where, data }: any) => Object.assign(byId(state.leads, where.id)!, data)),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const rows = state.leads.filter((l) => matches(l, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      }),
    },
    timeEntry: {
      findUnique: vi.fn(async ({ where }: any) => byId(state.entries, where.id)),
      findFirst: vi.fn(async ({ where }: any) => state.entries.find((e) => matches(e, where)) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `entry_${++seq}`, ...data };
        state.entries.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(byId(state.entries, where.id)!, data)),
      delete: vi.fn(async ({ where }: any) => {
        state.entries = state.entries.filter((e) => e.id !== where.id);
        return {};
      }),
    },
    worker: {
      findMany: vi.fn(async ({ where }: any) => state.workers.filter((w) => matches(w, where))),
      findFirst: vi.fn(async ({ where }: any) => state.workers.find((w) => matches(w, where)) ?? null),
      findUnique: vi.fn(async ({ where }: any) => byId(state.workers, where.id)),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: `worker_${++seq}`, ...data };
        state.workers.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(byId(state.workers, where.id)!, data)),
    },
    boxRental: {
      findUnique: vi.fn(async ({ where }: any) => byId(state.rentals, where.id)),
      update: vi.fn(async ({ where, data }: any) => Object.assign(byId(state.rentals, where.id)!, data)),
    },
    log: {
      create: vi.fn(async ({ data }: any) => {
        const row = { createdAt: new Date(), ...data };
        state.logs.push(row);
        return row;
      }),
      count: vi.fn(async ({ where }: any) => state.logs.filter((l) => logMatches(l, where)).length),
      findFirst: vi.fn(
        async ({ where }: any) => state.logs.filter((l) => logMatches(l, where)).sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
      ),
    },
  };
  return { state, prisma };
});

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => (mocks.state.sessionEmail ? { user: { email: mocks.state.sessionEmail } } : null)),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/server/auth', () => ({ authOptions: {} }));
vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/google-calendar', () => ({
  syncCalendarWithLeadStatus: vi.fn(async () => {}),
  recreateConfirmedLeadEvent: vi.fn(async () => {}),
  updateCalendarEventTime: vi.fn(async () => {}),
  moveLeadEventsToTeamCalendar: vi.fn(async () => ({ moved: 0, failed: 0 })),
}));
vi.mock('@/server/box-rentals', () => ({
  boxRentalWarning: vi.fn(async () => null),
  getBoxStockTotal: vi.fn(async () => 100),
  isRentalOrderLead: vi.fn(() => false),
  loadInventoryRentals: vi.fn(async () => []),
  syncBoxRentalCalendar: vi.fn(async () => {}),
}));
vi.mock('@/server/app-state', () => ({ setAppState: vi.fn(async () => {}), getAppState: vi.fn(async () => null) }));

const { updateLeadStatus } = await import('./actions');
const { saveDiscountCode } = await import('./discount-code-actions');
const { setLeadTeam, autoAssignUnassignedLeads } = await import('./team-actions');
const { startTimeEntry, stopTimeEntry, saveTimeEntry, deleteTimeEntry } = await import('./time-actions');
const { setBoxRentalStatus, adjustBoxStock } = await import('./box-rental-actions');
const { createUser, setUserActive, deleteUser, changeOwnPassword, addWorker, resetUserPassword } = await import('./user-actions');
const { resolveActor, recordLogin, tooManyFailedLogins } = await import('./actors');
const { verifyPassword } = await import('./password');

const user = (id: string, email: string, role: string, teamId: string | null, extra: Record<string, unknown> = {}) => ({
  id,
  email,
  name: id,
  role,
  teamId,
  active: true,
  mustChangePassword: false,
  passwordHash: null,
  ...extra,
});

const as = (email: string | null) => {
  mocks.state.sessionEmail = email;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

beforeEach(() => {
  mocks.state.users = [
    user('owner', 'owner@example.com', 'OWNER', null),
    user('elias', 'elias@example.com', 'TEAM_ADMIN', 'tampere'),
    user('crew', 'crew@example.com', 'CREW_LEAD', 'tampere'),
    user('gone', 'gone@example.com', 'CREW_LEAD', 'tampere', { active: false }),
  ];
  mocks.state.leads = [
    { id: 'lead_tre', teamId: 'tampere', status: 'WON', formData: null, calendarEventId: null, requestedDate: null },
    { id: 'lead_hki', teamId: 'helsinki', status: 'WON', formData: null, calendarEventId: null, requestedDate: null },
  ];
  mocks.state.entries = [
    { id: 'e_tre', teamId: 'tampere', leadId: 'lead_tre', startedAt: new Date(Date.now() - 2 * 3_600_000), endedAt: null, breakMinutes: 0, crewSize: 2, workerIds: [] },
    { id: 'e_tre_old', teamId: 'tampere', leadId: 'lead_tre', startedAt: daysAgo(10), endedAt: daysAgo(10), breakMinutes: 0, crewSize: 2, workerIds: [] },
    { id: 'e_hki', teamId: 'helsinki', leadId: 'lead_hki', startedAt: new Date(Date.now() - 2 * 3_600_000), endedAt: null, breakMinutes: 0, crewSize: 3, workerIds: [] },
  ];
  mocks.state.workers = [
    { id: 'w_tre', teamId: 'tampere', name: 'Ville', active: true },
    { id: 'w_hki', teamId: 'helsinki', name: 'Ossi', active: true },
  ];
  mocks.state.rentals = [
    { id: 'r_tre', leadId: 'lead_tre', status: 'RESERVED', quantity: 30, lostQty: 0 },
    { id: 'r_hki', leadId: 'lead_hki', status: 'RESERVED', quantity: 30, lostQty: 0 },
  ];
  mocks.state.logs = [];
  as('owner@example.com');
});

describe('kirjautuneen rooli', () => {
  it('käytöstä poistettu ja tuntematon eivät pääse sisään', async () => {
    expect(await resolveActor('gone@example.com')).toBeNull();
    expect(await resolveActor('stranger@example.com')).toBeNull();
    expect((await resolveActor('ELIAS@example.com '))?.role).toBe('TEAM_ADMIN');
  });

  it('palvelimen asetusten omistaja pääsee ilman käyttäjäriviä, mutta käyttäjärivi ratkaisee', async () => {
    expect((await resolveActor('domenic.eklund@gmail.com'))?.role).toBe('OWNER');
    mocks.state.users.push(user('d', 'domenic.eklund@gmail.com', 'OWNER', null, { active: false }));
    expect(await resolveActor('domenic.eklund@gmail.com')).toBeNull();
  });
});

describe('partionjohtaja', () => {
  beforeEach(() => as('crew@example.com'));

  it('ei pääse hallinnan toimintoihin', async () => {
    await expect(updateLeadStatus('lead_tre', 'LOST')).rejects.toThrow('Unauthorized');
    expect((await saveDiscountCode(null, {} as never)).success).toBe(false);
    expect((await setLeadTeam('lead_tre', null)).success).toBe(false);
    expect((await createUser({ email: 'x@example.com', name: 'X', role: 'OWNER' })).success).toBe(false);
    expect((await addWorker('tampere', 'Uusi')).success).toBe(false);
    expect((await adjustBoxStock(10)).success).toBe(false);
  });

  it('leimaa oman tiimin keikkaa, ei toisen tiimin', async () => {
    expect((await stopTimeEntry('e_tre')).success).toBe(true);
    expect(await stopTimeEntry('e_hki')).toEqual({ success: false, message: 'Leimaa ei löytynyt.' });
    expect((await startTimeEntry({ leadId: 'lead_hki' })).success).toBe(false);
  });

  it('valitsee vain oman tiimin työntekijöitä, henkilömäärä tulee valinnasta', async () => {
    expect((await startTimeEntry({ leadId: 'lead_tre', workerIds: ['w_hki'] })).success).toBe(false);
    mocks.state.entries = mocks.state.entries.filter((e) => e.id !== 'e_tre'); // ei käynnissä olevaa
    expect((await startTimeEntry({ leadId: 'lead_tre', workerIds: ['w_tre'], crewSize: 5 })).success).toBe(true);
    const created = mocks.state.entries.at(-1)!;
    expect(created).toMatchObject({ teamId: 'tampere', workerIds: ['w_tre'], crewSize: 1, createdBy: 'crew@example.com' });
  });

  it('ei korjaa eikä poista yli viikon vanhaa leimaa', async () => {
    expect((await deleteTimeEntry('e_tre_old')).success).toBe(false);
    const old = mocks.state.entries.find((e) => e.id === 'e_tre_old')!;
    const result = await saveTimeEntry({ id: old.id, startedAt: '2026-11-12T08:00', endedAt: '2026-11-12T10:00' });
    expect(result.success).toBe(false);
  });

  it('kuittaa oman tiimin laatikot, ei peru eikä koske toiseen tiimiin', async () => {
    expect((await setBoxRentalStatus({ id: 'r_tre', status: 'CANCELLED' })).success).toBe(false);
    expect((await setBoxRentalStatus({ id: 'r_hki', status: 'DELIVERED' })).success).toBe(false);
    expect((await setBoxRentalStatus({ id: 'r_tre', status: 'DELIVERED' })).success).toBe(true);
    expect(mocks.state.rentals.find((r) => r.id === 'r_tre')!.status).toBe('DELIVERED');
  });
});

describe('aluevastaava', () => {
  beforeEach(() => as('elias@example.com'));

  it('käsittelee vain oman tiimin liidejä', async () => {
    await expect(updateLeadStatus('lead_hki', 'LOST')).rejects.toThrow('Unauthorized');
    await expect(updateLeadStatus('lead_tre', 'LOST')).resolves.toEqual({ success: true });
  });

  it('voi palauttaa keikan jakamattomaksi, mutta ei siirtää toiselle tiimille', async () => {
    expect((await setLeadTeam('lead_tre', 'helsinki')).success).toBe(false);
    expect((await setLeadTeam('lead_hki', null)).success).toBe(false);
    expect((await setLeadTeam('lead_tre', null)).success).toBe(true);
    expect(mocks.state.leads.find((l) => l.id === 'lead_tre')!.teamId).toBeNull();
  });

  it('ei koko yrityksen toimintoihin eikä käyttäjähallintaan', async () => {
    expect((await saveDiscountCode(null, {} as never)).success).toBe(false);
    expect((await adjustBoxStock(10)).success).toBe(false);
    expect((await createUser({ email: 'x@example.com', name: 'X', role: 'CREW_LEAD', teamId: 'tampere' })).success).toBe(false);
  });

  it('ylläpitää oman tiiminsä työntekijöitä', async () => {
    expect((await addWorker('tampere', 'Matti')).success).toBe(true);
    expect((await addWorker('helsinki', 'Matti')).success).toBe(false);
  });
});

describe('omistajan käyttäjähallinta', () => {
  it('uusi käyttäjä saa väliaikaisen salasanan, joka on tallessa vain tiivisteenä', async () => {
    const result = await createUser({ email: ' Uusi@Example.com ', name: 'Uusi Johtaja', role: 'CREW_LEAD', teamId: 'tampere' });
    expect(result.success).toBe(true);
    const temp = result.success ? result.tempPassword! : '';
    const created = mocks.state.users.find((u) => u.email === 'uusi@example.com')!;
    expect(created).toMatchObject({ role: 'CREW_LEAD', teamId: 'tampere', mustChangePassword: true, createdBy: 'owner@example.com' });
    expect(created.passwordHash).not.toContain(temp);
    expect(await verifyPassword(temp, created.passwordHash)).toBe(true);
    // Partionjohtaja lisätään myös tiiminsä työntekijäksi
    expect(mocks.state.workers.some((w) => w.teamId === 'tampere' && w.name === 'Uusi Johtaja')).toBe(true);
  });

  it('tarkistaa syötteet', async () => {
    expect((await createUser({ email: 'owner@example.com', name: 'Tupla', role: 'OWNER' })).success).toBe(false);
    expect((await createUser({ email: 'ei-osoite', name: 'X', role: 'OWNER' })).success).toBe(false);
    expect((await createUser({ email: 'x@example.com', name: 'X', role: 'CREW_LEAD' })).success).toBe(false); // tiimi puuttuu
    expect((await createUser({ email: 'x@example.com', name: 'X', role: 'ROOT' })).success).toBe(false);
  });

  it('ei poista itseään eikä viimeistä omistajaa, eikä palvelimen asetusten omistajaa', async () => {
    expect((await setUserActive('owner', false)).success).toBe(false);
    expect((await deleteUser('owner')).success).toBe(false);
    mocks.state.users.push(user('paavo', 'paavo.penttinen@proton.me', 'OWNER', null));
    expect((await deleteUser('paavo')).success).toBe(false);
    expect((await setUserActive('paavo', false)).success).toBe(true);
    expect((await deleteUser('crew')).success).toBe(true);
    expect(mocks.state.users.some((u) => u.id === 'crew')).toBe(false);
  });

  it('uusi väliaikainen salasana avaa kirjautumislukon heti', async () => {
    for (let i = 0; i < 10; i++) await recordLogin('Crew@example.com', false);
    expect(await tooManyFailedLogins('crew@example.com')).toBe(true);
    const result = await resetUserPassword('crew');
    expect(result.success).toBe(true);
    expect(await tooManyFailedLogins('crew@example.com')).toBe(false);
    // Uudet väärät yritykset lasketaan taas avauksesta alkaen
    await new Promise((resolve) => setTimeout(resolve, 5));
    for (let i = 0; i < 10; i++) await recordLogin('crew@example.com', false);
    expect(await tooManyFailedLogins('crew@example.com')).toBe(true);
  });
});

describe('keikkojen automaattinen jako', () => {
  it('omistaja jakaa jakamattomat osoitteen mukaan, kaukaiset jäävät avoimiksi', async () => {
    const open = { status: 'NEW', formData: null, calendarEventId: null, requestedDate: null, deletedAt: null, teamId: null };
    mocks.state.leads.push(
      { ...open, id: 'u_pks', fromAddress: 'Kamppi, Helsinki', toAddress: 'Tapiola, Espoo' },
      { ...open, id: 'u_tre', fromAddress: 'Hervanta, Tampere', toAddress: 'Nokia' },
      { ...open, id: 'u_far', fromAddress: 'Aurakatu 1, Turku', toAddress: 'Turku' },
      { ...open, id: 'u_done', status: 'COMPLETED', fromAddress: 'Helsinki', toAddress: 'Vantaa' },
    );
    as('elias@example.com');
    expect((await autoAssignUnassignedLeads()).success).toBe(false);
    as('owner@example.com');
    expect(await autoAssignUnassignedLeads()).toEqual({ success: true, assigned: 2, left: 1 });
    const team = (id: string) => mocks.state.leads.find((l) => l.id === id)!.teamId;
    expect([team('u_pks'), team('u_tre'), team('u_far'), team('u_done')]).toEqual(['helsinki', 'tampere', null, null]);
  });
});

describe('oma salasana', () => {
  it('väliaikaisen vaihto vaatii nykyisen ja poistaa vaihtopakon', async () => {
    as('owner@example.com');
    const created = await createUser({ email: 'leader@example.com', name: 'Leader', role: 'CREW_LEAD', teamId: 'tampere' });
    const temp = created.success ? created.tempPassword! : '';
    as('leader@example.com');
    expect((await changeOwnPassword({ current: 'väärä', next: 'uusi hyvä salasana', confirm: 'uusi hyvä salasana' })).success).toBe(false);
    expect((await changeOwnPassword({ current: temp, next: 'uusi hyvä salasana', confirm: 'eri salasana tässä' })).success).toBe(false);
    // Puhelimen isolla alkukirjaimella kirjoittama väliaikainen kelpaa nykyiseksi
    expect((await changeOwnPassword({ current: temp.toUpperCase(), next: 'uusi hyvä salasana', confirm: 'uusi hyvä salasana' })).success).toBe(true);
    as('owner@example.com');
    const again = await resetUserPassword(mocks.state.users.find((u) => u.email === 'leader@example.com')!.id);
    const temp2 = again.success ? again.tempPassword! : '';
    as('leader@example.com');
    expect((await changeOwnPassword({ current: temp2, next: 'uusi hyvä salasana', confirm: 'uusi hyvä salasana' })).success).toBe(true);
    const row = mocks.state.users.find((u) => u.email === 'leader@example.com')!;
    expect(row.mustChangePassword).toBe(false);
    expect(await verifyPassword('uusi hyvä salasana', row.passwordHash)).toBe(true);
  });

  it('palvelimen asetusten omistaja ilman riviä saa rivin asettaessaan salasanan', async () => {
    as('matias.typpo@gmail.com');
    expect((await changeOwnPassword({ next: 'oma salasana 123', confirm: 'oma salasana 123' })).success).toBe(true);
    expect(mocks.state.users.find((u) => u.email === 'matias.typpo@gmail.com')).toMatchObject({ role: 'OWNER', mustChangePassword: false });
  });
});
