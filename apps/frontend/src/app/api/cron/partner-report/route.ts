import { NextRequest, NextResponse } from 'next/server';
import { runMonthlyPartnerReports } from '@/server/partner-reports';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Ajastettu reitti (ks. repon juuren .github/workflows/partner-report-cron.yaml, joka kutsuu
 * tätä kuun 1. päivänä). Luo edellisen kalenterikuukauden välityspalkkioraportin jokaiselle
 * kumppanille ja lähettää esikatselun VAIN meille — kumppanille raportti lähtee vasta kun se
 * hyväksytään hallinnassa (/hallinta/raportit). Suojattu CRON_SECRET:illä.
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
    return NextResponse.json(await runMonthlyPartnerReports());
  } catch (error) {
    console.error('[cron/partner-report] Ajo epäonnistui', error);
    return NextResponse.json({ error: 'Raporttien luonti epäonnistui.' }, { status: 500 });
  }
}
