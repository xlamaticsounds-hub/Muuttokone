import { describe, expect, it } from 'vitest';
import { TEAM_HELSINKI, TEAM_TAMPERE, kmFromBasesOfAddress, suggestTeamId, teamLabel } from './teams';

describe('kmFromBasesOfAddress', () => {
  it('kunnan nimestä, myös ruotsiksi ja entisillä nimillä', () => {
    expect(kmFromBasesOfAddress('Hämeenkatu 1, 33100 Tampere')).toEqual({ helsinki: 180, tampere: 10 });
    expect(kmFromBasesOfAddress('Kauppakatu 5, Nokia, Finland')?.tampere).toBe(25);
    expect(kmFromBasesOfAddress('Mannerheimintie 1, 00100 Helsingfors')?.helsinki).toBe(10);
    expect(kmFromBasesOfAddress('Kauppakatu 1, Vammala')?.tampere).toBe(65);
    expect(kmFromBasesOfAddress('Kirkkokatu 1, Oulu')?.helsinki).toBe(Infinity);
  });

  it('kadunnimi ei ole kunta: viimeinen tunnettu kunta ratkaisee', () => {
    expect(kmFromBasesOfAddress('Tampereentie 5, Helsinki')?.helsinki).toBe(10);
    expect(kmFromBasesOfAddress('Helsinginkatu 3, Tampere')?.tampere).toBe(10);
  });

  it('postinumerosta vain Uusimaa (00–09) ja Tampereen seutu (33–37)', () => {
    expect(kmFromBasesOfAddress('Jokukatu 1, 00500')?.helsinki).toBeLessThanOrEqual(100);
    expect(kmFromBasesOfAddress('Jokukatu 1, 04400')?.helsinki).toBeLessThanOrEqual(100);
    expect(kmFromBasesOfAddress('Jokukatu 1, 33720')?.tampere).toBeLessThanOrEqual(100);
    expect(kmFromBasesOfAddress('Jokukatu 1, 38700')).toBeNull();
    expect(kmFromBasesOfAddress('Jokukatu 1, 20100')).toBeNull();
  });

  it('tuntematon', () => {
    expect(kmFromBasesOfAddress('Jokukatu 1')).toBeNull();
    expect(kmFromBasesOfAddress('Constructor 1')).toBeNull();
    expect(kmFromBasesOfAddress(null)).toBeNull();
  });
});

describe('suggestTeamId', () => {
  it('pääkaupunkiseutu Helsingille', () => {
    expect(suggestTeamId({ fromAddress: 'Kamppi, Helsinki', toAddress: 'Tapiola, Espoo' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Tikkurilantie 1, Vantaa', toAddress: 'Kauniaistentie 2, Kauniainen' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Jokukatu 1, 00500', toAddress: 'Toinenkatu 2, 02100' })).toBe(TEAM_HELSINKI);
  });

  it('kaupunginosa tai kauppakeskus ilman kuntaa', () => {
    expect(suggestTeamId({ fromAddress: 'Picnic Columbus Vuosaari', toAddress: 'Tripla' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Pohjois-Haaga', toAddress: 'Sello' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Tikkurila', toAddress: 'Etu-Töölö' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Hervanta', toAddress: 'Ideapark' })).toBe(TEAM_TAMPERE);
    // Kunta osoitteen lopussa ratkaisee kaupunginosan sijaan
    expect(kmFromBasesOfAddress('Kallio, Hanko')?.helsinki).toBe(120);
  });

  it('alle 100 km tukikohdasta sen tiimille', () => {
    expect(suggestTeamId({ fromAddress: 'Hervannan valtaväylä 1, Tampere', toAddress: 'Pirkkalantie 3, Pirkkala' })).toBe(TEAM_TAMPERE);
    expect(suggestTeamId({ fromAddress: 'Katu 1, Porvoo', toAddress: 'Tie 2, Hyvinkää' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Katu 1, Valkeakoski', toAddress: 'Tie 2, Virrat' })).toBe(TEAM_TAMPERE);
    expect(suggestTeamId({ fromAddress: 'Helsinki', toAddress: 'Lohja' })).toBe(TEAM_HELSINKI);
  });

  it('molempien säteellä lähemmälle', () => {
    expect(suggestTeamId({ fromAddress: 'Katu 1, Hämeenlinna', toAddress: 'Tie 2, Janakkala' })).toBe(TEAM_TAMPERE);
    expect(suggestTeamId({ fromAddress: 'Katu 1, Riihimäki', toAddress: 'Tie 2, Riihimäki' })).toBe(TEAM_HELSINKI);
  });

  it('kaikkien osoitteiden pitää olla saman tiimin säteellä', () => {
    // Helsinki 10 km ja Hämeenlinna 100 km Helsingistä: Helsinki. Tampereelta Helsinki on liian kaukana.
    expect(suggestTeamId({ fromAddress: 'Helsinki', toAddress: 'Hämeenlinna' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Tampere', toAddress: 'Helsinki' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Espoo', toAddress: 'Oulu' })).toBeNull();
  });

  it('yli 100 km kummastakin tukikohdasta jää avoimeksi', () => {
    expect(suggestTeamId({ fromAddress: 'Aurakatu 1, Turku', toAddress: null })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Aleksanterinkatu 1, Lahti', toAddress: 'Lahti' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Yrjönkatu 1, Pori', toAddress: 'Pori' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Kirkkokatu 1, 90100 Oulu', toAddress: 'Oulu' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Kauppakatu 1, Hanko', toAddress: 'Hanko' })).toBeNull();
  });

  it('yksi osoite (esim. laatikkotilaus) riittää', () => {
    expect(suggestTeamId({ fromAddress: 'Satakunnankatu 10, 33210 Tampere', toAddress: '' })).toBe(TEAM_TAMPERE);
  });

  it('tuntematon tai puuttuva osoite jää jakamattomaksi', () => {
    expect(suggestTeamId({ fromAddress: 'Jokukatu 1', toAddress: 'Tampere' })).toBeNull();
    expect(suggestTeamId({ fromAddress: null, toAddress: null })).toBeNull();
  });

  it('tiimin nimi', () => {
    expect(teamLabel('tampere')).toBe('Tampere');
    expect(teamLabel(null)).toBe('Ei tiimiä');
  });
});
