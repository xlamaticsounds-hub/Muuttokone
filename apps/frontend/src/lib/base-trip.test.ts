import { describe, expect, it } from 'vitest';
import { baseTripAdvice, baseTripCharge, baseTripSummary, cityFromAddress, leadBaseTripAdvice, BASE_TRIP_MIN_SURCHARGE } from './base-trip';

describe('cityFromAddress', () => {
  it('poimii kunnan Googlen osoitemuodosta', () => {
    expect(cityFromAddress('Aleksis Kiven katu 47b 32, Helsinki, Finland')?.name).toBe('Helsinki');
    expect(cityFromAddress('Kuokkalankuja 3, Hämeenlinna, Suomi')?.name).toBe('Hämeenlinna');
    expect(cityFromAddress('Keskuskatu 1, 02140 Espoo, Finland')?.name).toBe('Espoo');
    expect(cityFromAddress('Hamina')?.name).toBe('Hamina');
  });

  it('kadunnimi ei laukaise osumaa (Hämeenlinnantie ≠ Hämeenlinna)', () => {
    expect(cityFromAddress('Hämeenlinnantie 5, Vantaa, Finland')?.name).toBe('Vantaa');
    expect(cityFromAddress('Hämeenlinnantie 5')).toBeNull();
  });

  it('palauttaa null kun kuntaa ei löydy tai osoite puuttuu', () => {
    expect(cityFromAddress('Larin kyöstin katu 31')).toBeNull();
    expect(cityFromAddress('Heinjoenpolku 2 S 132, 02140')).toBeNull();
    expect(cityFromAddress('')).toBeNull();
    expect(cityFromAddress(null)).toBeNull();
    // Objektin perimät avaimet eivät ole kuntia
    expect(cityFromAddress('constructor')).toBeNull();
  });
});

describe('baseTripAdvice', () => {
  it('paikallinen muutto kaukana tukikohdasta: ehdottaa lisää', () => {
    const hamina = baseTripAdvice({ fromAddress: 'Kauppakatu 1, Hamina', toAddress: 'Torikatu 2, Hamina', distanceKm: 5 });
    // 150 + 150 − 5 − 30 = 265 km tyhjää ajoa → × 1,38 €/km ≈ 365 €, × 1,88 €/km ≈ 500 € (sis. ALV)
    expect(hamina).toMatchObject({ fromCity: 'Hamina', toCity: 'Hamina', extraEmptyKm: 265, surcharge: 365, surchargeCrew3: 500, includedInPrice: null });

    const hameenlinna = baseTripAdvice({ fromAddress: 'Hämeenlinna', toAddress: 'Hämeenlinna', distanceKm: 5 });
    expect(hameenlinna?.extraEmptyKm).toBe(165);
    expect(hameenlinna?.surcharge).toBe(230);
    expect(hameenlinna?.surchargeCrew3).toBe(310);

    const riihimaki = baseTripAdvice({ fromAddress: 'Riihimäki', toAddress: 'Riihimäki', distanceKm: 5 });
    expect(riihimaki?.surcharge).toBe(145);
  });

  it('pitkä muutto jonka toinen pää on lähellä tukikohtaa: ei lisää (paluuajo on jo hinnassa)', () => {
    // Tampere → Helsinki 180 km: 180 + 10 − 180 − 30 < 0
    expect(baseTripAdvice({ fromAddress: 'Tampere', toAddress: 'Helsinki', distanceKm: 180 })).toBeNull();
    // Vantaa → Hämeenlinna: laskurin etäisyyshaku epäonnistui ja jäi oletukseen 5 km — kolmioepäyhtälö estää väärän varoituksen
    expect(baseTripAdvice({ fromAddress: 'Vantaa', toAddress: 'Hämeenlinna', distanceKm: 5 })).toBeNull();
    expect(baseTripAdvice({ fromAddress: 'Vantaa', toAddress: 'Hämeenlinna', distanceKm: 95 })).toBeNull();
  });

  it('kaksi kaukaista eri kuntaa: veloitetaan vain muuton oman matkan ylittävä tyhjä ajo', () => {
    // Tampere → Turku (155 km): 180 + 165 − 155 − 30 = 160 km
    const advice = baseTripAdvice({ fromAddress: 'Tampere', toAddress: 'Turku', distanceKm: 155 });
    expect(advice?.extraEmptyKm).toBe(160);
    expect(advice?.surcharge).toBe(220);
  });

  it('pääkaupunkiseudun muutot eivät saa varoitusta', () => {
    expect(baseTripAdvice({ fromAddress: 'Helsinki', toAddress: 'Espoo', distanceKm: 20 })).toBeNull();
    expect(baseTripAdvice({ fromAddress: 'Vantaa', toAddress: 'Vantaa', distanceKm: 5 })).toBeNull();
  });

  it('lievästi kaukana: Järvenpää ylittää rajan 3 hengellä, Kerava ei', () => {
    // 40 + 40 − 5 − 30 = 45 km → 1–2 hengellä 60 € (< raja), 3 hengellä 85 €
    expect(BASE_TRIP_MIN_SURCHARGE).toBe(75);
    expect(baseTripAdvice({ fromAddress: 'Järvenpää', toAddress: 'Järvenpää', distanceKm: 5 })).toMatchObject({ surcharge: 60, surchargeCrew3: 85 });
    // 30 + 30 − 5 − 30 = 25 km → 45 €
    expect(baseTripAdvice({ fromAddress: 'Kerava', toAddress: 'Kerava', distanceKm: 5 })).toBeNull();
  });

  it('ilman tunnettua etäisyyttä arvioidaan vain saman kunnan sisäinen muutto', () => {
    expect(baseTripAdvice({ fromAddress: 'Kouvola', toAddress: 'Kouvola' })?.surcharge).toBe(325);
    expect(baseTripAdvice({ fromAddress: 'Lahti', toAddress: 'Tampere' })).toBeNull();
  });

  it('baseTripCharge: 3 hengen hinta muutolle, 1–2 hengen hinta muille, alle rajan ei veloitusta', () => {
    expect(baseTripCharge({ fromAddress: 'Hamina', toAddress: 'Hamina', distanceKm: 5, crew3: true })?.surcharge).toBe(500);
    expect(baseTripCharge({ fromAddress: 'Hamina', toAddress: 'Hamina', distanceKm: 5, crew3: false })?.surcharge).toBe(365);
    expect(baseTripCharge({ fromAddress: 'Järvenpää', toAddress: 'Järvenpää', distanceKm: 5, crew3: true })?.surcharge).toBe(85);
    expect(baseTripCharge({ fromAddress: 'Järvenpää', toAddress: 'Järvenpää', distanceKm: 5, crew3: false })).toBeNull();
    expect(baseTripCharge({ fromAddress: 'Helsinki', toAddress: 'Espoo', distanceKm: 20, crew3: true })).toBeNull();
  });

  it('tuntematon kunta tai puuttuva osoite: ei arviota', () => {
    expect(baseTripAdvice({ fromAddress: 'Joku katu 1', toAddress: 'Hamina', distanceKm: 5 })).toBeNull();
    expect(baseTripAdvice({ fromAddress: 'Hamina', toAddress: null, distanceKm: 5 })).toBeNull();
  });
});

