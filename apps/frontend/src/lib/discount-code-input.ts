import { normalizeDiscountCode } from '@/features/calculator/discount';
import { helsinkiDayEnd, helsinkiDayStart } from '@/lib/helsinki-time';

// Hallinnan alennuskoodilomakkeen tarkistus (/hallinta/raportit?nakyma=koodit). Puhdas funktio, jotta
// sama tarkistus on testattavissa ja server action (discount-code-actions.ts) luottaa vain tähän.

export type DiscountCodeFormValues = {
  code: string;
  partner: string;
  office: string;
  agentName: string;
  discountPercent: string;
  commissionPercent: string;
  active: boolean;
  validFrom: string; // "YYYY-MM-DD" tai tyhjä
  validUntil: string;
};

export type ParsedDiscountCode = {
  code: string;
  partner: string;
  office: string | null;
  agentName: string | null;
  discountPercent: number;
  commissionPercent: number;
  active: boolean;
  validFrom: Date | null; // päivän alku Suomen aikaa
  validUntil: Date | null; // päivän loppu Suomen aikaa (koodi toimii koko viimeisen päivän)
};

const CODE_RE = /^[A-Z0-9_-]{3,40}$/; // normalizeDiscountCode on jo muuttanut ääkköset (Ö -> O)
const MAX_TEXT = 80;

function parsePercent(raw: string): number | null {
  const cleaned = String(raw ?? '').replace(/[\s%]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}

function optionalText(raw: string): string | null {
  const value = String(raw ?? '').trim();
  return value ? value : null;
}

export function parseDiscountCodeInput(
  values: DiscountCodeFormValues,
): { ok: true; data: ParsedDiscountCode } | { ok: false; message: string } {
  const code = normalizeDiscountCode(values.code);
  if (!CODE_RE.test(code)) {
    return { ok: false, message: 'Koodissa pitää olla 3–40 merkkiä: kirjaimia, numeroita, väliviivoja tai alaviivoja.' };
  }

  const partner = String(values.partner ?? '').trim();
  if (!partner) return { ok: false, message: 'Kumppanin nimi puuttuu.' };

  const office = optionalText(values.office);
  const agentName = optionalText(values.agentName);
  if ([partner, office, agentName].some((t) => t && t.length > MAX_TEXT)) {
    return { ok: false, message: `Nimet saavat olla enintään ${MAX_TEXT} merkkiä.` };
  }

  const discountPercent = parsePercent(values.discountPercent);
  if (discountPercent === null || discountPercent <= 0 || discountPercent > 50) {
    return { ok: false, message: 'Alennuksen pitää olla 0,01–50 %.' };
  }
  const commissionPercent = parsePercent(values.commissionPercent);
  if (commissionPercent === null || commissionPercent > 50) {
    return { ok: false, message: 'Palkkion pitää olla 0–50 %.' };
  }

  const validFrom = values.validFrom ? helsinkiDayStart(values.validFrom) : null;
  const validUntil = values.validUntil ? helsinkiDayEnd(values.validUntil) : null;
  if ((values.validFrom && !validFrom) || (values.validUntil && !validUntil)) {
    return { ok: false, message: 'Päivämäärä on virheellinen.' };
  }
  if (validFrom && validUntil && validUntil < validFrom) {
    return { ok: false, message: 'Voimassaolon loppu ei voi olla ennen alkua.' };
  }

  return {
    ok: true,
    data: {
      code,
      partner,
      office,
      agentName,
      discountPercent,
      commissionPercent,
      active: Boolean(values.active),
      validFrom,
      validUntil,
    },
  };
}
