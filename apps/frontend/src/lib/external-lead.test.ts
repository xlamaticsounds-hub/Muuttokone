import { describe, expect, it } from 'vitest';
import {
  cleanPhone,
  confirmedPriceText,
  normalizeExternalLeadInput,
  externalSourceLabel,
  leadSourceFor,
  normalizeExtraction,
  priceDraftFromExtraction,
  splitName,
  EMPTY_EXTRACTION,
} from './external-lead';

const today = '2026-10-24';

describe('normalizeExtraction', () => {
  it('siistii tekoälyn vastauksen', () => {
    const e = normalizeExtraction(
      {
        customerName: '  Testi   Asiakas ',
        phone: 'puh. 040-123 4567',
        email: 'testi@example.com',
        fromAddress: 'Mannerheimintie 100, 00250 Helsinki',
        toAddress: 'Leppävaarankatu 3, Espoo',
        date: '2026-11-08',
        time: 'klo 10',
        description: 'Kaksion muutto.',
        priceKind: 'fixed',
        priceAmount: '390',
        crewSize: 3,
        agreed: true,
        source: 'whatsapp',
        summary: 'Asiakas hyväksyi hinnan.',
        uncertainties: ['Kerros puuttuu', '', 5],
      },
      today,
    );
    expect(e).toMatchObject({
      customerName: 'Testi Asiakas',
      phone: '040-123 4567',
      email: 'testi@example.com',
      date: '2026-11-08',
      priceKind: 'fixed',
      priceAmount: 390,
      crewSize: 3,
      agreed: true,
      source: 'whatsapp',
      uncertainties: ['Kerros puuttuu'],
    });
  });

  it('hylkää epäilyttävät arvot ja pyytää tarkistamaan päivän', () => {
    const e = normalizeExtraction(
      { date: '2031-01-01', email: 'ei osoite', phone: '12', priceAmount: -50, hourlyRate: 5000, crewSize: 40, source: 'tiktok', priceKind: 'joku', agreed: 'kyllä' },
      today,
    );
    expect(e.date).toBeNull();
    expect(e.uncertainties[0]).toMatch(/Päivämäärää/);
    expect(e.email).toBeNull();
    expect(e.phone).toBeNull();
    expect(e.priceAmount).toBeNull();
    expect(e.hourlyRate).toBeNull();
    expect(e.crewSize).toBeNull();
    expect(e.source).toBeNull();
    expect(e.priceKind).toBe('unknown');
    expect(e.agreed).toBe(false);
  });

  it('kestää minkä tahansa syötteen', () => {
    expect(normalizeExtraction(null, today)).toEqual(EMPTY_EXTRACTION);
    expect(normalizeExtraction('roskaa', today)).toEqual(EMPTY_EXTRACTION);
  });

  it('hyväksyy jo menneen keikan (kirjataan jälkikäteen) mutta ei liian vanhaa', () => {
    expect(normalizeExtraction({ date: '2026-10-01' }, today).date).toBe('2026-10-01');
    expect(normalizeExtraction({ date: '2026-07-01' }, today).date).toBeNull();
  });
});

describe('apurit', () => {
  it('splitName', () => {
    expect(splitName('Matti Meikäläinen')).toEqual({ firstName: 'Matti', lastName: 'Meikäläinen' });
    expect(splitName('Anna-Liisa von Wright')).toEqual({ firstName: 'Anna-Liisa', lastName: 'von Wright' });
    expect(splitName('Matti')).toEqual({ firstName: 'Matti', lastName: null });
    expect(splitName('  ')).toEqual({ firstName: null, lastName: null });
  });
  it('cleanPhone', () => {
    expect(cleanPhone('+358 40 123 4567')).toBe('+358 40 123 4567');
    expect(cleanPhone('040+1234567')).toBe('0401234567');
    expect(cleanPhone('ei numeroa')).toBeNull();
  });
  it('lähteet', () => {
    expect(leadSourceFor('puhelu')).toBe('PHONE');
    expect(leadSourceFor('suositus')).toBe('REFERRAL');
    expect(leadSourceFor('muuttomaailma')).toBe('OTHER');
    expect(leadSourceFor('tuntematon')).toBe('OTHER');
    expect(externalSourceLabel('whatsapp')).toBe('WhatsApp / tekstiviesti');
    expect(externalSourceLabel('x')).toBeNull();
  });
});

