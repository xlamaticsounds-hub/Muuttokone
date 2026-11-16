import { NextRequest, NextResponse } from 'next/server';
import { sendDueReviewRequests } from '@/server/review-requests';

export const runtime = 'nodejs';

/**
 * Ajastettu reitti (ks. repon juuren .github/workflows/review-requests-cron.yaml, joka kutsuu tätä
 * aamuisin). Lähettää arvostelupyynnön eilen toteutuneiden keikkojen asiakkaille, jos se on
 * otettu käyttöön hallinnan asetuksissa. Suojattu CRON_SECRET:illä, ei käyttäjäsessiolla.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET ei ole määritetty palvelimelle.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendDueReviewRequests();
    return NextResponse.json(result, { status: result.failed > 0 ? 207 : 200 });
  } catch (error) {
    console.error('[cron/review-requests] Ajo epäonnistui', error);
    return NextResponse.json({ error: 'Arvostelupyyntöjen lähetys epäonnistui.' }, { status: 500 });
  }
}
