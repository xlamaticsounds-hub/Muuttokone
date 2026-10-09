'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '@/server/actions';
import { computeCommission } from '@/features/calculator/discount';
import { formatEuro } from '@/lib/format';
import { formatHelsinkiDate } from '@/lib/helsinki-time';
import CompleteLeadDialog from '../CompleteLeadDialog';
import type { CompleteLeadTarget } from '../complete-target';

export type PartnerInfo = {
  partner: string;
  code: string;
  office: string | null;
  agentName: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  priceBeforeDiscount: number | null;
  priceAfterDiscount: number | null;
  commissionPercent: number | null;
};

// Liidin sivun ylin kortti: kumppanikoodi (jos on) ja muuton toteutuminen. Palkkio maksetaan
// vain toteutuneista, joten "Merkitse toteutuneeksi" on tämän sivun tärkein toiminto —
// siksi se on heti otsikon alla myös puhelimella eikä oikean palstan lopussa.
export default function LeadCompletionCard({
  leadId,
  status,
  completedAt,
  finalPrice,
  partner,
  completeTarget,
  reportedIn = [],
}: {
  leadId: string;
  status: LeadStatus;
  completedAt: string | null;
  finalPrice: number | null;
  partner: PartnerInfo | null;
  completeTarget: CompleteLeadTarget;
  reportedIn?: string[]; // lähetetyt kumppaniraportit joissa muutto on, esim. "Kiinteistömaailma syyskuu 2026"
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (next: LeadStatus, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      await updateLeadStatus(leadId, next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tilan vaihto epäonnistui.');
    } finally {
      setBusy(false);
    }
  };

  const commission =
    status === 'COMPLETED' && finalPrice != null && partner?.commissionPercent != null
      ? computeCommission(finalPrice, partner.commissionPercent)
      : null;

  const secondaryButton =
    'h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700';

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-800">
      {partner && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-900/20 dark:text-green-200">
          <p className="font-bold">
            🏠 {partner.partner}-koodi <span className="font-mono">{partner.code}</span>
          </p>
          <p className="mt-0.5">
            {partner.discountPercent !== null && <>Asiakkaalle -{partner.discountPercent} %</>}
            {partner.discountAmount != null && partner.priceBeforeDiscount != null && partner.priceAfterDiscount != null && (
              <> ({partner.priceBeforeDiscount} € - {partner.discountAmount} € = {partner.priceAfterDiscount} €)</>
            )}
            {partner.commissionPercent !== null && <> · palkkio {partner.commissionPercent} % toteutuneesta</>}
          </p>
          {(partner.office || partner.agentName) && (
            <p className="mt-0.5 text-xs opacity-80">{[partner.office, partner.agentName].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      )}

      {status === 'COMPLETED' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-300">
              ✅ Toteutunut{completedAt ? ` ${formatHelsinkiDate(new Date(completedAt))}` : ''}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Lopullinen hinta <strong>{finalPrice != null ? `${formatEuro(finalPrice)} €` : '-'}</strong> sis. alv
            </p>
            {commission && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {partner?.partner} palkkio {formatEuro(commission.commissionAmount)} € (alv 0 % hinnasta {formatEuro(commission.finalPriceNet)} €)
              </p>
            )}
            {reportedIn.length > 0 && (
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                📨 Mukana lähetetyssä raportissa: {reportedIn.join(', ')}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => setDialogOpen(true)} disabled={busy} className={secondaryButton}>
              Korjaa hinta
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                changeStatus(
                  'WON',
                  reportedIn.length > 0
                    ? `Tämä muutto on jo lähetetyssä raportissa (${reportedIn.join(', ')}) ja palkkio on laskutettu. Kumotaanko silti? Jos merkitset sen myöhemmin uudelleen toteutuneeksi, se pysyy alkuperäisessä kuussa.`
                    : 'Kumotaanko toteutuminen? Liidi palaa tilaan Vahvistettu eikä näy kuukausiraportissa.',
                )
              }
              className={secondaryButton}
            >
              Kumoa
            </button>
          </div>
        </div>
      ) : status === 'CANCELLED' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-orange-700 dark:text-orange-300">Muutto on peruttu</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('WON', 'Palautetaanko liidi tilaan Vahvistettu?')}
            className={secondaryButton}
          >
            Palauta vahvistetuksi
          </button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={busy}
            className="h-12 rounded-xl bg-emerald-600 px-5 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            ✅ Merkitse toteutuneeksi
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('CANCELLED', 'Merkitäänkö muutto perutuksi? Mahdollinen kalenterimerkintä poistetaan.')}
            className={secondaryButton}
          >
            Merkitse perutuksi
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {dialogOpen && (
        <CompleteLeadDialog
          target={completeTarget}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
