'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ImagePicker, { type PickedImage } from '../../ImagePicker';
import OfferFields, { amountToInput, linesToPayload, newLine, type OfferFieldsValue } from '../OfferFields';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton, textareaClass } from '../../form-styles';
import {
  DEFAULT_EXTERNAL_SOURCE,
  EXTERNAL_LEAD_STATUSES,
  EXTERNAL_SOURCES,
  priceDraftFromExtraction,
  type ExternalLeadStatus,
  type ExtractedLead,
} from '@/lib/external-lead';
import { DEFAULT_OFFER_DESCRIPTION, DEFAULT_OFFER_TERMS, DEFAULT_VALID_DAYS, addDaysIso, type OfferType } from '@/lib/offer';

const statusForType = (type: OfferType): ExternalLeadStatus => (type === 'vahvistus' ? 'WON' : 'PROPOSAL_SENT');

// Muualta tulleen keikan kirjaus: keskustelun kuvat ja muistiinpanot -> tekoäly täyttää tiedot ->
// ihminen tarkistaa -> liidi, muistiinpano, kuvat ja tarjous/tilausvahvistus luodaan kerralla.
export default function ExternalLeadForm({ todayIso, aiEnabled }: { todayIso: string; aiEnabled: boolean }) {
  const router = useRouter();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [conversation, setConversation] = useState('');
  const [reading, setReading] = useState(false);
  const [aiInfo, setAiInfo] = useState<{ summary: string | null; uncertainties: string[] } | null>(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [job, setJob] = useState({ fromAddress: '', toAddress: '', date: '', time: '', source: DEFAULT_EXTERNAL_SOURCE, sourceDetail: '' });
  const [status, setStatus] = useState<ExternalLeadStatus>('PROPOSAL_SENT');
  const [offer, setOffer] = useState<OfferFieldsValue>({
    type: 'tarjous',
    description: DEFAULT_OFFER_DESCRIPTION,
    lines: [newLine('Muuttopalvelu')],
    priceNote: '',
    validUntil: addDaysIso(todayIso, DEFAULT_VALID_DAYS),
    notes: '',
    terms: DEFAULT_OFFER_TERMS,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOffer = (patch: Partial<OfferFieldsValue>) => {
    setOffer((o) => ({ ...o, ...patch }));
    if (patch.type) setStatus(statusForType(patch.type));
  };

  const imageForm = () => {
    const form = new FormData();
    images.forEach((img) => form.append('images', img.file, img.file.name));
    return form;
  };

  const applyExtraction = (e: ExtractedLead) => {
    setCustomer((c) => ({ name: e.customerName ?? c.name, phone: e.phone ?? c.phone, email: e.email ?? c.email }));
    setJob((j) => ({
      ...j,
      fromAddress: e.fromAddress ?? j.fromAddress,
      toAddress: e.toAddress ?? j.toAddress,
      date: e.date ?? j.date,
      time: e.time ?? j.time,
      source: e.source ?? j.source,
    }));
    const draft = priceDraftFromExtraction(e);
    const type: OfferType = e.agreed ? 'vahvistus' : 'tarjous';
    setOffer((o) => ({
      ...o,
      type,
      description: e.description ?? o.description,
      lines: draft.lines.map((l) => newLine(l.label, amountToInput(l.amount))),
      priceNote: draft.priceNote ?? o.priceNote,
    }));
    setStatus(statusForType(type));
    setAiInfo({ summary: e.summary, uncertainties: e.uncertainties });
  };

  const readConversation = async () => {
    setReading(true);
    setError(null);
    const form = imageForm();
    form.set('text', conversation);
    try {
      const res = await fetch('/api/hallinta/keikka-muualta/lue', { method: 'POST', body: form });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) setError(json?.message ?? 'Keskustelun lukeminen epäonnistui.');
      else applyExtraction(json.data as ExtractedLead);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
    } finally {
      setReading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = imageForm();
    form.set(
      'payload',
      JSON.stringify({
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        ...job,
        status,
        conversationNotes: conversation,
        summary: aiInfo?.summary ?? null,
        offer: { ...offer, lines: linesToPayload(offer.lines) },
      }),
    );
    try {
      const res = await fetch('/api/hallinta/keikka-muualta', { method: 'POST', body: form });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message ?? 'Tallennus epäonnistui.');
        setSaving(false);
        return;
      }
      if (json.warning) window.alert(json.warning);
      router.push(`/hallinta/liidit/${json.leadId}/tarjous`);
    } catch {
      setError('Yhteysvirhe. Tarkista verkko ja yritä uudelleen.');
      setSaving(false);
    }
  };

  const canRead = aiEnabled && !reading && (images.length > 0 || conversation.trim().length > 0);

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/hallinta/liidit"
          aria-label="Takaisin liideihin"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lisää keikka muualta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Puhelimessa, WhatsAppissa tai Muuttomaailmassa sovittu keikka. Lisää kuvakaappaukset ja muistiinpanot keskustelusta, niin tekoäly täyttää tiedot.
          </p>
        </div>
      </div>

      <section className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">1. Keskustelu</h2>
        <ImagePicker images={images} onChange={setImages} disabled={saving} />
        <div className="mt-4">
          <label htmlFor="ext-conversation" className={labelClass}>Muistiinpanot keskustelusta</label>
          <textarea
            id="ext-conversation"
            rows={4}
            maxLength={10_000}
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
            placeholder="esim. Puhelu 24.10.: kaksio 3. krs (hissi) Kalliosta Espooseen la 8.11. klo 10, sovittiin 390 €."
            className={textareaClass}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tallentuu keikan muistiinpanoksi. Kuvat näkyvät liidin sivulla vain kirjautuneille.</p>
        </div>
        {aiEnabled ? (
          <button
            type="button"
            onClick={readConversation}
            disabled={!canRead}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            {reading ? 'Luetaan keskustelua…' : 'Täytä tiedot keskustelusta'}
          </button>
        ) : (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Tekoäly ei ole käytössä palvelimella: täytä tiedot käsin.</p>
        )}
        {aiInfo && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-semibold">Tekoäly täytti tiedot: tarkista ne ennen tallennusta.</p>
            {aiInfo.summary && <p className="mt-1">{aiInfo.summary}</p>}
            {aiInfo.uncertainties.length > 0 && (
              <ul className="mt-2 list-inside list-disc">
                {aiInfo.uncertainties.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">2. Asiakas ja keikka</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ext-name" className={labelClass}>Nimi</label>
            <input id="ext-name" required maxLength={120} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ext-phone" className={labelClass}>Puhelin</label>
            <input id="ext-phone" type="tel" maxLength={40} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ext-email" className={labelClass}>Sähköposti</label>
            <input id="ext-email" type="email" maxLength={160} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ext-from" className={labelClass}>Mistä</label>
            <input id="ext-from" maxLength={200} value={job.fromAddress} onChange={(e) => setJob({ ...job, fromAddress: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ext-to" className={labelClass}>Minne</label>
            <input id="ext-to" maxLength={200} value={job.toAddress} onChange={(e) => setJob({ ...job, toAddress: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ext-date" className={labelClass}>Päivä</label>
            <input id="ext-date" type="date" value={job.date} onChange={(e) => setJob({ ...job, date: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="ext-time" className={labelClass}>Kellonaika</label>
            <input id="ext-time" maxLength={80} value={job.time} onChange={(e) => setJob({ ...job, time: e.target.value })} placeholder="esim. klo 10" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ext-source" className={labelClass}>Mistä keikka tuli</label>
            <select id="ext-source" value={job.source} onChange={(e) => setJob({ ...job, source: e.target.value })} className={inputClass}>
              {EXTERNAL_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ext-source-detail" className={labelClass}>Lisätieto lähteestä (valinnainen)</label>
            <input id="ext-source-detail" maxLength={120} value={job.sourceDetail} onChange={(e) => setJob({ ...job, sourceDetail: e.target.value })} placeholder="esim. Muuttomaailma #12345" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ext-status" className={labelClass}>Tila</label>
            <select id="ext-status" value={status} onChange={(e) => setStatus(e.target.value as ExternalLeadStatus)} className={inputClass}>
              {EXTERNAL_LEAD_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">3. Tarjous / tilausvahvistus</h2>
        <OfferFields value={offer} onChange={updateOffer} idPrefix="ext-offer" />
      </section>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/hallinta/liidit" className={`${secondaryButton} flex items-center justify-center`}>
          Peruuta
        </Link>
        <button type="submit" disabled={saving || reading} className={primaryButton}>
          {saving ? 'Tallennetaan…' : 'Tallenna keikka ja avaa dokumentti'}
        </button>
      </div>
    </form>
  );
}
