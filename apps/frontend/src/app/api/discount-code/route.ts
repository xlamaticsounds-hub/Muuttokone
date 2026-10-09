import { NextRequest, NextResponse } from 'next/server';
import { lookupDiscountCode } from '@/server/discount-codes';
import { discountLabel } from '@/features/calculator/discount';
import { rateLimit } from '@/server/rate-limit';
import { clientIpFromHeaders } from '@/server/request-ip';
import { createLog } from '@/server/repo/logs';

export const runtime = 'nodejs';

// Laskurin "Käytä"-painike: tarkistaa alennuskoodin palvelimella ja palauttaa prosentin ja
// asiakkaalle näytettävän tekstin. Laskuri näyttää alennetun hinnan näillä tiedoilla, mutta
// lopullinen hinta lasketaan aina uudelleen palvelimella varausta tallennettaessa (api/submit).
// Vain epäonnistuneet yritykset rajoitetaan (koodien arvailu), oikean koodin voi tarkistaa
// uudelleen niin usein kuin laskurissa tarvitaan.
const MAX_FAILED_ATTEMPTS = 10;
const FAILED_WINDOW_MINUTES = 15;

export async function POST(request: NextRequest) {
  // IP x-forwarded-for-listan oikeasta päästä (Railwayn lisäämä), ei asiakkaan väärennettävissä.
  // Ei kaikkia koskevaa kattoa: se estäisi oikeat koodit kaikilta, jos joku arvailee.
  const ip = clientIpFromHeaders(request.headers);

  if (ip) {
    try {
      await rateLimit(ip, 'discount_code.invalid', MAX_FAILED_ATTEMPTS, FAILED_WINDOW_MINUTES);
    } catch (error) {
      return NextResponse.json(
        { valid: false, message: error instanceof Error ? error.message : 'Liikaa pyyntöjä.' },
        { status: 429 },
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, message: 'Virheellinen pyyntö.' }, { status: 400 });
  }

  try {
    const { code, record, check } = await lookupDiscountCode((body as { code?: unknown } | null)?.code);

    if (!check.ok || !record) {
      if (check.ok === false && check.reason !== 'empty') {
        await createLog({
          entityType: 'DiscountCode',
          entityId: record?.id ?? 'unknown',
          action: 'discount_code.invalid',
          message: `Alennuskoodi hylätty (${check.reason}): ${code.slice(0, 64)}`,
          ip,
        }).catch(() => {});
      }
      return NextResponse.json({ valid: false, message: check.ok ? 'Alennuskoodia ei löytynyt.' : check.message });
    }

    return NextResponse.json({
      valid: true,
      code: record.code,
      partner: record.partner,
      discountPercent: record.discountPercent,
      label: discountLabel(record.partner, record.discountPercent),
    });
  } catch (error) {
    console.error('[discount-code] Tarkistus epäonnistui', error);
    return NextResponse.json(
      { valid: false, message: 'Koodin tarkistus epäonnistui. Yritä hetken päästä uudelleen.' },
      { status: 503 },
    );
  }
}
