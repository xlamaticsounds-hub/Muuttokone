import { computeCommission } from '@/features/calculator/discount';
import { helsinkiMonthRange, toHelsinkiDateInput } from '@/lib/helsinki-time';

// Kumppanin kuukausiraportti (välityspalkkio). Puhdas laskenta ilman tietokantaa: palvelin
// (server/partner-reports.ts) hakee ehdokasliidit ja tallentaa tämän tuloksen sellaisenaan
// PartnerReport.data-kenttään, jotta hyväksyntä lähettää täsmälleen esikatsellun version.
//
// Mukaan VAIN: kumppanin koodilla tehty, tila COMPLETED ja completedAt kyseisellä
// kalenterikuukaudella Suomen aikaa. Tietosuoja: kumppanille ei jaeta puhelinnumeroita,
// sähköposteja eikä osoitteita — asiakkaasta vain nimikirjaimet.

export const FI_MONTHS = [
  'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
  'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu',
];

export function periodLabel(year: number, month: number): string {
  return `${FI_MONTHS[month - 1]} ${year}`;
}

/** Raportin ehdokasliidi (Lead + kontaktin nimi + koodin tiedot). */
export type PartnerReportLeadInput = {
  id: string;
  status: string;
  completedAt: Date | null;
  requestedDate: Date | null;
  finalPrice: number | null;
  discountCode: string | null;
  commissionPercent: number | null; // varaushetken palkkio-%
  // Varaushetken kumppani/toimipaikka/välittäjä. Puuttuessa (vanha liidi) käytetään koodin
  // nykyisiä tietoja (discount).
  discountPartner?: string | null;
  discountOffice?: string | null;
  discountAgentName?: string | null;
  contact: { firstName: string | null; lastName: string | null };
  discount: { partner: string; office: string | null; agentName: string | null; commissionPercent: number } | null;
};

/** Kumppani, toimipaikka ja välittäjä varaushetken tiedoista (tai koodin nykytiedoista). */
export function partnerInfoOf(lead: Pick<PartnerReportLeadInput, 'discountPartner' | 'discountOffice' | 'discountAgentName' | 'discount'>) {
  if (lead.discountPartner) {
    return { partner: lead.discountPartner, office: lead.discountOffice ?? null, agentName: lead.discountAgentName ?? null };
  }
  return lead.discount
    ? { partner: lead.discount.partner, office: lead.discount.office, agentName: lead.discount.agentName }
    : null;
}

export type PartnerReportRow = {
  leadId: string; // vain hallinnan linkkiä varten — ei sähköpostiin eikä CSV:hen
  moveDate: string | null; // YYYY-MM-DD Suomen aikaa
  completedDate: string; // YYYY-MM-DD Suomen aikaa
  code: string;
  office: string | null;
  agentName: string | null;
  initials: string;
  finalPriceGross: number; // € sis. alv
  finalPriceNet: number; // € alv 0 %
  commissionPercent: number;
  commissionAmount: number; // € alv 0 %
};

export type PartnerReportTotals = { count: number; salesGross: number; salesNet: number; commission: number };

export type PartnerReportGroup = { label: string; rows: PartnerReportRow[]; totals: PartnerReportTotals };

export type PartnerReportData = {
  partner: string;
  year: number;
  month: number;
  periodLabel: string; // "lokakuu 2026"
  generatedAt: string; // ISO
  grouped: boolean; // useampi koodi -> ryhmittely koodeittain (välisummat)
  groups: PartnerReportGroup[];
  totals: PartnerReportTotals;
};

const roundCents = (value: number) => Math.round(value * 100) / 100;

/** "Matti Meikäläinen" -> "M. M.", "Liisa" -> "L.", ei nimeä -> "–" */
export function customerInitials(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName]
    .flatMap((part) => (part ?? '').trim().split(/\s+/))
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}.`);
  return parts.length > 0 ? parts.join(' ') : '–';
}

export function totalsOf(rows: PartnerReportRow[]): PartnerReportTotals {
  return {
    count: rows.length,
    salesGross: roundCents(rows.reduce((sum, r) => sum + r.finalPriceGross, 0)),
    salesNet: roundCents(rows.reduce((sum, r) => sum + r.finalPriceNet, 0)),
    commission: roundCents(rows.reduce((sum, r) => sum + r.commissionAmount, 0)),
  };
}

function groupLabel(row: PartnerReportRow): string {
  const details = [row.office, row.agentName].filter(Boolean).join(' / ');
  return details ? `${row.code} (${details})` : row.code;
}

export function buildPartnerReport(params: {
  partner: string;
  year: number;
  month: number;
  leads: PartnerReportLeadInput[];
  now?: Date;
}): PartnerReportData {
  const { partner, year, month, leads, now = new Date() } = params;
  const { start, end } = helsinkiMonthRange(year, month);

  const rows: PartnerReportRow[] = leads
    .filter(
      (lead) =>
        lead.status === 'COMPLETED' &&
        Boolean(lead.discountCode) &&
        partnerInfoOf(lead)?.partner === partner &&
        lead.completedAt instanceof Date &&
        lead.completedAt >= start &&
        lead.completedAt < end &&
        typeof lead.finalPrice === 'number' &&
        lead.finalPrice > 0,
    )
    .map((lead) => {
      const info = partnerInfoOf(lead)!;
      const commissionPercent = lead.commissionPercent ?? lead.discount?.commissionPercent ?? 0;
      const { finalPriceNet, commissionAmount } = computeCommission(lead.finalPrice!, commissionPercent);
      return {
        leadId: lead.id,
        moveDate: lead.requestedDate ? toHelsinkiDateInput(lead.requestedDate) : null,
        completedDate: toHelsinkiDateInput(lead.completedAt!),
        code: lead.discountCode!,
        office: info.office,
        agentName: info.agentName,
        initials: customerInitials(lead.contact.firstName, lead.contact.lastName),
        finalPriceGross: roundCents(lead.finalPrice!),
        finalPriceNet,
        commissionPercent,
        commissionAmount,
      };
    })
    .sort((a, b) => (a.moveDate ?? a.completedDate).localeCompare(b.moveDate ?? b.completedDate));

  const byLabel = new Map<string, PartnerReportRow[]>();
  for (const row of rows) {
    const label = groupLabel(row);
    byLabel.set(label, [...(byLabel.get(label) ?? []), row]);
  }
  const groups = [...byLabel.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'fi'))
    .map(([label, groupRows]) => ({ label, rows: groupRows, totals: totalsOf(groupRows) }));

  return {
    partner,
    year,
    month,
    periodLabel: periodLabel(year, month),
    generatedAt: now.toISOString(),
    grouped: groups.length > 1,
    groups,
    totals: totalsOf(rows),
  };
}
