import { describe, expect, it } from 'vitest';
import { generateTempPassword, hashPassword, passwordProblem, safeEqual, verifyPassword } from './password';

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

  it('safeEqual', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
