// Kuvaliitteiden tarkistus. Tyyppi tunnistetaan tiedoston alusta eikä selaimen ilmoittamasta
// tyypistä, jotta palvelin tallentaa ja näyttää vain oikeita kuvia. SVG ei kelpaa, koska se voi
// sisältää skriptiä.

export type SniffedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_REQUEST = 8;
export const MAX_ATTACHMENTS_PER_LEAD = 30;

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

export function sniffImageType(bytes: Uint8Array): SniffedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return 'image/png';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const EXTENSIONS: Record<SniffedImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Siisti tiedostonimi tallennukseen ja latausotsakkeeseen: vain turvalliset merkit ja oikea pääte. */
export function safeImageName(name: string | null | undefined, type: SniffedImageType): string {
  const base = (name ?? '')
    .replace(/\.[a-zA-Z0-9]{1,5}$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'kuva'}.${EXTENSIONS[type]}`;
}
