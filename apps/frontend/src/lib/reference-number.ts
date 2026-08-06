// Suomalainen viitenumeron tarkistusnumero — painot 7-3-1 oikealta lukien.
// Lasketaan aina laskun juoksevasta numerosta, ei tallenneta erikseen (ei drift-riskiä).
export function generateViitenumero(invoiceNumber: number): string {
  const digits = String(invoiceNumber).split('').reverse();
  const weights = [7, 3, 1];
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i % 3], 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${invoiceNumber}${checkDigit}`;
}