describe('leadBaseTripAdvice', () => {
  it('lukee etäisyyden formDatasta (objekti tai JSON-merkkijono)', () => {
    const lead = { fromAddress: 'A, Kouvola, Finland', toAddress: 'B, Kouvola, Finland' };
    expect(leadBaseTripAdvice({ ...lead, formData: { distanceKm: 5, serviceType: 'moving' } })?.surcharge).toBe(325);
    expect(leadBaseTripAdvice({ ...lead, formData: JSON.stringify({ distanceKm: 5 }) })?.surcharge).toBe(325);
  });

  it('ohittaa vuokraukset, työavun ja rikkinäisen formDatan ei kaada', () => {
    const lead = { fromAddress: 'Hamina', toAddress: 'Hamina' };
    expect(leadBaseTripAdvice({ ...lead, formData: { serviceType: 'vuokraus', distanceKm: 5 } })).toBeNull();
    expect(leadBaseTripAdvice({ ...lead, formData: { payload: { service_type: 'tyoapu' } } })).toBeNull();
    expect(leadBaseTripAdvice({ ...lead, formData: '{ei json' })?.surcharge).toBe(365);
    expect(leadBaseTripAdvice({ ...lead, formData: null })?.surcharge).toBe(365);
  });

  it('laskurin hintaan sisältynyt lisä luetaan formDatasta', () => {
    const lead = { fromAddress: 'Hamina', toAddress: 'Hamina' };
    expect(leadBaseTripAdvice({ ...lead, formData: { distanceKm: 5, baseTripSurcharge: 500 } })?.includedInPrice).toBe(500);
    expect(leadBaseTripAdvice({ ...lead, formData: { distanceKm: 5 } })?.includedInPrice).toBeNull();
  });
});

describe('baseTripSummary', () => {
  it('kertoo tyhjän ajon ja ehdotetun lisän', () => {
    const advice = baseTripAdvice({ fromAddress: 'Hamina', toAddress: 'Hamina', distanceKm: 5 })!;
    const text = baseTripSummary(advice);
    expect(text).toContain('265 km');
    expect(text).toContain('Hamina');
    expect(text).toMatch(/noin 365[\s ]€/);
    expect(text).toMatch(/noin 500[\s ]€/);
  });

  it('kertoo, kun lisä on jo laskurin hinnassa', () => {
    const advice = { ...baseTripAdvice({ fromAddress: 'Hamina', toAddress: 'Hamina', distanceKm: 5 })!, includedInPrice: 500 };
    const text = baseTripSummary(advice);
    expect(text).toMatch(/Tukikohtalisä 500[\s ]€ sisältyy laskurin hintaan/);
    expect(text).not.toContain('Ehdotettu');
  });
});
