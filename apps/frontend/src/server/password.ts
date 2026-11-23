// Hallinnan käyttäjien salasanat: scrypt (Noden sisäänrakennettu, ei lisäriippuvuuksia) + satunnainen suola.
// Tallennusmuoto: "scrypt$N$r$p$suola(base64)$tiiviste(base64)", jotta parametreja voi myöhemmin kasvattaa
// ilman että vanhat salasanat lakkaavat toimimasta.

import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 200;

function derive(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !password) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  try {
    const key = await derive(password, Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** Virheilmoitus uudelle salasanalle, tai null jos kelpaa. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Salasanan pitää olla vähintään ${MIN_PASSWORD_LENGTH} merkkiä.`;
  if (password.length > MAX_PASSWORD_LENGTH) return 'Salasana on liian pitkä.';
  if (!password.trim()) return 'Salasana ei voi olla pelkkiä välilyöntejä.';
  return null;
}

// Ei sekoittuvia merkkejä (0/o, 1/l/i), jotta väliaikaisen salasanan voi sanella puhelimessa.
const TEMP_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Väliaikainen salasana muotoa "k7mp-x3qa-9fhd" (12 satunnaismerkkiä, noin 59 bittiä). */
export function generateTempPassword(): string {
  const group = () => Array.from({ length: 4 }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join('');
  return [group(), group(), group()].join('-');
}

/**
 * Puhelimella kirjoitettu väliaikainen salasana takaisin muotoon "k7mp-x3qa-9fhd": näppäimistö voi
 * aloittaa isolla kirjaimella, ja viivan tilalla voi olla välilyönti, ajatusviiva tai ei mitään.
 * null, jos syöte ei ole väliaikaisen salasanan muotoinen.
 */
export function normalizeTempPassword(input: string): string | null {
  const compact = input.toLowerCase().replace(/[\s\-\u2010-\u2015\u2212]/g, '');
  if (compact.length !== 12 || [...compact].some((c) => !TEMP_ALPHABET.includes(c))) return null;
  return [compact.slice(0, 4), compact.slice(4, 8), compact.slice(8)].join('-');
}

/** Käyttäjän salasanan tarkistus (kirjautuminen ja salasanan vaihto). */
export async function verifyUserPassword(password: string, user: { passwordHash?: string | null; mustChangePassword?: boolean }): Promise<boolean> {
  if (await verifyPassword(password, user.passwordHash)) return true;
  const temp = user.mustChangePassword ? normalizeTempPassword(password) : null;
  return Boolean(temp && temp !== password && (await verifyPassword(temp, user.passwordHash)));
}

/** Merkkijonojen vertailu vakioajassa (hätäavain). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
