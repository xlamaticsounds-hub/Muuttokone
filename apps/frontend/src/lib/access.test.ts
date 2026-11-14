import { describe, expect, it } from 'vitest';
import { NO_TEAM, canAccessPath, canAccessTeam, crewCanEditEntry, homePath, loginUrl, safeCallbackPath, scopeTeamId, teamWhere } from './access';

const owner = { role: 'OWNER' as const, teamId: null };
const elias = { role: 'TEAM_ADMIN' as const, teamId: 'tampere' };
const crew = { role: 'CREW_LEAD' as const, teamId: 'tampere' };

describe('canAccessPath', () => {
  it('omistaja pääsee kaikkialle', () => {
    for (const path of ['/hallinta/raportit', '/hallinta/kayttajat', '/hallinta/asetukset', '/hallinta/partio', '/hallinta/liidit/abc']) {
      expect(canAccessPath(owner, path)).toBe(true);
    }
  });

  it('aluevastaava: työkalut kyllä, koko yrityksen osiot ei', () => {
    for (const path of ['/hallinta/dashboard', '/hallinta/liidit', '/hallinta/liidit/abc/tarjous', '/hallinta/keikat', '/hallinta/tyoajat', '/hallinta/inventaario', '/hallinta/postilaatikko', '/hallinta/partio']) {
      expect(canAccessPath(elias, path)).toBe(true);
    }
    for (const path of ['/hallinta/raportit', '/hallinta/ennuste', '/hallinta/asetukset', '/hallinta/kayttajat', '/hallinta/blogi', '/hallinta/laskutus/1', '/hallinta/lokit', '/hallinta/galleria', '/hallinta/analytiikka', '/hallinta/alennuskoodit']) {
      expect(canAccessPath(elias, path)).toBe(false);
    }
  });

  it('partionjohtaja: vain partiosivu ja salasana', () => {
    expect(canAccessPath(crew, '/hallinta/partio')).toBe(true);
    expect(canAccessPath(crew, '/hallinta/salasana')).toBe(true);
    expect(canAccessPath(crew, '/hallinta')).toBe(true); // ohjaa etusivulle
    for (const path of ['/hallinta/dashboard', '/hallinta/liidit', '/hallinta/liidit/abc', '/hallinta/tyoajat', '/hallinta/keikat', '/hallinta/postilaatikko']) {
      expect(canAccessPath(crew, path)).toBe(false);
    }
  });

  it('samankaltainen polku ei avaa osiota', () => {
    expect(canAccessPath(crew, '/hallinta/partiot')).toBe(false);
    expect(canAccessPath(elias, '/hallinta/liiditx')).toBe(false);
  });

  it('roolin etusivu', () => {
    expect(homePath('CREW_LEAD')).toBe('/hallinta/partio');
    expect(homePath('TEAM_ADMIN')).toBe('/hallinta/dashboard');
  });
});

describe('tiimirajaus', () => {
  it('omistaja näkee kaikki, muut oman tiiminsä', () => {
    expect(scopeTeamId(owner)).toBeNull();
    expect(teamWhere(owner)).toEqual({});
    expect(teamWhere(elias)).toEqual({ teamId: 'tampere' });
    expect(canAccessTeam(owner, null)).toBe(true);
    expect(canAccessTeam(elias, 'tampere')).toBe(true);
    expect(canAccessTeam(elias, 'helsinki')).toBe(false);
    // Jakamaton (ei tiimiä) on vain omistajille
    expect(canAccessTeam(elias, null)).toBe(false);
  });

  it('tiimitön aluevastaava ei näe mitään (virheellinen asetus ei avaa kaikkea)', () => {
    const broken = { role: 'TEAM_ADMIN' as const, teamId: null };
    expect(scopeTeamId(broken)).toBe(NO_TEAM);
    expect(canAccessTeam(broken, null)).toBe(false);
    expect(canAccessTeam(broken, 'tampere')).toBe(false);
  });

  it('partionjohtajan muokkausikkuna on 7 päivää', () => {
    const now = new Date('2026-11-13T12:00:00Z');
    expect(crewCanEditEntry(new Date('2026-11-07T12:00:00Z'), now)).toBe(true);
    expect(crewCanEditEntry(new Date('2026-11-06T11:00:00Z'), now)).toBe(false);
  });
});

describe('kirjautumisen paluuosoite', () => {
  it('hyväksyy vain hallinnan sisäiset polut', () => {
    expect(safeCallbackPath('/hallinta')).toBe('/hallinta');
    expect(safeCallbackPath('/hallinta/liidit?tila=NEW')).toBe('/hallinta/liidit?tila=NEW');
    expect(safeCallbackPath('/hallinta/partio')).toBe('/hallinta/partio');
  });

  it('hylkää ulkoiset ja muut osoitteet', () => {
    for (const value of ['https://evil.example/hallinta', '//evil.example', '/hallinta//evil.example', '/hallintaxyz', '/', '/blogi', String.raw`/hallinta/\evil`, undefined, null, 42]) {
      expect(safeCallbackPath(value)).toBeNull();
    }
  });

  it('kirjautumissivun osoite', () => {
    expect(loginUrl('/hallinta/liidit')).toBe('/kirjaudu?callbackUrl=%2Fhallinta%2Fliidit');
  });
});
