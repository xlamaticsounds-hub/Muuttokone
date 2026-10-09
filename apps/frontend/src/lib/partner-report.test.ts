import { describe, expect, it } from 'vitest';
import { buildPartnerReport, customerInitials, type PartnerReportLeadInput } from './partner-report';
import { partnerReportCsv, partnerReportCsvFilename, partnerReportSubject, renderPartnerReportHtml } from './partner-report-render';

const KM = { partner: 'Kiinteistömaailma', office: null, agentName: null, commissionPercent: 5 };
const KM_MANKKAA = { partner: 'Kiinteistömaailma', office: 'Mankkaa', agentName: 'Maija Välittäjä', commissionPercent: 5 };

function lead(overrides: Partial<PartnerReportLeadInput> & { id: string }): PartnerReportLeadInput {
  return {
    status: 'COMPLETED',
    completedAt: new Date('2026-10-15T12:00:00Z'),
    requestedDate: new Date('2026-10-14T00:00:00Z'),
    finalPrice: 1000,
    discountCode: 'KIINTEISTOMAAILMA',
    commissionPercent: 5,
    contact: { firstName: 'Matti', lastName: 'Meikäläinen' },
    discount: KM,
    ...overrides,
  };
}

// Testidata: vain "toteutunut" saa näkyä raportissa.
const leads: PartnerReportLeadInput[] = [
  lead({ id: 'toteutunut' }),
  lead({ id: 'peruttu', status: 'CANCELLED' }),
  lead({ id: 'vahvistamaton', status: 'WON', completedAt: null, finalPrice: null }),
  lead({ id: 'uusi-varaus', status: 'SCHEDULED', completedAt: null, finalPrice: null }),
  lead({ id: 'ilman-koodia', discountCode: null, discount: null }),
  lead({ id: 'toinen-kumppani', discount: { ...KM, partner: 'Toinen Oy' } }),
  lead({ id: 'edellinen-kuu', completedAt: new Date('2026-09-30T20:59:59Z') }), // 30.9. klo 23.59 Helsinki
  lead({ id: 'seuraava-kuu', completedAt: new Date('2026-10-31T22:00:00Z') }), // 1.11. klo 00.00 Helsinki
  lead({ id: 'kuun-alku', completedAt: new Date('2026-09-30T21:00:00Z'), contact: { firstName: 'Liisa', lastName: null } }), // 1.10. 00.00
  lead({ id: 'kuun-loppu', completedAt: new Date('2026-10-31T21:59:59Z'), finalPrice: 809, requestedDate: new Date('2026-10-31T00:00:00Z') }),
];

describe('buildPartnerReport', () => {
  const report = buildPartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, leads, now: new Date('2026-11-01T06:00:00Z') });
  const ids = report.groups.flatMap((g) => g.rows.map((r) => r.leadId));

  it('ottaa mukaan vain toteutuneet koodilla tehdyt muutot kuukauden ajalta (Suomen aikaa)', () => {
    expect(ids.sort()).toEqual(['kuun-alku', 'kuun-loppu', 'toteutunut']);
  });

  it('peruttu ja vahvistamaton eivät näy', () => {
    expect(ids).not.toContain('peruttu');
    expect(ids).not.toContain('vahvistamaton');
    expect(ids).not.toContain('uusi-varaus');
  });

  it('laskee palkkion lopullisesta hinnasta alv 0 % ja summat', () => {
    const row = report.groups[0].rows.find((r) => r.leadId === 'toteutunut')!;
    expect(row).toMatchObject({ finalPriceGross: 1000, finalPriceNet: 796.81, commissionPercent: 5, commissionAmount: 39.84, initials: 'M. M.' });
    expect(report.totals).toEqual({ count: 3, salesGross: 2809, salesNet: 2238.24, commission: 111.91 });
    // 1000 -> 796,81 / 39,84 ; 1000 -> 796,81 / 39,84 ; 809 -> 644,62 / 32,23
  });

  it('järjestää muuttopäivän mukaan ja käyttää Suomen päivämääriä', () => {
    const rows = report.groups[0].rows;
    expect(rows.map((r) => r.moveDate)).toEqual(['2026-10-14', '2026-10-14', '2026-10-31']);
    expect(rows.find((r) => r.leadId === 'kuun-alku')!.completedDate).toBe('2026-10-01');
  });

  it('yksi koodi -> ei ryhmittelyä; useampi -> ryhmät välisummineen', () => {
    expect(report.grouped).toBe(false);
    const two = buildPartnerReport({
      partner: 'Kiinteistömaailma',
      year: 2026,
      month: 10,
      leads: [lead({ id: 'a' }), lead({ id: 'b', discountCode: 'KM-MANKKAA', discount: KM_MANKKAA, finalPrice: 500 })],
    });
    expect(two.grouped).toBe(true);
    expect(two.groups.map((g) => g.label)).toEqual(['KIINTEISTOMAAILMA', 'KM-MANKKAA (Mankkaa / Maija Välittäjä)']);
    expect(two.groups[1].totals).toEqual({ count: 1, salesGross: 500, salesNet: 398.41, commission: 19.92 });
  });

  it('käyttää liidille tallennettua palkkioprosenttia (koodin muutos ei vaikuta takautuvasti)', () => {
    const r = buildPartnerReport({
      partner: 'Kiinteistömaailma',
      year: 2026,
      month: 10,
      leads: [lead({ id: 'x', commissionPercent: 5, discount: { ...KM, commissionPercent: 8 } })],
    });
    expect(r.groups[0].rows[0].commissionPercent).toBe(5);
  });

  it('käyttää varaushetken kumppania/toimipaikkaa: koodin myöhempi muokkaus ei muuta raporttia', () => {
    const renamed = { ...KM_MANKKAA, partner: 'Kiinteistömaailma Espoo', office: 'Uusi nimi' };
    const r = buildPartnerReport({
      partner: 'Kiinteistömaailma',
      year: 2026,
      month: 10,
      leads: [lead({ id: 'snap', discount: renamed, discountPartner: 'Kiinteistömaailma', discountOffice: 'Mankkaa', discountAgentName: null })],
    });
    expect(r.totals.count).toBe(1);
    expect(r.groups[0].rows[0].office).toBe('Mankkaa');
    const other = buildPartnerReport({
      partner: 'Kiinteistömaailma Espoo',
      year: 2026,
      month: 10,
      leads: [lead({ id: 'snap', discount: renamed, discountPartner: 'Kiinteistömaailma' })],
    });
    expect(other.totals.count).toBe(0);
  });

  it('nimikirjaimet', () => {
    expect(customerInitials('Matti', 'Meikäläinen')).toBe('M. M.');
    expect(customerInitials('anna-liisa', 'von Berg')).toBe('A. V. B.');
    expect(customerInitials(null, null)).toBe('–');
  });
});