describe('priceDraftFromExtraction', () => {
  it('kiinteä hinta yhdeksi riviksi henkilömäärän kanssa', () => {
    expect(priceDraftFromExtraction({ ...EMPTY_EXTRACTION, priceKind: 'fixed', priceAmount: 390, crewSize: 3 })).toEqual({
      lines: [{ label: 'Muuttopalvelu (3 henkilöä)', amount: 390 }],
      priceNote: null,
    });
  });
  it('tuntihinta hinnoittelutiedoksi ilman rivejä', () => {
    const d = priceDraftFromExtraction({ ...EMPTY_EXTRACTION, priceKind: 'hourly', hourlyRate: 89, minHours: 2 });
    expect(d.lines).toEqual([]);
    expect(d.priceNote).toBe('Tuntihinta 89 €/h, vähimmäisveloitus 2 h. Lopullinen hinta määräytyy toteutuneen työajan mukaan.');
  });
  it('tuntematon hinta jättää summan täytettäväksi', () => {
    expect(priceDraftFromExtraction(EMPTY_EXTRACTION)).toEqual({ lines: [{ label: 'Muuttopalvelu', amount: null }], priceNote: null });
  });
});

describe('normalizeExternalLeadInput', () => {
  const input = {
    customerName: 'Testi Asiakas',
    phone: '040 123 4567',
    email: 'testi@example.com',
    fromAddress: 'Mannerheimintie 100',
    toAddress: 'Leppävaarankatu 3',
    date: '2026-11-08',
    time: 'klo 10',
    source: 'whatsapp',
    sourceDetail: '',
    status: 'WON',
    conversationNotes: 'Asiakas: sopii!\nMe: kiitos',
    offer: { type: 'vahvistus', description: 'Kaksion muutto.', lines: [{ label: 'Muuttopalvelu', amount: '390', vatRate: 0 }] },
  };

  it('kopioi asiakkaan ja keikan tiedot dokumenttiin', () => {
    const r = normalizeExternalLeadInput(input, today);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({ firstName: 'Testi', lastName: 'Asiakas', status: 'WON', source: 'whatsapp', sourceDetail: null });
    expect(r.value.offer).toMatchObject({
      type: 'vahvistus',
      customerName: 'Testi Asiakas',
      customerPhone: '040 123 4567',
      serviceDate: '2026-11-08',
      serviceTime: 'klo 10',
      fromAddress: 'Mannerheimintie 100',
      lines: [{ label: 'Muuttopalvelu', amount: 390, vatRate: 0 }],
    });
    expect(r.value.conversationNotes).toBe('Asiakas: sopii!\nMe: kiitos');
  });

  it('käyttää oletuksia tuntemattomille arvoille ja hylkää virheelliset', () => {
    const r = normalizeExternalLeadInput({ ...input, status: 'COMPLETED', source: 'tiktok' }, today);
    expect(r.ok && [r.value.status, r.value.source]).toEqual(['PROPOSAL_SENT', 'puhelu']);
    expect(normalizeExternalLeadInput({ ...input, customerName: '' }, today)).toMatchObject({ ok: false });
    expect(normalizeExternalLeadInput({ ...input, email: 'x' }, today)).toMatchObject({ ok: false });
    expect(normalizeExternalLeadInput({ ...input, phone: 'abc' }, today)).toMatchObject({ ok: false });
    expect(normalizeExternalLeadInput({ ...input, date: '8.11.2026' }, today)).toMatchObject({ ok: false });
    expect(normalizeExternalLeadInput({ ...input, offer: { lines: [{ label: 'X', amount: '' }] } }, today)).toMatchObject({ ok: false });
  });

  it('confirmedPriceText', () => {
    expect(confirmedPriceText(390)).toBe('390');
    expect(confirmedPriceText(443.2)).toBe('443,20');
  });
});
