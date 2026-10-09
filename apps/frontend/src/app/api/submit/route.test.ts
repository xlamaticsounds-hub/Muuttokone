import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { CalculatorSchema, calculateMovingPrice } from '@/features/calculator/pricing';

// Laskurin varaus (/api/submit, type 'booking') ja koodin tarkistus (/api/discount-code)
// päästä päähän: tietokanta, Discord ja kalenteri korvataan muistinvaraisilla mockeilla.
const db = vi.hoisted(() => {
  const state = {
    leads: [] as Record<string, any>[],
    logs: [] as Record<string, any>[],
    codes: new Map<string, Record<string, any>>(),
  };
  const prisma = {
    contact: {
      findFirst: async () => null,
      create: async ({ data }: any) => ({ id: 'contact_1', ...data }),
      update: async ({ data }: any) => ({ id: 'contact_1', ...data }),
    },
    lead: {
      create: async ({ data }: any) => {
        const lead = { id: `lead_${state.leads.length + 1}`, discordMessageId: null, ...data };
        state.leads.push(lead);
        return lead;
      },
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
    },
    log: {
      create: async ({ data }: any) => {
        state.logs.push(data);
        return data;
      },
      count: async ({ where }: any) =>
        state.logs.filter((l) => l.action === where.action && (where.ip === undefined || l.ip === where.ip)).length,
    },
    discountCode: {
      findUnique: async ({ where }: any) => state.codes.get(where.code) ?? null,
    },
  };
  return { state, prisma };
});

const discord = vi.hoisted(() => ({ postLeadToDiscord: vi.fn(async (_details: any) => null) }));

vi.mock('@/server/db', () => ({ prisma: db.prisma }));
vi.mock('@/server/discord-bot', () => discord);
vi.mock('@/server/discord-webhook', () => ({ sendDiscordNotification: vi.fn(async () => {}) }));
vi.mock('@/server/google-calendar', () => ({
  findOverlappingEvents: vi.fn(async () => []),
  createTentativeLeadEvent: vi.fn(async () => null),
}));

const { POST: submit } = await import('./route');
const { POST: checkCode } = await import('../discount-code/route');

const calculatorData = {
  serviceType: 'moving',
  movingPackage: 'full_service',
  addressFrom: 'Mannerheimintie 1, Helsinki',
  addressTo: 'Tapiolantie 5, Espoo',
  additionalStops: [],
  distanceKm: 40,
  driverCount: '1',
  apartmentSize: '2h',
  floorFrom: 3,
  elevatorFrom: false,
  floorTo: 1,
  elevatorTo: true,
  carryDistanceFrom: '<10',
  carryDistanceTo: '10-30',
  boxCount: 30,
  heavyItems: [],
  furnitureItems: { sofa_3: 1, bed_160: 1, box_standard: 30, fridge: 1, washing_machine: 1 },
  customItems: [],
  photos: [],
  needsPacking: false,
  needsCleaning: true,
  services: [],
  selectedWasteTypes: [],
  needsBoxRental: false,
  boxRentalCount: 0,
  boxRentalDays: 14,
  date: '2026-11-07T00:00:00.000Z',
  preferredTime: '09:00',
  contactName: 'Matti Meikäläinen',
  contactEmail: 'matti@example.com',
  contactPhone: '040 123 4567',
  gdpr_consent: true,
  company: '',
};

const expected = calculateMovingPrice(
  CalculatorSchema.parse({ ...calculatorData, date: new Date(calculatorData.date), contactEmail: undefined }),
);

function post(url: string, body: unknown, ip = '10.0.0.1') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

async function book(extra: Record<string, unknown>) {
  const res = await submit(
    post('http://localhost/api/submit', { type: 'booking', data: { ...calculatorData, price: 1, ...extra } }),
  );
  expect(res.status).toBe(200);
  const lead = db.state.leads.at(-1)!;
  return { lead, formData: JSON.parse(lead.formData) };
}

