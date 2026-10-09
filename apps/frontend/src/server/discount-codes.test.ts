import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupDiscountCode } from './discount-codes';

// Tietokanta korvataan: koodit tallennetaan isoilla kirjaimilla, kuten oikeassa kannassa.
const { rows, findUnique } = vi.hoisted(() => {
  const rows = new Map<string, Record<string, unknown>>();
  const findUnique = vi.fn(async ({ where }: { where: { code: string } }) => rows.get(where.code) ?? null);
  return { rows, findUnique };
});
vi.mock('@/server/db', () => ({ prisma: { discountCode: { findUnique } } }));

const baseRow = {
  id: 'dc_kiinteistomaailma',
  code: 'KIINTEISTOMAAILMA',
  partner: 'Kiinteistömaailma',
  office: null,
  agentName: null,
  discountPercent: 10,
  commissionPercent: 5,
  active: true,
  validFrom: null,
  validUntil: null,
  createdAt: new Date('2026-10-09T00:00:00Z'),
  updatedAt: new Date('2026-10-09T00:00:00Z'),
};

beforeEach(() => {
  findUnique.mockClear();
  rows.clear();
  rows.set('KIINTEISTOMAAILMA', { ...baseRow });
  rows.set('KM-MANKKAA', { ...baseRow, id: 'dc_mankkaa', code: 'KM-MANKKAA', office: 'Mankkaa', active: false });
});

describe('lookupDiscountCode', () => {
  it('kelvollinen koodi löytyy', async () => {
    const result = await lookupDiscountCode('KIINTEISTOMAAILMA');
    expect(result.check).toEqual({ ok: true });
    expect(result.record?.partner).toBe('Kiinteistömaailma');
  });

  it('isot ja pienet kirjaimet eivät vaikuta', async () => {
    for (const input of ['kiinteistomaailma', 'Kiinteistomaailma', ' KiInTeIsToMaAiLmA ']) {
      const result = await lookupDiscountCode(input);
      expect(result.code).toBe('KIINTEISTOMAAILMA');
      expect(result.check).toEqual({ ok: true });
    }
  });

  it('väärä koodi hylätään', async () => {
    const result = await lookupDiscountCode('KIINTEISTOMAAILM');
    expect(result.record).toBeNull();
    expect(result.check).toMatchObject({ ok: false, reason: 'not_found' });
  });

  it('deaktivoitu koodi hylätään', async () => {
    const result = await lookupDiscountCode('km-mankkaa');
    expect(result.record?.office).toBe('Mankkaa');
    expect(result.check).toMatchObject({ ok: false, reason: 'inactive' });
  });

  it('vanhentunut koodi hylätään', async () => {
    rows.set('KIINTEISTOMAAILMA', { ...baseRow, validUntil: new Date('2026-09-30T20:59:59Z') });
    const result = await lookupDiscountCode('KIINTEISTOMAAILMA', new Date('2026-10-09T12:00:00Z'));
    expect(result.check).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('tyhjä koodi ei tee tietokantahakua', async () => {
    const result = await lookupDiscountCode('   ');
    expect(result.check).toMatchObject({ ok: false, reason: 'empty' });
    expect(findUnique).not.toHaveBeenCalled();
  });
});
