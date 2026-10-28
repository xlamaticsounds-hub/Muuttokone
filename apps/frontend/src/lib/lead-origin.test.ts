import { describe, expect, it } from 'vitest';
import { isLeadOrigin, leadOrigin } from './lead-origin';

describe('leadOrigin', () => {
  it('"Keikka muualta" -lomakkeen keikka on Muuttomaailmasta, valitusta kanavasta riippumatta', () => {
    expect(leadOrigin({ source: 'OTHER', formData: { external: { source: 'muuttomaailma' } } })).toBe('muuttomaailma');
    expect(leadOrigin({ source: 'PHONE', formData: { external: { source: 'puhelu' } } })).toBe('muuttomaailma');
  });

  it('laskurin ja sivun lomakkeiden liidit ovat omalta sivulta', () => {
    expect(leadOrigin({ source: 'STEP_FORM', formData: JSON.stringify({ serviceType: 'moving', price: 450 }) })).toBe('oma');
    expect(leadOrigin({ source: 'WEBSITE', formData: null })).toBe('oma');
    expect(leadOrigin({ source: 'QUICK_QUOTE', formData: null })).toBe('oma');
  });

  it('/api/submit-lomake on oma sivu, vaikka lähdeteksti olisi muuttunut muuksi arvoksi', () => {
    expect(leadOrigin({ source: 'ADS', formData: JSON.stringify({ kind: 'api-lead', payload: {} }) })).toBe('oma');
  });

  it('käsin kirjattu vanha keikka ilman lomaketietoja on Muuttomaailmasta', () => {
    expect(leadOrigin({ source: 'OTHER', formData: null })).toBe('muuttomaailma');
    expect(leadOrigin({ source: 'EMAIL', formData: 'ei json' })).toBe('muuttomaailma');
  });
});

describe('isLeadOrigin', () => {
  it('hyväksyy vain tunnetut lähteet (URL-parametri)', () => {
    expect(isLeadOrigin('muuttomaailma')).toBe(true);
    expect(isLeadOrigin('oma')).toBe(true);
    expect(isLeadOrigin('puhelu')).toBe(false);
    expect(isLeadOrigin(undefined)).toBe(false);
  });
});
