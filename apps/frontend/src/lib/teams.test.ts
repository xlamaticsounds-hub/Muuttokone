import { describe, expect, it } from 'vitest';
import { TEAM_HELSINKI, TEAM_TAMPERE, baseOfAddress, suggestTeamId, teamLabel } from './teams';

describe('baseOfAddress', () => {
  it('lähin tukikohta kunnan mukaan', () => {
    expect(baseOfAddress('Hämeenkatu 1, 33100 Tampere')).toBe('tampere');
    expect(baseOfAddress('Kauppakatu 5, Nokia, Finland')).toBe('tampere');
    expect(baseOfAddress('Ylöjärventie 2, Ylöjärvi')).toBe('tampere');
    expect(baseOfAddress('Raatihuoneenkatu 1, Hämeenlinna')).toBe('tampere');
    expect(baseOfAddress('Yrjönkatu 1, Pori')).toBe('tampere');
    expect(baseOfAddress('Kauppakatu 1, Vammala')).toBe('tampere');
    expect(baseOfAddress('Mannerheimintie 1, 00100 Helsinki')).toBe('helsinki');
    expect(baseOfAddress('Aleksanterinkatu 1, Lahti')).toBe('helsinki');
    expect(baseOfAddress('Kirkkokatu 1, Oulu')).toBe('helsinki');
    // Turku on yhtä kaukana: tasapelissä Helsinki
    expect(baseOfAddress('Turuntie 10, Turku')).toBe('helsinki');
  });

  it('kadunnimi ei ratkaise kuntaa', () => {
    expect(baseOfAddress('Tampereentie 5, Helsinki')).toBe('helsinki');
    expect(baseOfAddress('Helsinginkatu 3, Tampere')).toBe('tampere');
  });

  it('postinumero, kun kuntaa ei tunnisteta', () => {
    expect(baseOfAddress('Jokukatu 1, 33720')).toBe('tampere');
    expect(baseOfAddress('Jokukatu 1, 00500')).toBe('helsinki');
    // 38xxx–39xxx sekoittuu Satakuntaan: ei arvata
    expect(baseOfAddress('Jokukatu 1, 38700')).toBeNull();
  });

  it('tuntematon tai tyhjä', () => {
    expect(baseOfAddress('Jokukatu 1')).toBeNull();
    expect(baseOfAddress(null)).toBeNull();
  });
});

describe('suggestTeamId', () => {
  it('Pirkanmaan sisäinen muutto Tampereelle', () => {
    expect(suggestTeamId({ fromAddress: 'Hervannan valtaväylä 1, Tampere', toAddress: 'Pirkkalantie 3, Pirkkala' })).toBe(TEAM_TAMPERE);
  });

  it('lähempänä Tamperetta myös Pirkanmaan ulkopuolella', () => {
    expect(suggestTeamId({ fromAddress: 'Katu 1, Hämeenlinna', toAddress: 'Tie 2, Hattula' })).toBe(TEAM_TAMPERE);
  });

  it('lähempänä Helsinkiä Helsingille', () => {
    expect(suggestTeamId({ fromAddress: 'Kamppi, Helsinki', toAddress: 'Tapiola, Espoo' })).toBe(TEAM_HELSINKI);
    expect(suggestTeamId({ fromAddress: 'Aurakatu 1, Turku', toAddress: null })).toBe(TEAM_HELSINKI);
  });

  it('yksi Pirkanmaan osoite (esim. laatikkotilaus) Tampereelle', () => {
    expect(suggestTeamId({ fromAddress: 'Satakunnankatu 10, 33210 Tampere', toAddress: '' })).toBe(TEAM_TAMPERE);
  });

  it('alueiden välinen, tuntematon tai puuttuva osoite jää jakamattomaksi', () => {
    expect(suggestTeamId({ fromAddress: 'Tampere', toAddress: 'Helsinki' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Hämeenlinna', toAddress: 'Helsinki' })).toBeNull();
    expect(suggestTeamId({ fromAddress: 'Jokukatu 1', toAddress: 'Tampere' })).toBeNull();
    expect(suggestTeamId({ fromAddress: null, toAddress: null })).toBeNull();
  });

  it('tiimin nimi', () => {
    expect(teamLabel('tampere')).toBe('Tampere');
    expect(teamLabel(null)).toBe('Ei tiimiä');
  });
});
