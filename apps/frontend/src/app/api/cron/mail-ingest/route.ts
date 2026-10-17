import { NextRequest, NextResponse } from 'next/server';
import { runMailCycle } from '@/server/mail-cycle';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Ajastettu reitti (.github/workflows/mail-ingest-cron.yaml): AI lukee tarjous@- ja info@-postilaatikot
 * ja päivittää liidien tiloja / luo ehdotuksia. Suojattu CRON_SECRET:illä kuten muut cron-reitit.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET ei ole määritetty palvelimelle.' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runMailCycle('cron');
    if (!result.ran) return NextResponse.json({ skipped: result.reason }, { status: 202 });
    const { record } = result;
    return NextResponse.json(record, { status: record.errors.length > 0 && record.scanned === 0 ? 502 : 200 });
  } catch (error) {
    console.error('[cron/mail-ingest] Ajo epäonnistui', error);
    return NextResponse.json({ error: 'Ajo epäonnistui.' }, { status: 500 });
  }
}