describe('raportin sähköposti ja CSV', () => {
  const withContactInfo = lead({ id: 'yksityisyys', contact: { firstName: 'Pekka', lastName: 'Puhelinnumero' } });
  const report = buildPartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 10, leads: [withContactInfo] });
  const html = renderPartnerReportHtml(report, null);
  const csv = partnerReportCsv(report);

  it('ei sisällä nimiä, puhelinnumeroita, sähköposteja eikä osoitteita — vain nimikirjaimet', () => {
    for (const text of [html, csv]) {
      expect(text).not.toContain('Pekka');
      expect(text).not.toContain('Puhelinnumero');
      expect(text).not.toContain('yksityisyys'); // sisäinen liidin tunniste
      expect(text).toContain('P. P.');
    }
  });

  it('sähköpostissa rivit ja yhteenveto', () => {
    expect(html).toContain('14.10.2026');
    expect(html).toContain('KIINTEISTOMAAILMA');
    expect(html).toContain('796,81 €');
    expect(html).toContain('1 000,00 €');
    expect(html).toContain('Välityspalkkio yhteensä: <strong>39,84 €</strong>');
    expect(html).toContain('Palkkio on 5 % lopullisesta hinnasta ilman arvonlisäveroa');
  });

  it('esikatselussa varoitus ja hyväksyntälinkki, varsinaisessa ei', () => {
    const preview = renderPartnerReportHtml(report, { approveUrl: 'https://www.muuttokone.fi/hallinta/raportit', recipient: null });
    expect(preview).toContain('Esikatselu — tätä ei ole lähetetty Kiinteistömaailmalle.');
    expect(preview).toContain('https://www.muuttokone.fi/hallinta/raportit');
    expect(html).not.toContain('Esikatselu');
    expect(partnerReportSubject(report, true)).toMatch(/^\[Esikatselu – ei lähetetty\]/);
    expect(partnerReportSubject(report, false)).toBe('Muuttokone.fi – välityspalkkioraportti lokakuu 2026 (Kiinteistömaailma)');
  });

  it('CSV: BOM, puolipisteet, desimaalipilkku, yhteensä-rivi', () => {
    const lines = csv.split('\r\n');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines[0]).toContain('Muuttopäivä;Kirjattu toteutuneeksi;Koodi;Toimipaikka;Välittäjä;Asiakas;');
    expect(lines[1]).toBe('14.10.2026;15.10.2026;KIINTEISTOMAAILMA;;;P. P.;796,81;1000,00;5;39,84');
    expect(lines[3]).toBe('Yhteensä lokakuu 2026;;;;;1 muuttoa;796,81;1000,00;;39,84');
    expect(partnerReportCsvFilename(report)).toBe('muuttokone-valityspalkkio-kiinteistomaailma-2026-10.csv');
  });

  it('tyhjä kuukausi: "ei muuttoja tällä jaksolla"', () => {
    const empty = buildPartnerReport({ partner: 'Kiinteistömaailma', year: 2026, month: 9, leads: [withContactInfo] });
    expect(empty.totals.count).toBe(0);
    expect(renderPartnerReportHtml(empty, null)).toContain('Ei toteutuneita muuttoja tällä jaksolla (syyskuu 2026)');
  });
});
