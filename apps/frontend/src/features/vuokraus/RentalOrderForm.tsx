'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Honeypot from '@/components/Forms/Honeypot';
import GdprConsentCheckbox from '@/components/Forms/GdprConsentCheckbox';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import {
  RENTAL_DELIVERY,
  calculateRentalOrder,
  describeRentalOrder,
  formatEuro,
  formatPricePerDay,
  getAvailableRentalItems,
  isDeliveryAreaPostalCode,
  type RentalItem,
} from './rental';

const inputClass =
  'focus:ring-primary focus:border-primary w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:outline-hidden dark:border-gray-700 dark:bg-black dark:text-white';
const labelClass = 'mb-2 block text-sm font-medium text-black dark:text-white';
const chipClass = (active: boolean) =>
  `rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-all ${
    active
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-gray-200 text-gray-700 hover:border-primary dark:border-gray-700 dark:text-gray-200'
  }`;

const TIME_WINDOWS = [
  { value: '', label: 'Ei väliä' },
  { value: '08:00', label: 'Aamupäivä (8–12)' },
  { value: '12:00', label: 'Iltapäivä (12–17)' },
  { value: '17:00', label: 'Ilta (17–20)' },
];

const EARLIEST_DELIVERY_DAYS = 2; // aikaisin toimituspäivä: tänään + 2 vrk

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (isoDate: string, days: number) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d + days);
};
const formatDate = (d: Date) => d.toLocaleDateString('fi-FI');