beforeEach(() => {
  db.state.leads = [];
  db.state.logs = [];
  db.state.codes.clear();
  db.state.codes.set('KIINTEISTOMAAILMA', {
    id: 'dc_km',
    code: 'KIINTEISTOMAAILMA',
    partner: 'Kiinteistömaailma',
    office: null,
    agentName: null,
    discountPercent: 10,
    commissionPercent: 5,
    active: true,
    validFrom: null,
    validUntil: null,
  });
  db.state.codes.set('KM-SULJETTU', {
    ...db.state.codes.get('KIINTEISTOMAAILMA'),
    id: 'dc_off',
    code: 'KM-SULJETTU',
    active: false,
  });
  discord.postLeadToDiscord.mockClear();
});

describe('/api/submit booking', () => {
  it('liidi ilman koodia: palvelimen hinta, ei alennuskenttiä, selaimen hinta ohitetaan', async () => {
    const { lead, formData } = await book({});
    expect(formData.price).toBe(expected.total);
    expect(lead.notes).toContain(`Hinta-arvio: ${expected.total}€`);
    expect(lead.discountCode).toBeUndefined();
    expect(lead.priceAfterDiscount).toBeUndefined();
    expect(db.state.logs.some((l) => l.action === 'lead.price_mismatch')).toBe(true);
  });

  it('kelvollinen koodi (pienillä kirjaimilla): alennus palvelimella, siivous ei alennu', async () => {
    const { lead, formData } = await book({ discountCode: 'kiinteistomaailma' });
    const discountAmount = Math.round((expected.total - expected.addOnsTotal) * 0.1);
    const after = Math.round(expected.total) - discountAmount;

    expect(lead).toMatchObject({
      discount: { connect: { id: 'dc_km' } },
      discountCode: 'KIINTEISTOMAAILMA',
      discountPartner: 'Kiinteistömaailma',
      discountOffice: null,
      discountAgentName: null,
      discountPercent: 10,
      commissionPercent: 5,
      priceBeforeDiscount: Math.round(expected.total),
      discountAmount,
      priceAfterDiscount: after,
    });
    expect(formData.price).toBe(after);
    expect(formData.discountCode).toBe('KIINTEISTOMAAILMA');
    expect(lead.notes).toContain('🏠 Kiinteistömaailma-etu -10 %');

    await vi.waitFor(() => expect(discord.postLeadToDiscord).toHaveBeenCalled());
    const details = discord.postLeadToDiscord.mock.calls[0][0];
    expect(details.discountField.name).toBe('🏠 Kiinteistömaailma-koodi');
    expect(details.priceLabel).toBe(`${after}€ (ennen alennusta ${Math.round(expected.total)}€)`);
  });

  it('väärä koodi: ei alennusta, hylkäys näkyy muistiinpanoissa', async () => {
    const { lead, formData } = await book({ discountCode: 'VAARAKOODI' });
    expect(lead.discountCode).toBeUndefined();
    expect(formData.price).toBe(expected.total);
    expect(formData.discountCode).toBeUndefined();
    expect(lead.notes).toContain('⚠️ Alennuskoodi "VAARAKOODI" ei kelvannut');
  });

  it('koodin tarkistuksen tietokantavirhe ei kaada varausta', async () => {
    const original = db.prisma.discountCode.findUnique;
    db.prisma.discountCode.findUnique = async () => {
      throw new Error('yhteys katkesi');
    };
    try {
      const { lead, formData } = await book({ discountCode: 'KIINTEISTOMAAILMA' });
      expect(lead.discountCode).toBeUndefined();
      expect(formData.price).toBe(expected.total);
      expect(lead.notes).toContain('ei voitu tarkistaa — tarkista ja laske alennus käsin');
    } finally {
      db.prisma.discountCode.findUnique = original;
    }
  });

  it('deaktivoitu koodi: ei alennusta', async () => {
    const { lead, formData } = await book({ discountCode: 'km-suljettu' });
    expect(lead.discountCode).toBeUndefined();
    expect(formData.price).toBe(expected.total);
    expect(lead.notes).toContain('ei ole enää voimassa');
  });
});

