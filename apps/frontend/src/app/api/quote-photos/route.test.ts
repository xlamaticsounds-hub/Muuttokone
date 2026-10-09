import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Kuvien lataus: pyyntöraja 20 / 15 min / IP. Tietokanta ja tallennus korvataan mockeilla.
const mocks = vi.hoisted(() => {
  const logs: Record<string, any>[] = [];
  const prisma = {
    log: {
      create: vi.fn(async ({ data }: any) => (logs.push(data), data)),
      count: vi.fn(async ({ where }: any) => logs.filter((l) => l.ip === where.ip && l.action === where.action).length),
    },
  };
  const uploadImage = vi.fn(async () => ({ id: 'img_1', url: 'https://example.com/img.jpg' }));
  return { logs, prisma, uploadImage };
});
vi.mock('@/server/db', () => ({ prisma: mocks.prisma }));
vi.mock('@/server/storage', () => ({ uploadImage: mocks.uploadImage }));

const { POST } = await import('./route');

function upload(ip: string) {
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'kuva.jpg', { type: 'image/jpeg' }));
  return POST(new NextRequest('http://localhost/api/quote-photos', { method: 'POST', body: form, headers: { 'x-forwarded-for': ip } }));
}

beforeEach(() => {
  mocks.logs.length = 0;
  mocks.uploadImage.mockClear();
});

describe('/api/quote-photos pyyntöraja', () => {
  it('20 kuvaa samasta IP:stä läpi, 21. torjutaan eikä tallenneta', async () => {
    for (let i = 0; i < 20; i++) expect((await upload('203.0.113.60')).status).toBe(200);
    const blocked = await upload('203.0.113.60');
    expect(blocked.status).toBe(429);
    expect(mocks.uploadImage).toHaveBeenCalledTimes(20);
  });

  it('väärennetty alkupää ei ohita rajaa', async () => {
    for (let i = 0; i < 20; i++) await upload(`1.1.1.${i}, 203.0.113.61`);
    expect((await upload('1.1.1.99, 203.0.113.61')).status).toBe(429);
  });

  it('toinen asiakas ei esty', async () => {
    for (let i = 0; i < 20; i++) await upload('203.0.113.62');
    expect((await upload('198.51.100.20')).status).toBe(200);
  });
});
