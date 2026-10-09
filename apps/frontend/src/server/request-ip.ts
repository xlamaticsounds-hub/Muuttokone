// Asiakkaan IP rajoituksia varten. Railwayn reunapalvelin LISÄÄ todellisen IP:n x-forwarded-for-
// listan perään — listan alkupää on asiakkaan itse asetettavissa, joten vasemmanpuoleisin arvo
// on väärennettävissä. Luetaan siksi oikealta ensimmäinen julkinen osoite (sisäverkon välityspalvelimet
// ohitetaan).

const PRIVATE_V4 = [/^10\./, /^127\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^169\.254\./];

export function isPrivateIp(ip: string): boolean {
  const v = ip.replace(/^::ffff:/i, '');
  if (v === '::1' || /^f[cd][0-9a-f]{2}:/i.test(v) || /^fe80:/i.test(v)) return true;
  return PRIVATE_V4.some((re) => re.test(v));
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  for (let i = forwarded.length - 1; i >= 0; i--) {
    if (!isPrivateIp(forwarded[i])) return forwarded[i];
  }
  return headers.get('x-real-ip')?.trim() || forwarded[0] || null;
}
