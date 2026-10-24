import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OFFER_TERMS,
  MAX_OFFER_LINES,
  addDaysIso,
  buildDefaultOffer,
  formatIsoDateFi,
  isIsoDate,
  normalizeOffer,
  offerFileName,
  offerNumber,
  offerTitle,
  offerTotals,
  parseAmount,
  parseStoredOffer,
} from './offer';

const today = '2026-10-24';
const valid = {
  type: 'tarjous',
  customerName: '  Testi Asiakas ',
  customerEmail: 'testi@example.com',
  customerPhone: '040 123 4567',
  serviceDate: '2026-11-08',
  serviceTime: 'klo 10',
  fromAddress: 'Mannerheimintie 100, Helsinki',
  toAddress: 'Leppävaarankatu 3, Espoo',
  description: 'Kaksion muutto, 3 muuttajaa ja pakettiauto.',
  lines: [{ label: 'Muuttopalvelu', amount: '390', vatRate: 0 }],
  priceNote: '',
  notes: '',
};

describe('päivämäärät', () => {
  it('tunnistaa oikeat ISO-päivät ja hylkää olemattomat', () => {
    expect(isIsoDate('2026-11-08')).toBe(true);
    expect(isIsoDate('2026-02-31')).toBe(false);
    expect(isIsoDate('8.11.2026')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
  it('lisää päiviä kuukauden ja vuoden yli ja muotoilee suomeksi', () => {
    expect(addDaysIso('2026-12-25', 14)).toBe('2027-01-08');
    expect(addDaysIso('2026-10-24', -60)).toBe('2026-08-25');
    expect(formatIsoDateFi('2026-11-08')).toBe('8.11.2026');
  });
});

describe('normalizeOffer', () => {
  it('siistii kentät, laskee voimassaolon ja pyöristää summat', () => {
    const r = normalizeOffer({ ...valid, lines: [{ label: ' Muuttopalvelu ', amount: '389,999', vatRate: 0 }] }, today);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.customerName).toBe('Testi Asiakas');
    expect(r.value.issuedOn).toBe(today);
    expect(r.value.validUntil).toBe('2026-11-07'); // 14 päivää
    expect(r.value.lines).toEqual([{ label: 'Muuttopalvelu', amount: 390, vatRate: 0 }]);
    expect(r.value.priceNote).toBeNull();
    expect(r.value.terms).toBe(DEFAULT_OFFER_TERMS);
  });

  it('vahvistuksella ei ole voimassaoloaikaa', () => {
    const r = normalizeOffer({ ...valid, type: 'vahvistus', validUntil: '2026-12-01' }, today);
    expect(r.ok && r.value.validUntil).toBeNull();
  });

  it('ohittaa tyhjät rivit mutta vaatii summan ja selitteen täytetyiltä', () => {
    const empty = normalizeOffer({ ...valid, lines: [{ label: '', amount: '' }, ...valid.lines] }, today);
    expect(empty.ok && empty.value.lines.length).toBe(1);
    expect(normalizeOffer({ ...valid, lines: [{ label: 'Muuttopalvelu', amount: '' }] }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, lines: [{ label: '', amount: 100 }] }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, lines: [{ label: 'X', amount: -5 }] }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, lines: [{ label: 'X', amount: 1_000_000 }] }, today)).toMatchObject({ ok: false });
  });

  it('hyväksyy vain tunnetut ALV-kannat (muuten oletus 0 %)', () => {
    const r = normalizeOffer({ ...valid, lines: [{ label: 'A', amount: 100, vatRate: 0.255 }, { label: 'B', amount: 50, vatRate: 0.24 }] }, today);
    expect(r.ok && r.value.lines.map((l) => l.vatRate)).toEqual([0.255, 0]);
  });

  it('hylkää puuttuvan nimen, väärän sähköpostin, väärän päivän ja liian monta riviä', () => {
    expect(normalizeOffer({ ...valid, customerName: ' ' }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, customerEmail: 'ei-osoite' }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, serviceDate: '2026-13-01' }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, validUntil: '2026-10-01' }, today)).toMatchObject({ ok: false });
    const many = Array.from({ length: MAX_OFFER_LINES + 1 }, (_, i) => ({ label: `Rivi ${i}`, amount: 10 }));
    expect(normalizeOffer({ ...valid, lines: many }, today)).toMatchObject({ ok: false });
  });

  it('vaatii kuvauksen, hintarivin tai hinnoittelutiedon', () => {
    expect(normalizeOffer({ ...valid, description: '', lines: [], priceNote: '' }, today)).toMatchObject({ ok: false });
    expect(normalizeOffer({ ...valid, description: '', lines: [], priceNote: 'Tuntihinta 89 €/h' }, today)).toMatchObject({ ok: true });
  });

  it('säilyttää tarkoituksella tyhjennetyt ehdot, mutta antaa oletuksen puuttuville', () => {
    expect(normalizeOffer({ ...valid, terms: '' }, today)).toMatchObject({ ok: true, value: { terms: '' } });
    expect(parseStoredOffer({ ...valid }, today)?.terms).toBe(DEFAULT_OFFER_TERMS);
    expect(parseStoredOffer(null, today)).toBeNull();
    expect(parseStoredOffer({ customerName: '' }, today)).toBeNull();
  });
});

describe('summat ja tunnisteet', () => {
  it('laskee verottoman hinnan ja ALV:n bruttosummista', () => {
    expect(offerTotals([{ label: 'A', amount: 390, vatRate: 0 }])).toEqual({ net: 390, vat: 0, gross: 390 });
    expect(offerTotals([{ label: 'A', amount: 125.5, vatRate: 0.255 }, { label: 'B', amount: 100, vatRate: 0 }])).toEqual({ net: 200, vat: 25.5, gross: 225.5 });
  });
  it('lukee summat myös tekstinä', () => {
    expect(parseAmount('1 250,50 €')).toBe(1250.5);
    expect(Number.isNaN(parseAmount(''))).toBe(true);
  });
  it('numeroi ja nimeää dokumentin', () => {
    expect(offerNumber('cmh3k1x0a0001k4f7qd', '2026-10-24')).toBe('2026-K4F7QD');
    expect(offerTitle('vahvistus')).toBe('Tilausvahvistus');
    expect(offerFileName('tarjous', '2026-K4F7QD')).toBe('tarjous-2026-K4F7QD.pdf');
    expect(offerFileName('vahvistus', '2026-K4F7QD')).toBe('tilausvahvistus-2026-K4F7QD.pdf');
  });
});

describe('buildDefaultOffer', () => {
  it('esitäyttää liidin tiedoista ja hinnasta', () => {
    const offer = buildDefaultOffer(
      { customerName: 'Testi Asiakas', customerEmail: null, customerPhone: null, serviceDate: '2026-11-08', serviceTime: null, fromAddress: 'A', toAddress: 'B', price: 450 },
      today,
    );
    expect(offer.lines).toEqual([{ label: 'Muuttopalvelu', amount: 450, vatRate: 0 }]);
    expect(offer.validUntil).toBe('2026-11-07');
    expect(normalizeOffer(offer, today).ok).toBe(true);
  });
  it('jättää hintarivit tyhjiksi ilman hintaa', () => {
    const offer = buildDefaultOffer(
      { type: 'vahvistus', customerName: 'X', customerEmail: null, customerPhone: null, serviceDate: null, serviceTime: null, fromAddress: null, toAddress: null, price: null },
      today,
    );
    expect(offer.lines).toEqual([]);
    expect(offer.validUntil).toBeNull();
  });
});
