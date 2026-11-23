import { describe, expect, it } from 'vitest';
import { generateTempPassword, hashPassword, normalizeTempPassword, passwordProblem, safeEqual, verifyPassword, verifyUserPassword } from './password';

describe('salasanat', () => {
  it('tiiviste tarkistuu oikealla salasanalla eikä väärällä', async () => {
    const hash = await hashPassword('pitkä ja hyvä salasana');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('pitkä');
    expect(await verifyPassword('pitkä ja hyvä salasana', hash)).toBe(true);
    expect(await verifyPassword('pitkä ja hyvä salasanA', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('sama salasana saa eri suolan', async () => {
    expect(await hashPassword('samasalasana1')).not.toBe(await hashPassword('samasalasana1'));
  });

  it('virheellinen tai puuttuva tiiviste ei kelpaa', async () => {
    expect(await verifyPassword('mitä tahansa', null)).toBe(false);
    expect(await verifyPassword('mitä tahansa', 'bcrypt$jotain')).toBe(false);
    expect(await verifyPassword('mitä tahansa', 'scrypt$x$y$z$a$b')).toBe(false);
  });

  it('uuden salasanan vaatimukset', () => {
    expect(passwordProblem('lyhyt')).toMatch(/vähintään/);
    expect(passwordProblem('          ')).not.toBeNull();
    expect(passwordProblem('kymmenenmerkkiä')).toBeNull();
  });

  it('väliaikainen salasana on luettava ja satunnainen', () => {
    const a = generateTempPassword();
    expect(a).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(a).not.toMatch(/[01ilo]/);
    expect(generateTempPassword()).not.toBe(a);
  });

  it('puhelimen muokkaama väliaikainen salasana palautuu oikeaan muotoon', () => {
    expect(normalizeTempPassword('K7mp-x3qa-9fhd')).toBe('k7mp-x3qa-9fhd');
    expect(normalizeTempPassword('k7mp x3qa 9fhd ')).toBe('k7mp-x3qa-9fhd');
    expect(normalizeTempPassword('k7mp–x3qa—9fhd')).toBe('k7mp-x3qa-9fhd');
    expect(normalizeTempPassword('k7mpx3qa9fhd')).toBe('k7mp-x3qa-9fhd');
    expect(normalizeTempPassword('oma pitkä salasana')).toBeNull();
    expect(normalizeTempPassword('k7mp-x3qa-9fh')).toBeNull();
  });

  it('väliaikainen kelpaa muokattuna vain vaihtopakon aikana, oma salasana vain tarkalleen', async () => {
    const temp = await hashPassword('k7mp-x3qa-9fhd');
    expect(await verifyUserPassword('K7MP X3QA 9FHD', { passwordHash: temp, mustChangePassword: true })).toBe(true);
    expect(await verifyUserPassword('K7MP X3QA 9FHD', { passwordHash: temp, mustChangePassword: false })).toBe(false);
    expect(await verifyUserPassword('k7mp-x3qa-9fhe', { passwordHash: temp, mustChangePassword: true })).toBe(false);
    const own = await hashPassword('Oma Salasana 1');
    expect(await verifyUserPassword('oma salasana 1', { passwordHash: own, mustChangePassword: false })).toBe(false);
  });

  it('safeEqual', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