export default function RentalOrderForm() {
  const siteConfig = useSiteConfig();
  const items = useMemo(() => getAvailableRentalItems(), []);

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.selectedByDefault])),
  );
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(items.map((i) => [i.id, i.qty.default])));
  const [days, setDays] = useState<Record<string, number>>(() => Object.fromEntries(items.map((i) => [i.id, i.days.default])));
  const [withMove, setWithMove] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    date: '',
    window: '',
    message: '',
  });
  const [minDate, setMinDate] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ total: number; lines: string[] } | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Lomake korvautuu lyhyemmällä vahvistuskortilla: tuodaan se näkyviin, ettei se jää ruudun ulkopuolelle.
  useEffect(() => {
    if (submitted) doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [submitted]);

  // Aikaisin toimituspäivä lasketaan vasta selaimessa (ei SSR/hydraatio-eroa vuorokauden vaihteessa).
  useEffect(() => {
    setMinDate(toIsoDate(addDays(toIsoDate(new Date()), EARLIEST_DELIVERY_DAYS)));
  }, []);

  const order = useMemo(
    () =>
      calculateRentalOrder(
        items.filter((i) => selected[i.id]).map((i) => ({ itemId: i.id, qty: qty[i.id], days: days[i.id] })),
        { withMove },
      ),
    [items, selected, qty, days, withMove],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clampQty = (item: RentalItem, n: number) => Math.min(item.qty.max, Math.max(item.qty.min, Math.round(n) || 0));
  const setItemQty = (item: RentalItem, n: number) => setQty((prev) => ({ ...prev, [item.id]: n }));
  const stepItemQty = (item: RentalItem, delta: number) =>
    setQty((prev) => ({ ...prev, [item.id]: clampQty(item, (prev[item.id] || 0) + delta) }));
  const toggleItem = (item: RentalItem) => {
    setSelected((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    setQty((prev) => (prev[item.id] >= item.qty.min ? prev : { ...prev, [item.id]: item.qty.default }));
  };

  const postalCode = form.postalCode.trim();
  const postalChecked = /^\d{5}$/.test(postalCode);
  const outsideArea = postalChecked && !isDeliveryAreaPostalCode(postalCode);

  const longestDays = order ? Math.max(...order.lines.map((l) => l.days)) : 0;
  const pickupEstimate = form.date && order ? addDays(form.date, longestDays) : null;

  // Vihje ilmaiseen toimitukseen: paljonko vuokraa puuttuu ja mitä se on ensimmäisen valitun rivin kappaleina
  const freeDeliveryHint = (() => {
    if (!order || order.deliveryFree || order.amountToFreeDelivery <= 0) return null;
    const line = order.lines[0];
    const moreUnits = Math.ceil(order.amountToFreeDelivery / (line.days * line.pricePerDay) - 1e-9);
    return { amount: order.amountToFreeDelivery, moreUnits, title: line.title.toLowerCase() };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) {
      toast.error('Valitse vähintään yksi tuote');
      return;
    }
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 6) {
      toast.error('Nimi ja puhelinnumero ovat pakollisia');
      return;
    }
    if (!form.address.trim() || !postalChecked || !form.date) {
      toast.error('Toimitusosoite, postinumero (5 numeroa) ja toimituspäivä ovat pakollisia');
      return;
    }
    if (minDate && form.date < minDate) {
      toast.error(`Aikaisin mahdollinen toimituspäivä on ${formatDate(addDays(minDate, 0))}`);
      return;
    }
    if (!gdprConsent) {
      toast.error('Hyväksy tietojen käsittely jatkaaksesi');
      return;
    }

    const windowLabel = TIME_WINDOWS.find((w) => w.value === form.window)?.label;
    const summary = [
      'Vuokraus',
      ...describeRentalOrder(order),
      `Toimitus: ${formatDate(addDays(form.date, 0))}${form.window && windowLabel ? ` (${windowLabel})` : ''} · nouto noin ${formatDate(addDays(form.date, longestDays))}`,
      `Osoite: ${form.address.trim()}, ${postalCode}${outsideArea ? ' (pk-seudun ulkopuolella – sovittava erikseen)' : ''}`,
      `Muuton yhteydessä: ${withMove ? 'kyllä (tarkistettava)' : 'ei'}`,
      form.message.trim() ? `Lisätiedot: ${form.message.trim()}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n');

    const boxLine = order.lines.find((l) => l.itemId === 'muuttolaatikot');

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name: form.name,
            phone: form.phone,
            email: form.email || null,
            from_location: `${form.address.trim()}, ${postalCode}`,
            moving_date: form.date,
            preferred_time: form.window || undefined,
            message: summary,
            service_type: 'vuokraus',
            source: 'website',
            box_count: boxLine?.qty,
            price: order.total,
            rental: {
              items: order.lines.map((l) => ({ id: l.itemId, title: l.title, qty: l.qty, days: l.days })),
              withMove,
              rentalCost: order.rentalCost,
              deliveryCost: order.deliveryCost,
              total: order.total,
              pickupEstimate: toIsoDate(addDays(form.date, longestDays)),
            },
            gdpr_consent: gdprConsent,
            company: honeypot,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Kiitos! Vahvistamme toimituksen pian.');
        setSubmitted({ total: order.total, lines: describeRentalOrder(order) });
      } else {
        throw new Error(result.message || 'Lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Rental order submission error:', error);
      toast.error('Jotain meni pieleen. Yritä uudelleen tai soita meille.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        ref={doneRef}
        className="mx-auto max-w-2xl rounded-2xl border border-black/5 bg-white/90 p-8 text-center shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5"
      >
        <h3 className="mb-2 text-xl font-bold text-black/90 dark:text-white">Kiitos vuokrauspyynnöstä!</h3>
        <p className="mb-4 text-black/70 dark:text-white/70">
          Vahvistamme toimituspäivän ja aikaikkunan puhelimitse tai sähköpostitse. Kiireellisessä asiassa voit soittaa:{' '}
          <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-primary hover:underline">
            {siteConfig?.contact?.phone?.display}
          </Link>
          .
        </p>
        <ul className="mx-auto mb-4 max-w-md space-y-1 rounded-xl bg-primary/5 p-4 text-left text-sm text-black/80 dark:text-white/80">
          {submitted.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-black/60 dark:text-white/60">
          Muutat pian?{' '}
          <Link href="/muuttolaskuri" className="font-semibold text-primary hover:underline">
            Laske muuton hinta
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-black/5 bg-white/90 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-10 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5">
      <form onSubmit={handleSubmit} className="space-y-8" autoComplete="on">
        {/* 1. Tuotteet */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-black dark:text-white">1. Valitse tuotteet</h3>
          {items.map((item) => {
            const isOn = selected[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-2xl border-2 transition-all ${isOn ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-800'}`}
              >
                <div
                  role="checkbox"
                  aria-checked={isOn}
                  tabIndex={0}
                  onClick={() => toggleItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleItem(item);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-4 p-5"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${isOn ? 'border-primary bg-primary' : 'border-gray-300'}`}
                  >
                    {isOn && <span className="text-xs text-white">✓</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-black dark:text-white">
                      {item.emoji} {item.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatPricePerDay(item.pricePerDay)} / kpl / vrk · {item.qty.min}–{item.qty.max} kpl · {item.days.min}–{item.days.max} vrk
                    </p>
                  </div>
                </div>

                {isOn && (
                  <div className="space-y-5 border-t border-primary/10 px-5 pt-5 pb-5">
                    <div>
                      <label htmlFor={`qty-${item.id}`} className="mb-2 block text-xs font-bold uppercase text-gray-400">
                        Määrä
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => stepItemQty(item, -item.qty.step)}
                            disabled={qty[item.id] <= item.qty.min}
                            aria-label={`Vähennä: ${item.title}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold transition-all hover:border-primary hover:text-primary disabled:opacity-30 dark:border-gray-700"
                          >
                            -
                          </button>
                          <input
                            id={`qty-${item.id}`}
                            type="number"
                            inputMode="numeric"
                            min={item.qty.min}
                            max={item.qty.max}
                            value={qty[item.id] || ''}
                            onChange={(e) => setItemQty(item, Math.min(item.qty.max, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                            onBlur={() => setItemQty(item, clampQty(item, qty[item.id]))}
                            className="w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-center font-bold outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => stepItemQty(item, item.qty.step)}
                            disabled={qty[item.id] >= item.qty.max}
                            aria-label={`Lisää: ${item.title}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 text-lg font-bold transition-all hover:border-primary hover:text-primary disabled:opacity-30 dark:border-gray-700"
                          >
                            +
                          </button>
                          <span className="text-sm text-gray-500">kpl</span>
                        </div>
                        {item.qtyHints && (
                          <div className="flex flex-wrap gap-2">
                            {item.qtyHints.map((hint) => (
                              <button
                                key={hint.label}
                                type="button"
                                onClick={() => setItemQty(item, hint.qty)}
                                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                                  qty[item.id] === hint.qty
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-gray-200 text-gray-600 hover:border-primary dark:border-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {hint.label}: {hint.qty}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Vähintään {item.qty.min} ja enintään {item.qty.max} kpl. Nyrkkisääntö: noin yksi laatikko asuinneliötä kohti.
                      </p>
                    </div>

                    <div>
                      <span className="mb-2 block text-xs font-bold uppercase text-gray-400">Vuokra-aika</span>
                      <div className="flex flex-wrap gap-2">
                        {item.days.options.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDays((prev) => ({ ...prev, [item.id]: d }))}
                            className={chipClass(days[item.id] === d)}
                          >
                            {d} vrk
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Vuokra lasketaan toimituksesta noutoon ja jatkuu, kunnes noudamme tuotteet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <input
              type="checkbox"
              checked={withMove}
              onChange={(e) => setWithMove(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
            />
            <span className="text-sm text-black dark:text-white">
              <span className="font-semibold">Vuokraan muuton yhteydessä</span> – olen varannut tai varaan myös muuton
              Muuttokoneelta. Toimitus ja nouto ovat silloin ilmaiset.
            </span>
          </label>
          <p className="text-xs text-gray-500">
            Muutat pian?{' '}
            <Link href="/muuttolaskuri" className="font-semibold text-primary hover:underline">
              Laske muuton hinta
            </Link>{' '}
            ja lisää laatikot suoraan laskurin lisäpalveluihin.
          </p>
        </div>

        {/* 2. Toimitus */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-black dark:text-white">2. Toimitus</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="address" className={labelClass}>
                Toimitusosoite <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                autoComplete="street-address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="Katu 1, rappu ja asunto"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="postalCode" className={labelClass}>
                Postinumero <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={form.postalCode}
                onChange={handleChange}
                required
                placeholder="00100"
                className={inputClass}
              />
              {outsideArea && (
                <p className="mt-2 text-xs text-orange-600">
                  Toimitus on pääkaupunkiseudulle. Osoite on sen ulkopuolella – otamme yhteyttä ja sovimme toimituksesta ja sen hinnasta erikseen.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="date" className={labelClass}>
                Toivottu toimituspäivä <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={form.date}
                min={minDate || undefined}
                onChange={handleChange}
                required
                className={inputClass}
              />
              {minDate && <p className="mt-2 text-xs text-gray-400">Aikaisin mahdollinen: {formatDate(addDays(minDate, 0))}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="window" className={labelClass}>
                Toivottu aikaikkuna
              </label>
              <select id="window" name="window" value={form.window} onChange={handleChange} className={inputClass}>
                {TIME_WINDOWS.map((w) => (
                  <option key={w.label} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Yhteystiedot */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-black dark:text-white">3. Yhteystiedot</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Nimi <span className="text-red-500">*</span>
              </label>
              <input type="text" id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} required placeholder="Etunimi Sukunimi" className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Puhelin <span className="text-red-500">*</span>
              </label>
              <input type="tel" id="phone" name="phone" autoComplete="tel" value={form.phone} onChange={handleChange} required placeholder="040 123 4567" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className={labelClass}>
                Sähköposti
              </label>
              <input type="email" id="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="nimi@esimerkki.fi" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="message" className={labelClass}>
                Lisätiedot
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                maxLength={400}
                value={form.message}
                onChange={handleChange}
                placeholder="Esim. porttikoodi, kerros ja hissi, toimitus mieluiten kerrostalon alaovelle."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* Yhteenveto */}
        <div className="rounded-2xl border border-primary/20 bg-white p-5 text-sm dark:bg-gray-900">
          <h3 className="mb-3 font-bold text-black dark:text-white">Yhteenveto</h3>
          {order ? (
            <div className="space-y-2">
              {order.lines.map((line) => (
                <div key={line.itemId} className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    {line.emoji} {line.title}: {line.qty} kpl × {line.days} vrk × {formatPricePerDay(line.pricePerDay)}
                  </span>
                  <span className="font-bold whitespace-nowrap">{formatEuro(line.cost)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-300">Toimitus ja nouto kotiovelle</span>
                <span className={`font-bold whitespace-nowrap ${order.deliveryFree ? 'text-green-600' : ''}`}>
                  {order.deliveryFree ? 'Ilmainen' : formatEuro(order.deliveryCost)}
                </span>
              </div>
              {order.deliveryFree && order.deliveryFreeReason && (
                <p className="text-xs text-green-700 dark:text-green-400">
                  {order.deliveryFreeReason === 'move'
                    ? 'Ilmainen, koska vuokraat muuton yhteydessä.'
                    : `Ilmainen, koska vuokra on vähintään ${RENTAL_DELIVERY.freeFromRental} €.`}
                </p>
              )}
              {freeDeliveryHint && (
                <p className="text-xs text-green-700 dark:text-green-400">
                  Toimitus ja nouto ovat ilmaiset, kun vuokra on vähintään {RENTAL_DELIVERY.freeFromRental} € – lisää vielä noin{' '}
                  {formatEuro(freeDeliveryHint.amount)} vuokraa (esim. {freeDeliveryHint.moreUnits} kpl lisää: {freeDeliveryHint.title}).
                </p>
              )}
              <div className="flex justify-between gap-4 border-t border-gray-100 pt-2 text-base font-bold dark:border-gray-800">
                <span>Yhteensä (sis. ALV)</span>
                <span className="whitespace-nowrap">{formatEuro(order.total)}</span>
              </div>
              {pickupEstimate && (
                <p className="text-xs text-gray-500">
                  Toimitus {formatDate(addDays(form.date, 0))} · nouto noin {formatDate(pickupEstimate)}. Tarkat ajat vahvistetaan kanssasi.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Valitse vähintään yksi tuote nähdäksesi hinnan.</p>
          )}
        </div>

        <Honeypot value={honeypot} onChange={setHoneypot} />
        <GdprConsentCheckbox checked={gdprConsent} onChange={setGdprConsent} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-secondary w-full rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Lähetetään...' : 'Lähetä vuokrauspyyntö'}
        </button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Emme veloita mitään ennen kuin olemme vahvistaneet toimituksen. Tai soita suoraan:{' '}
          <Link href={`tel:${siteConfig?.contact?.phone?.tel}`} className="font-semibold text-black hover:text-primary dark:text-white">
            {siteConfig?.contact?.phone?.display}
          </Link>
        </p>
      </form>
    </div>
  );
}
