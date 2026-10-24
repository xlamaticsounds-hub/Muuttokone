import { describe, expect, it } from 'vitest';
import { buildDefaultOffer } from './offer';
import { offerEmailSubject, renderOfferEmailHtml } from './offer-email';
import { safeImageName, sniffImageType } from './image-sniff';

const base = buildDefaultOffer(
  {
    customerName: 'Testi <b>Asiakas</b>',
    customerEmail: 'testi@example.com',
    customerPhone: null,
    serviceDate: '2026-11-08',
    serviceTime: 'klo 10',
    fromAddress: 'Mannerheimintie 100',
    toAddress: 'Leppävaarankatu 3',
    price: 390,
  },
  '2026-10-24',
);

describe('offerEmailSubject', () => {
  it('erottaa tarjouksen ja vahvistuksen', () => {
    expect(offerEmailSubject(base, '2026-ABC123')).toBe('Tarjous Muuttokone.fi:ltä nro 2026-ABC123 — 8.11.2026');
    expect(offerEmailSubject({ ...base, type: 'vahvistus', serviceDate: null }, '2026-ABC123')).toBe('Tilausvahvistus — Muuttokone.fi');
  });
});

describe('renderOfferEmailHtml', () => {
  it('pakoilee asiakkaan tekstit ja näyttää hinnan, voimassaolon ja ALV-tiedon', () => {
    const html = renderOfferEmailHtml({ offer: base, number: '2026-ABC123', total: 390, message: 'Rivi 1\n<script>x</script>' });
    expect(html).toContain('Hei Testi,');
    expect(html).not.toContain('<b>Asiakas</b>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Rivi 1<br />&lt;script&gt;');
    expect(html).toContain('390,00 €');
    expect(html).toContain('ALV 0 %');
    expect(html).toContain('voimassa 7.11.2026 asti');
    expect(html).toContain('8.11.2026');
  });
  it('tuntihinnoittelussa näyttää hinnoittelutiedon summan sijaan', () => {
    const html = renderOfferEmailHtml({ offer: { ...base, lines: [], priceNote: 'Tuntihinta 89 €/h' }, number: 'N', total: 0, message: null });
    expect(html).toContain('Hinnoittelu');
    expect(html).toContain('Tuntihinta 89 €/h');
  });
});

describe('image-sniff', () => {
  it('tunnistaa kuvatyypit sisällöstä', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png');
    expect(sniffImageType(new TextEncoder().encode('RIFF1234WEBPVP8 '))).toBe('image/webp');
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
  it('siistii tiedostonimen', () => {
    expect(safeImageName('Näyttökuva 2026-10-24 klo 9.41.png', 'image/png')).toBe('Nayttokuva-2026-10-24-klo-9-41.png');
    expect(safeImageName('../../etc/passwd', 'image/jpeg')).toBe('etc-passwd.jpg');
    expect(safeImageName('', 'image/webp')).toBe('kuva.webp');
  });
});