describe('/api/discount-code', () => {
  const check = async (code: unknown, ip?: string) =>
    (await checkCode(post('http://localhost/api/discount-code', { code }, ip))).json();

  it('kelvollinen koodi kirjainkoosta riippumatta', async () => {
    expect(await check('Kiinteistomaailma')).toEqual({
      valid: true,
      code: 'KIINTEISTOMAAILMA',
      partner: 'Kiinteistömaailma',
      discountPercent: 10,
      label: 'Kiinteistömaailma-etu -10 %',
    });
  });

  it('väärä ja deaktivoitu koodi hylätään selkeällä viestillä', async () => {
    expect(await check('EIOLE')).toEqual({ valid: false, message: 'Alennuskoodia ei löytynyt. Tarkista koodi.' });
    expect(await check('KM-SULJETTU')).toEqual({ valid: false, message: 'Alennuskoodi ei ole enää voimassa.' });
  });

  it('rajoittaa toistuvat väärät yritykset samasta IP:stä', async () => {
    for (let i = 0; i < 10; i++) await check(`ARVAUS${i}`, '10.9.9.9');
    const res = await checkCode(post('http://localhost/api/discount-code', { code: 'KIINTEISTOMAAILMA' }, '10.9.9.9'));
    expect(res.status).toBe(429);
    // eri IP:stä oikea koodi toimii edelleen
    expect((await check('KIINTEISTOMAAILMA', '10.1.1.1')).valid).toBe(true);
  });

  it('väärennetty x-forwarded-for-alkupää ei ohita rajaa (Railway lisää oikean IP:n loppuun)', async () => {
    for (let i = 0; i < 10; i++) await check(`ARVAUS${i}`, `1.2.3.${i}, 203.0.113.9`);
    const res = await checkCode(post('http://localhost/api/discount-code', { code: 'KM-ARVAUS' }, '1.2.3.99, 203.0.113.9'));
    expect(res.status).toBe(429);
    // muut asiakkaat eivät esty
    expect((await check('KIINTEISTOMAAILMA', '198.51.100.7')).valid).toBe(true);
  });
});

describe('/api/submit pyyntöraja', () => {
  const send = (ip: string, body: unknown = { type: 'tuntematon' }) => submit(post('http://localhost/api/submit', body, ip));

  it('10 lähetystä samasta IP:stä 15 minuutissa, 11. torjutaan', async () => {
    for (let i = 0; i < 10; i++) expect((await send('203.0.113.50')).status).not.toBe(429);
    expect((await send('203.0.113.50')).status).toBe(429);
    expect(db.state.logs.filter((l) => l.action === 'submit' && l.ip === '203.0.113.50')).toHaveLength(10);
  });

  it('torjuttu varaus ei luo liidiä', async () => {
    for (let i = 0; i < 10; i++) await send('203.0.113.51');
    const res = await send('203.0.113.51', { type: 'booking', data: { ...calculatorData, price: 1 } });
    expect(res.status).toBe(429);
    expect(db.state.leads).toHaveLength(0);
  });

  it('muut asiakkaat eivät esty', async () => {
    for (let i = 0; i < 10; i++) await send('203.0.113.52');
    expect((await send('198.51.100.9')).status).not.toBe(429);
  });

  it('väärennetty x-forwarded-for-alkupää ei ohita rajaa', async () => {
    for (let i = 0; i < 10; i++) await send(`9.9.9.${i}, 203.0.113.53`);
    expect((await send('9.9.9.99, 203.0.113.53')).status).toBe(429);
  });

  it('paikallista kehitystä (yksityinen IP) ei rajoiteta', async () => {
    for (let i = 0; i < 12; i++) expect((await send('::1')).status).not.toBe(429);
  });
});
