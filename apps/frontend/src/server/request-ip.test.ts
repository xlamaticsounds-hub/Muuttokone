import { describe, expect, it } from 'vitest';
import { clientIpFromHeaders, isPrivateIp } from './request-ip';

const h = (init: Record<string, string>) => new Headers(init);

describe('clientIpFromHeaders', () => {
  it('ottaa x-forwarded-for-listan oikeanpuoleisimman julkisen osoitteen (Railwayn lisäämä)', () => {
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '1.2.3.4, 203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('asiakkaan väärentämä alkupää ei vaikuta', () => {
    const a = clientIpFromHeaders(h({ 'x-forwarded-for': '9.9.9.1, 203.0.113.9' }));
    const b = clientIpFromHeaders(h({ 'x-forwarded-for': '9.9.9.2, 203.0.113.9' }));
    expect(a).toBe(b);
  });

  it('ohittaa sisäverkon välityspalvelimet listan lopussa', () => {
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '203.0.113.9, 10.0.0.5, 100.64.1.2' }))).toBe('203.0.113.9');
  });

  it('varalla x-real-ip ja lopuksi ensimmäinen arvo', () => {
    expect(clientIpFromHeaders(h({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '10.0.0.1' }))).toBe('10.0.0.1');
    expect(clientIpFromHeaders(h({}))).toBeNull();
  });

  it('tunnistaa yksityiset osoitteet', () => {
    for (const ip of ['10.1.2.3', '127.0.0.1', '192.168.1.1', '172.20.10.12', '100.100.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) {
      expect(isPrivateIp(ip)).toBe(true);
    }
    for (const ip of ['203.0.113.9', '172.32.0.1', '100.128.0.1', '2001:db8::1']) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });
});
