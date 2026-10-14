'use client';

// Muuttolaatikoiden tarjousikkuna: avautuu kerran heti tavaralistan jälkeen, kun asiakas on
// ilmoittanut tavaroita eikä ole jo valinnut laatikkovuokraa. Hinnoittelu tulee boxRental.ts:stä,
// joten ikkuna, laatikkokortti, hinta-arvio ja Discord-ilmoitus näyttävät aina saman hinnan.

import React, { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BOX_RENTAL, calculateBoxRental, formatEuro } from './boxRental';
import RentalDaysSlider from '@/features/vuokraus/RentalDaysSlider';
import { useT } from '@/i18n/useT';
import { calculatorDictionary } from '@/i18n/calculatorDictionary';

type Props = {
  initialCount: number;
  initialDays: number;
  /** Mistä valmiiksi täytetty määrä tulee: tavaralistan laatikoista vai asunnon koon suosituksesta. */
  countSource: 'list' | 'size';
  onAdd: (count: number, days: number) => void;
  /** "Ei kiitos": jatketaan hinta-arvioon ilman laatikoita. */
  onDecline: () => void;
  /** Ruksi, Esc tai taustan klikkaus: suljetaan ja pysytään tavaralistassa. */
  onClose: () => void;
};

const clampCount = (n: number) => Math.min(BOX_RENTAL.maxBoxes, Math.max(BOX_RENTAL.minBoxes, Math.round(n) || 0));
const clampDays = (n: number) => Math.min(BOX_RENTAL.maxDays, Math.max(BOX_RENTAL.minDays, Math.round(n) || 0));

export default function BoxRentalOfferModal({ initialCount, initialDays, countSource, onAdd, onDecline, onClose }: Props) {
  const t = useT(calculatorDictionary);
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const countInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const [count, setCount] = useState(() => clampCount(initialCount));
  const [countText, setCountText] = useState(() => String(clampCount(initialCount)));
  const [days, setDays] = useState(() => clampDays(initialDays));
  const preview = calculateBoxRental({ count, days, withMove: true });

  // Kohdistus ikkunaan, sivun vierityksen esto, Esc-näppäin ja Tab-näppäimen pitäminen ikkunassa.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    countInputRef.current?.focus();
    countInputRef.current?.select();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const setCountValue = (next: number) => {
    setCount(next);
    setCountText(String(next));
  };

  // Kenttään saa kirjoittaa vapaasti. Hinta päivittyy heti kun luku on sallittu, ja
  // kentästä poistuttaessa luku rajataan sallitulle välille.
  const handleCountInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    setCountText(digits);
    const n = Number(digits);
    if (digits && n >= BOX_RENTAL.minBoxes) setCount(Math.min(n, BOX_RENTAL.maxBoxes));
  };
  const committedCount = () => (countText ? clampCount(Number(countText)) : count);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8 dark:bg-gray-900"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Sulje')}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pr-8">
          <p className="mb-2 text-3xl" aria-hidden="true">
            📦
          </p>
          <h2 id={titleId} className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
            {t('Tarvitsetko muuttolaatikoita?')}
          </h2>
          <p id={descId} className="mt-1.5 text-sm text-gray-500">
            {countSource === 'list'
              ? t('Määrä on valittu valmiiksi tavaralistasi mukaan. Voit muuttaa sitä.')
              : t('Määrä on valittu valmiiksi asuntosi koon mukaan. Voit muuttaa sitä.')}
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="box-offer-count" className="mb-2 block text-xs font-bold uppercase text-gray-400">
            {t('Montako laatikkoa?')}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCountValue(clampCount(count - BOX_RENTAL.boxStep))}
              disabled={count <= BOX_RENTAL.minBoxes}
              aria-label={t('Vähennä laatikoita')}
              className="hover:border-primary hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold transition-all disabled:opacity-30 dark:border-gray-700"
            >
              -
            </button>
            <input
              id="box-offer-count"
              ref={countInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={countText}
              onChange={(e) => handleCountInput(e.target.value)}
              onBlur={() => setCountValue(committedCount())}
              className="focus:ring-primary w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-center font-bold outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => setCountValue(clampCount(count + BOX_RENTAL.boxStep))}
              disabled={count >= BOX_RENTAL.maxBoxes}
              aria-label={t('Lisää laatikoita')}
              className="hover:border-primary hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold transition-all disabled:opacity-30 dark:border-gray-700"
            >
              +
            </button>
            <span className="text-sm text-gray-500">{t('kpl')}</span>
          </div>
        </div>

        <div className="mb-6">
          <RentalDaysSlider
            id="box-offer-days"
            label={t('Vuokra-aika')}
            unit={t('vrk')}
            value={days}
            min={BOX_RENTAL.minDays}
            max={BOX_RENTAL.maxDays}
            onChange={setDays}
          />
        </div>

        {preview && (
          <div className="mb-6 space-y-2 rounded-xl border border-primary/20 p-4 text-sm" aria-live="polite">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                {preview.count} {t('kpl')} × {preview.days} {t('vrk')} ×{' '}
                {preview.ratePerBoxPerDay.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
              </span>
              <span className="whitespace-nowrap font-bold">{formatEuro(preview.rentalCost)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">{t('Toimitus ja nouto kotiovelle')}</span>
              <span className={`whitespace-nowrap font-bold ${preview.deliveryFree ? 'text-green-600' : ''}`}>
                {preview.deliveryFree ? t('Ilmainen') : formatEuro(preview.deliveryCost)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-100 pt-2 font-bold dark:border-gray-800">
              <span>{t('Laatikot yhteensä')}</span>
              <span className="whitespace-nowrap">{formatEuro(preview.total)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-xl px-6 py-3.5 font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {t('Ei kiitos')}
          </button>
          <button
            type="button"
            onClick={() => onAdd(committedCount(), days)}
            className="bg-primary hover:bg-primary/90 flex-1 rounded-xl px-6 py-3.5 font-bold text-white transition-colors"
          >
            {t('Lisää tilaukseen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
