import { describe, expect, it } from 'vitest';
import { dedupeMessages, isPlatformJobSubject, leadMailSearchKeys, speakerLabel, streetSearchKey } from './mail-search';

describe('streetSearchKey', () => {
  it('poimii kadun ja talonumeron', () => {
    expect(streetSearchKey('Viholankatu 12 A11, 37120 Nokia')).toBe('Viholankatu 12');
    expect(streetSearchKey('Mannerheimintie 94 B51, 00250 Helsinki')).toBe('Mannerheimintie 94');
    expect(streetSearchKey('Aleksis Kiven katu 47b 32, Helsinki, Finland')).toBe('Aleksis Kiven katu 47');
    expect(streetSearchKey('Larin kyöstin katu 31')).toBe('Larin kyöstin katu 31');
  });

  it('palauttaa null kun osoitteessa ei ole talonumeroa tai se puuttuu', () => {
    expect(streetSearchKey('Helsinki')).toBeNull();
    expect(streetSearchKey('Helsinki 00100')).toBeNull(); // postinumero ei ole talonumero
    expect(streetSearchKey('')).toBeNull();
    expect(streetSearchKey(null)).toBeNull();
    expect(streetSearchKey(undefined)).toBeNull();
  });
});

describe('leadMailSearchKeys', () => {
  it('kokoaa sähköpostin ja uniikit katuosoitteet', () => {
    expect(
      leadMailSearchKeys({ fromAddress: 'Viholankatu 12 A11, Nokia', toAddress: 'Mannerheimintie 94, Helsinki', contact: { email: ' a@b.fi ' } }),
    ).toEqual({ email: 'a@b.fi', streets: ['Viholankatu 12', 'Mannerheimintie 94'] });
    expect(leadMailSearchKeys({ fromAddress: 'Katu 5, Espoo', toAddress: 'Katu 5, Vantaa', contact: null })).toEqual({ email: null, streets: [] }); // "Katu 5" liian lyhyt
    expect(leadMailSearchKeys({ fromAddress: 'Pitkäkatu 5, Espoo', toAddress: 'Pitkäkatu 5, Vantaa' }).streets).toEqual(['Pitkäkatu 5']);
  });

  it('ilman tietoja palauttaa tyhjän', () => {
    expect(leadMailSearchKeys({})).toEqual({ email: null, streets: [] });
    expect(leadMailSearchKeys({ contact: { email: '   ' } })).toEqual({ email: null, streets: [] });
  });
});

describe('isPlatformJobSubject', () => {
  it('tunnistaa keikkakohtaiset Muuttomaailma-viestit', () => {
    expect(isPlatformJobSubject('Muuttotarjous: Nokia - Helsinki (#342212), Matti M.')).toBe(true);
    expect(isPlatformJobSubject('Uusi muuttokeikka! Matti Meikäläinen / Helsinki - Helsinki')).toBe(true);
    expect(isPlatformJobSubject('Re: Muuttotarjous: Nokia - Helsinki (#342212), Matti M.')).toBe(true);
  });

  it('ohittaa päiväkoosteet ja muut', () => {
    expect(isPlatformJobSubject('Kooste uusimmista muuttotarjouspyynnöistä')).toBe(false);
    expect(isPlatformJobSubject('Yhteenveto tapahtumistasi')).toBe(false);
    expect(isPlatformJobSubject('')).toBe(false);
    expect(isPlatformJobSubject(null)).toBe(false);
  });
});

describe('dedupeMessages ja speakerLabel', () => {
  it('poistaa saman Message-ID:n kaksoiskappaleet postilaatikoiden väliltä', () => {
    const d = new Date('2026-10-20T10:00:00Z');
    const items = [
      { messageId: '<a@x>', date: d, subject: 'Tarjous', direction: 'outbound' as const },
      { messageId: '<a@x>', date: d, subject: 'Tarjous', direction: 'outbound' as const },
      { messageId: null, date: d, subject: 'Kysymys', direction: 'inbound' as const },
      { messageId: null, date: d, subject: 'Kysymys', direction: 'inbound' as const },
      { messageId: null, date: d, subject: 'Kysymys', direction: 'outbound' as const },
    ];
    expect(dedupeMessages(items)).toHaveLength(3);
  });

  it('nimeää puhujat', () => {
    expect(speakerLabel('inbound')).toBe('Asiakas');
    expect(speakerLabel('outbound')).toBe('Muuttokone.fi');
    expect(speakerLabel('platform')).toContain('Muuttomaailma');
  });
});
