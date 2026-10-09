'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { discountLabel, type PartnerDiscount } from './discount';

// Kumppanin alennuskoodi muuttolaskurissa (esim. Kiinteistömaailma). Koodi tarkistetaan aina
// palvelimella (/api/discount-code); laskuri näyttää alennuksen saadulla prosentilla, ja
// palvelin laskee hinnan vielä kerran uudelleen kun varaus lähetetään (api/submit).

export type AppliedPartnerCode = { code: string; partner: string; discountPercent: number };

// Koodi muistetaan selainistunnon ajan, jotta ?koodi=-linkillä tullut asiakas ei menetä etua
// vaikka selaisi välillä muita sivuja ennen laskuria.
const STORAGE_KEY = 'muuttokone:alennuskoodi';
const CHECK_FAILED_MESSAGE = 'Koodin tarkistus epäonnistui. Yritä hetken päästä uudelleen.';

function readStoredCode(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeCode(code: string | null) {
  try {
    if (code) window.sessionStorage.setItem(STORAGE_KEY, code);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ei istuntomuistia (esim. yksityinen selaus) — koodi toimii silti tällä sivulatauksella
  }
}

export function partnerLabel(applied: AppliedPartnerCode, locale: string): string {
  return locale === 'en'
    ? `${applied.partner} discount -${applied.discountPercent} %`
    : discountLabel(applied.partner, applied.discountPercent);
}

/** urlCode = ?koodi=-parametri; täyttää kentän ja tarkistaa koodin heti. */
export function usePartnerDiscountCode(urlCode: string | null) {
  const [input, setInput] = useState('');
  const [applied, setApplied] = useState<AppliedPartnerCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const latestRequest = useRef(0);

  const apply = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code) {
      setError('Syötä alennuskoodi.');
      return;
    }
    const requestId = ++latestRequest.current;
    setChecking(true);
    setError(null);
    try {
      const response = await fetch('/api/discount-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json().catch(() => null);
      if (requestId !== latestRequest.current) return;
      if (response.ok && result?.valid) {
        setApplied({ code: result.code, partner: result.partner, discountPercent: result.discountPercent });
        setInput(result.code);
        storeCode(result.code);
      } else if (response.ok) {
        // Palvelin vastasi varmasti: koodi ei kelpaa
        setApplied(null);
        setError(typeof result?.message === 'string' ? result.message : CHECK_FAILED_MESSAGE);
        storeCode(null);
      } else {
        // Hetkellinen virhe (429/503): jo hyväksyttyä tai tallennettua koodia ei poisteta
        setError(typeof result?.message === 'string' ? result.message : CHECK_FAILED_MESSAGE);
      }
    } catch {
      if (requestId === latestRequest.current) setError(CHECK_FAILED_MESSAGE);
    } finally {
      if (requestId === latestRequest.current) setChecking(false);
    }
  }, []);

  const remove = useCallback(() => {
    latestRequest.current++;
    setApplied(null);
    setInput('');
    setError(null);
    setChecking(false);
    storeCode(null);
  }, []);

  const changeInput = useCallback((value: string) => {
    setInput(value);
    setError(null);
  }, []);

  useEffect(() => {
    const initial = urlCode?.trim() || readStoredCode();
    if (initial) {
      setInput(initial);
      void apply(initial);
    }
  }, [urlCode, apply]);

  return { input, applied, error, checking, apply, remove, changeInput };
}

type DiscountCodeFieldProps = {
  state: ReturnType<typeof usePartnerDiscountCode>;
  discount: PartnerDiscount | null;
  hasAddOns: boolean; // muuttosiivous / laatikkovuokra / jätemaksut — etu ei koske niitä
  locale: string;
  t: (fi: string) => string;
};

export function DiscountCodeField({ state, discount, hasAddOns, locale, t }: DiscountCodeFieldProps) {
  const { input, applied, error, checking, apply, remove, changeInput } = state;

  if (applied && discount) {
    const label = partnerLabel(applied, locale);
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5 dark:border-green-900/40 dark:bg-green-900/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-green-800 dark:text-green-300">🏠 {label}</p>
            <p className="text-xs text-green-700/80 dark:text-green-400/80 break-all">
              {t('Alennuskoodi')} {applied.code}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="shrink-0 text-sm font-semibold text-green-800 underline underline-offset-2 hover:text-green-900 dark:text-green-300"
          >
            {t('Poista')}
          </button>
        </div>
        <div className="mt-3 grid gap-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-300">{t('Hinta ilman etua')}</span>
            <span className="font-semibold text-gray-500 line-through">{discount.priceBeforeDiscount} €</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-green-800 dark:text-green-300">{label}</span>
            <span className="font-bold text-green-700 dark:text-green-300">-{discount.discountAmount} €</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-green-200 pt-1.5 dark:border-green-900/40">
            <span className="font-semibold">{t('Hinta edun jälkeen')}</span>
            <span className="font-bold">{discount.priceAfterDiscount} €</span>
          </div>
        </div>
        {hasAddOns && (
          <p className="mt-2 text-xs text-green-800/80 dark:text-green-300/80">
            {t('Etu koskee muuttoa. Muuttosiivous, laatikkovuokra ja kierrätysmaksut hinnoitellaan ilman etua.')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 sm:p-5 dark:border-gray-700">
      <label htmlFor="partner-discount-code" className="mb-2 block text-sm font-semibold">
        {t('Alennuskoodi')}
      </label>
      <div className="flex gap-2">
        <input
          id="partner-discount-code"
          type="text"
          value={input}
          onChange={(e) => changeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void apply(input);
            }
          }}
          placeholder={t('Esim. kiinteistönvälittäjältä saatu koodi')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={64}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'partner-discount-code-error' : undefined}
          className="h-12 min-w-0 flex-1 rounded-xl border border-gray-200 px-4 uppercase outline-none placeholder:normal-case focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800"
        />
        <button
          type="button"
          onClick={() => void apply(input)}
          disabled={checking || !input.trim()}
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-black px-5 font-bold text-white transition-opacity disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {checking ? <Loader2 className="h-5 w-5 animate-spin" aria-label={t('Tarkistetaan...')} /> : t('Käytä')}
        </button>
      </div>
      {error && (
        <p id="partner-discount-code-error" role="alert" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          {t(error)}
        </p>
      )}
    </div>
  );
}
