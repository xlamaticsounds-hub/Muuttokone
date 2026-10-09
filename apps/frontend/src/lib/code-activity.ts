import type { LeadStatus } from '@prisma/client';
import { computeCommission } from '@/features/calculator/discount';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { LEAD_STATUS_LABELS } from '@/lib/lead-status';
import { customerInitials } from '@/lib/partner-report';
import { formatDateInputFi } from '@/lib/partner-report-render';

// Yhden alennuskoodin tapahtumat (/hallinta/raportit?nakyma=tapahtumat): kaikki koodilla tehdyt
// varaukset tiloineen ja toteutuneiden myynti/palkkio. Puhdas laskenta ilman tietokantaa.

export type CodeActivityLeadInput = {
  id: string;
  status: LeadStatus;
  createdAt: Date;
  requestedDate: Date | null;
  completedAt: Date | null;
  finalPrice: number | null;
  priceAfterDiscount: number | null;
  commissionPercent: number | null;
  discountCodeId: string | null;
  contact: { firstName: string | null; lastName: string | null };
};

export type CodeActivityRow = {
  leadId: string;
  createdDate: string; // YYYY-MM-DD Suomen aikaa (varaus tehty)
  moveDate: string | null;
  completedDate: string | null;
  status: LeadStatus;
  statusLabel: string;
  customerName: string; // vain hallintaan — CSV:hen pelkät nimikirjaimet
  initials: string;
  estimate: number | null; // alennettu hinta-arvio € sis. alv
  finalPriceGross: number | null;
  finalPriceNet: number | null;
  commissionPercent: number;
  commissionAmount: number | null; // vain toteutuneille
};

export type CodeActivitySummary = {
  total: number;
  open: number; // uusi, varaus, yhteydenotto, tarjous
  confirmed: number; // vahvistettu, ei vielä toteutunut
  completed: number;
  cancelledOrLost: number; // peruttu, hävitty, arkistoitu
  salesGross: number; // toteutuneet € sis. alv
  salesNet: number; // toteutuneet € alv 0 %
  commission: number; // toteutuneiden palkkio € alv 0 %
};

const OPEN: LeadStatus[] = ['NEW', 'SCHEDULED', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT'];
const ENDED: LeadStatus[] = ['CANCELLED', 'LOST', 'ARCHIVED'];
const roundCents = (value: number) => Math.round(value * 100) / 100;

export function buildCodeActivity(params: {
  codeId: string;
  defaultCommissionPercent: number;
  leads: CodeActivityLeadInput[];
}): { rows: CodeActivityRow[]; summary: CodeActivitySummary } {
  const rows = params.leads
    .filter((lead) => lead.discountCodeId === params.codeId)
    .map((lead): CodeActivityRow => {
      const commissionPercent = lead.commissionPercent ?? params.defaultCommissionPercent;
      const completed = lead.status === 'COMPLETED' && typeof lead.finalPrice === 'number' && lead.finalPrice > 0;
      const commission = completed ? computeCommission(lead.finalPrice!, commissionPercent) : null;
      return {
        leadId: lead.id,
        createdDate: toHelsinkiDateInput(lead.createdAt),
        moveDate: lead.requestedDate ? toHelsinkiDateInput(lead.requestedDate) : null,
        completedDate: lead.status === 'COMPLETED' && lead.completedAt ? toHelsinkiDateInput(lead.completedAt) : null,
        status: lead.status,
        statusLabel: LEAD_STATUS_LABELS[lead.status] ?? lead.status,
        customerName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || '–',
        initials: customerInitials(lead.contact.firstName, lead.contact.lastName),
        estimate: typeof lead.priceAfterDiscount === 'number' ? lead.priceAfterDiscount : null,
        finalPriceGross: completed ? roundCents(lead.finalPrice!) : null,
        finalPriceNet: commission?.finalPriceNet ?? null,
        commissionPercent,
        commissionAmount: commission?.commissionAmount ?? null,
      };
    })
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

  const completedRows = rows.filter((r) => r.commissionAmount !== null);
  return {
    rows,
    summary: {
      total: rows.length,
      open: rows.filter((r) => OPEN.includes(r.status)).length,
      confirmed: rows.filter((r) => r.status === 'WON').length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
      cancelledOrLost: rows.filter((r) => ENDED.includes(r.status)).length,
      salesGross: roundCents(completedRows.reduce((s, r) => s + (r.finalPriceGross ?? 0), 0)),
      salesNet: roundCents(completedRows.reduce((s, r) => s + (r.finalPriceNet ?? 0), 0)),
      commission: roundCents(completedRows.reduce((s, r) => s + (r.commissionAmount ?? 0), 0)),
    },
  };
}

const csvNumber = (value: number | null) => (value === null ? '' : value.toFixed(2).replace('.', ','));
const csvField = (value: string) => (/[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** Koodin tapahtumat CSV:nä (Excel). Asiakkaasta vain nimikirjaimet, kuten kumppaniraportissa. */
export function codeActivityCsv(code: string, rows: CodeActivityRow[], summary: CodeActivitySummary): string {
  const lines: string[][] = [
    [
      'Varaus tehty',
      'Muuttopäivä',
      'Tila',
      'Kirjattu toteutuneeksi',
      'Asiakas',
      'Hinta-arvio sis. alv (€)',
      'Lopullinen hinta alv 0 % (€)',
      'Lopullinen hinta sis. alv (€)',
      'Palkkio %',
      'Välityspalkkio alv 0 % (€)',
    ],
    ...rows.map((r) => [
      formatDateInputFi(r.createdDate),
      formatDateInputFi(r.moveDate),
      r.statusLabel,
      r.completedDate ? formatDateInputFi(r.completedDate) : '',
      r.initials,
      csvNumber(r.estimate),
      csvNumber(r.finalPriceNet),
      csvNumber(r.finalPriceGross),
      String(r.commissionPercent).replace('.', ','),
      csvNumber(r.commissionAmount),
    ]),
    [],
    [
      `Yhteensä ${code}`,
      '',
      `${summary.total} varausta, ${summary.completed} toteutunut`,
      '',
      '',
      '',
      csvNumber(summary.salesNet),
      csvNumber(summary.salesGross),
      '',
      csvNumber(summary.commission),
    ],
  ];
  return '﻿' + lines.map((line) => line.map(csvField).join(';')).join('\r\n') + '\r\n';
}

export function codeActivityCsvFilename(code: string, now: Date = new Date()): string {
  return `muuttokone-koodi-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${toHelsinkiDateInput(now)}.csv`;
}
