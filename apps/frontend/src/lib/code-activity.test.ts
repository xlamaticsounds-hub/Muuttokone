import { describe, expect, it } from 'vitest';
import { buildCodeActivity, codeActivityCsv, codeActivityCsvFilename, type CodeActivityLeadInput } from './code-activity';

function lead(overrides: Partial<CodeActivityLeadInput> & { id: string }): CodeActivityLeadInput {
  return {
    status: 'SCHEDULED',
    createdAt: new Date('2026-10-01T09:00:00Z'),
    requestedDate: new Date('2026-10-14T00:00:00Z'),
    completedAt: null,
    finalPrice: null,
    priceAfterDiscount: 275,
    commissionPercent: 5,
    discountCodeId: 'dc_km',
    contact: { firstName: 'Kaisa', lastName: 'Koodilla' },
    ...overrides,
  };
}

const leads = [
  lead({ id: 'uusi', createdAt: new Date('2026-10-05T09:00:00Z') }),
  lead({ id: 'vahvistettu', status: 'WON', createdAt: new Date('2026-10-03T09:00:00Z') }),
  lead({ id: 'toteutunut', status: 'COMPLETED', completedAt: new Date('2026-10-15T12:00:00Z'), finalPrice: 1000, createdAt: new Date('2026-10-02T09:00:00Z') }),
  lead({ id: 'toteutunut-2', status: 'COMPLETED', completedAt: new Date('2026-10-16T12:00:00Z'), finalPrice: 280, commissionPercent: null }),
  lead({ id: 'peruttu', status: 'CANCELLED' }),
  lead({ id: 'havitty', status: 'LOST' }),
  lead({ id: 'toinen-koodi', status: 'COMPLETED', finalPrice: 9999, discountCodeId: 'dc_muu' }),
];

describe('buildCodeActivity', () => {
  const { rows, summary } = buildCodeActivity({ codeId: 'dc_km', defaultCommissionPercent: 6, leads });

  it('vain valitun koodin varaukset, uusin ensin', () => {
    expect(rows.map((r) => r.leadId)).not.toContain('toinen-koodi');
    expect(rows[0].leadId).toBe('uusi');
    expect(rows).toHaveLength(6);
  });

  it('tilat lasketaan ryhmittäin', () => {
    expect(summary).toMatchObject({ total: 6, open: 1, confirmed: 1, completed: 2, cancelledOrLost: 2 });
  });

  it('palkkio vain toteutuneista; liidin oma prosentti, muuten koodin', () => {
    const done = rows.find((r) => r.leadId === 'toteutunut')!;
    expect(done).toMatchObject({ finalPriceGross: 1000, finalPriceNet: 796.81, commissionPercent: 5, commissionAmount: 39.84, statusLabel: 'Toteutunut' });
    const fallback = rows.find((r) => r.leadId === 'toteutunut-2')!;
    expect(fallback).toMatchObject({ commissionPercent: 6, finalPriceNet: 223.11, commissionAmount: 13.39 });
    expect(rows.find((r) => r.leadId === 'vahvistettu')!.commissionAmount).toBeNull();
    expect(summary).toMatchObject({ salesGross: 1280, salesNet: 1019.92, commission: 53.23 });
  });

  it('CSV: Excel-muoto, vain nimikirjaimet', () => {
    const csv = codeActivityCsv('KIINTEISTOMAAILMA', rows, summary);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines[0]).toMatch(/^Varaus tehty;Muuttopäivä;Tila;/);
    expect(csv).not.toContain('Kaisa');
    expect(csv).not.toContain('Koodilla');
    expect(csv).toContain(';Toteutunut;15.10.2026;K. K.;275,00;796,81;1000,00;5;39,84');
    expect(lines.at(-2)).toBe('Yhteensä KIINTEISTOMAAILMA;;6 varausta, 2 toteutunut;;;;1019,92;1280,00;;53,23');
    expect(codeActivityCsvFilename('KM-MANKKAA', new Date('2026-10-09T10:00:00Z'))).toBe('muuttokone-koodi-km-mankkaa-2026-10-09.csv');
  });
});
