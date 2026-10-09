import { describe, expect, it } from 'vitest';
import { parseDiscountCodeInput, type DiscountCodeFormValues } from './discount-code-input';

const base: DiscountCodeFormValues = {
  code: 'km-mankkaa',
  partner: ' Kiinteistömaailma ',
  office: ' Mankkaa ',
  agentName: '',
  discountPercent: '10',
  commissionPercent: '5',
  active: true,
  validFrom: '',
  validUntil: '',
};

describe('parseDiscountCodeInput', () => {
  it('normalisoi koodin ja siistii tekstit', () => {
    const result = parseDiscountCodeInput(base);
    expect(result).toEqual({
      ok: true,
      data: {
        code: 'KM-MANKKAA',
        partner: 'Kiinteistömaailma',
        office: 'Mankkaa',
        agentName: null,
        discountPercent: 10,
        commissionPercent: 5,
        active: true,
        validFrom: null,
        validUntil: null,
      },
    });
  });

  it('hyväksyy desimaalipilkun prosenteissa', () => {
    const result = parseDiscountCodeInput({ ...base, discountPercent: '7,5', commissionPercent: '2,5 %' });
    expect(result.ok && result.data.discountPercent).toBe(7.5);
    expect(result.ok && result.data.commissionPercent).toBe(2.5);
  });

  it('voimassaolo: alku päivän alusta, loppu päivän loppuun Suomen aikaa', () => {
    const result = parseDiscountCodeInput({ ...base, validFrom: '2026-10-01', validUntil: '2026-12-31' });
    expect(result.ok && result.data.validFrom?.toISOString()).toBe('2026-09-30T21:00:00.000Z');
    expect(result.ok && result.data.validUntil?.toISOString()).toBe('2026-12-31T21:59:59.999Z');
  });

  it.each([
    [{ code: 'ab' }, 'Koodissa'],
    [{ code: 'KM MANKKAA!' }, 'Koodissa'],
    [{ partner: '  ' }, 'Kumppanin nimi puuttuu'],
    [{ discountPercent: '0' }, 'Alennuksen'],
    [{ discountPercent: '60' }, 'Alennuksen'],
    [{ discountPercent: 'kymmenen' }, 'Alennuksen'],
    [{ commissionPercent: '-1' }, 'Palkkion'],
    [{ validFrom: '2026-12-01', validUntil: '2026-11-01' }, 'ennen alkua'],
    [{ validUntil: '31.12.2026' }, 'virheellinen'],
  ])('hylkää virheellisen syötteen %j', (patch, message) => {
    const result = parseDiscountCodeInput({ ...base, ...patch });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain(message);
  });

  it('tallentaa ääkköset ilman pisteitä, jotta molemmat kirjoitusasut kelpaavat', () => {
    const result = parseDiscountCodeInput({ ...base, code: 'kiinteistömaailma' });
    expect(result.ok && result.data.code).toBe('KIINTEISTOMAAILMA');
  });
});
