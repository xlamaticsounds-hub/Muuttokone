'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Mail } from 'lucide-react';
import { saveOffer, sendOfferEmail } from '@/server/offer-actions';
import { DEFAULT_VALID_DAYS, OFFER_LIMITS, addDaysIso, isValidEmail, offerNumber, offerTitle, type OfferData } from '@/lib/offer';
import { formatClock, formatEntryDate } from '@/lib/work-time';
import OfferFields, { amountToInput, linesToPayload, newLine, type OfferFieldsValue } from '../../OfferFields';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton, textareaClass } from '../../../form-styles';

type EditorState = {
  issuedOn: string;
  customer: { name: string; phone: string; email: string };
  job: { date: string; time: string; fromAddress: string; toAddress: string };
  fields: OfferFieldsValue;
};

const toState = (o: OfferData): EditorState => ({
  issuedOn: o.issuedOn,
  customer: { name: o.customerName, phone: o.customerPhone ?? '', email: o.customerEmail ?? '' },
  job: { date: o.serviceDate ?? '', time: o.serviceTime ?? '', fromAddress: o.fromAddress ?? '', toAddress: o.toAddress ?? '' },
  fields: {
    type: o.type,
    description: o.description,
    lines: o.lines.map((l) => newLine(l.label, amountToInput(l.amount), l.vatRate)),
    priceNote: o.priceNote ?? '',
    validUntil: o.validUntil ?? addDaysIso(o.issuedOn, DEFAULT_VALID_DAYS),
    notes: o.notes ?? '',
    terms: o.terms,
  },
});

const toPayload = (s: EditorState) => ({
  type: s.fields.type,
  issuedOn: s.issuedOn,
  validUntil: s.fields.type === 'tarjous' ? s.fields.validUntil : null,
  customerName: s.customer.name,
  customerEmail: s.customer.email,
  customerPhone: s.customer.phone,
  serviceDate: s.job.date || null,
  serviceTime: s.job.time,
  fromAddress: s.job.fromAddress,
  toAddress: s.job.toAddress,
  description: s.fields.description,
  lines: linesToPayload(s.fields.lines),
  priceNote: s.fields.priceNote,
  notes: s.fields.notes,
  terms: s.fields.terms,
});

// Yleinen tarjous / tilausvahvistus: muokkaus, PDF-esikatselu, lataus ja lähetys sähköpostilla.
// Esikatselu ja liite tehdään aina tallennetusta versiosta, joten lähetys vaatii tallennuksen.
export default function OfferEditor({
  leadId,
  initial,
  saved,
  contactEmail,
  sent,
}: {
  leadId: string;
  initial: OfferData;
  saved: boolean;
  contactEmail: string | null;
  sent: { at: string; to: string; type: string } | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<EditorState>(() => toState(initial));
  const [savedSnapshot, setSavedSnapshot] = useState(() => (saved ? JSON.stringify(toPayload(toState(initial))) : ''));
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [to, setTo] = useState(contactEmail ?? initial.customerEmail ?? '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const payload = useMemo(() => toPayload(state), [state]);
  const dirty = JSON.stringify(payload) !== savedSnapshot;
  const number = offerNumber(leadId, state.issuedOn || initial.issuedOn);
  const title = offerTitle(state.fields.type);
  const pdfUrl = `/api/hallinta/liidit/${leadId}/tarjous`;

  const save = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await saveOffer(leadId, payload);
      if (result.success) {
        setSavedSnapshot(JSON.stringify(payload));
        setVersion((v) => v + 1);
        setSaveMessage({ ok: true, text: 'Tallennettu. Esikatselu päivitetty.' });
        router.refresh();
      } else {
        setSaveMessage({ ok: false, text: result.message });
      }
    } catch {
      setSaveMessage({ ok: false, text: 'Yhteysvirhe. Tarkista verkko ja yritä uudelleen.' });
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    if (!window.confirm(`Lähetetäänkö ${title.toLowerCase()} ${number} PDF-liitteenä osoitteeseen ${to.trim()}?`)) return;
    setSending(true);
    setSendMessage(null);
    try {
      const result = await sendOfferEmail(leadId, { to, message });
      if (result.success) {
        setSendMessage({ ok: true, text: `Lähetetty osoitteeseen ${result.sentTo}.` });
        router.refresh();
      } else {
        setSendMessage({ ok: false, text: result.message });
      }
    } catch {
      setSendMessage({ ok: false, text: 'Yhteysvirhe. Tarkista verkko ja yritä uudelleen.' });
    } finally {
      setSending(false);
    }
  };

  const setCustomer = (patch: Partial<EditorState['customer']>) => setState((s) => ({ ...s, customer: { ...s.customer, ...patch } }));
  const setJob = (patch: Partial<EditorState['job']>) => setState((s) => ({ ...s, job: { ...s.job, ...patch } }));
  const setFields = (patch: Partial<OfferFieldsValue>) => setState((s) => ({ ...s, fields: { ...s.fields, ...patch } }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/hallinta/liidit/${leadId}`}
            aria-label="Takaisin liidiin"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title} {number}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.customer.name || 'Asiakas'} · {dirty ? 'tallentamattomia muutoksia' : 'tallennettu'}
              {sent && ` · lähetetty ${formatEntryDate(new Date(sent.at))} ${formatClock(new Date(sent.at))} osoitteeseen ${sent.to}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Asiakas ja keikka</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="of-name" className={labelClass}>Nimi</label>
                <input id="of-name" maxLength={OFFER_LIMITS.name} value={state.customer.name} onChange={(e) => setCustomer({ name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="of-phone" className={labelClass}>Puhelin</label>
                <input id="of-phone" maxLength={OFFER_LIMITS.phone} value={state.customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="of-email" className={labelClass}>Sähköposti</label>
                <input id="of-email" type="email" maxLength={OFFER_LIMITS.email} value={state.customer.email} onChange={(e) => setCustomer({ email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="of-date" className={labelClass}>Päivä</label>
                <input id="of-date" type="date" value={state.job.date} onChange={(e) => setJob({ date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="of-time" className={labelClass}>Kellonaika</label>
                <input id="of-time" maxLength={OFFER_LIMITS.time} value={state.job.time} onChange={(e) => setJob({ time: e.target.value })} placeholder="esim. klo 10" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="of-from" className={labelClass}>Mistä</label>
                <input id="of-from" maxLength={OFFER_LIMITS.address} value={state.job.fromAddress} onChange={(e) => setJob({ fromAddress: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="of-to" className={labelClass}>Minne</label>
                <input id="of-to" maxLength={OFFER_LIMITS.address} value={state.job.toAddress} onChange={(e) => setJob({ toAddress: e.target.value })} className={inputClass} />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Sisältö</h2>
            <div className="mb-4 max-w-xs">
              <label htmlFor="of-issued" className={labelClass}>Päiväys</label>
              <input id="of-issued" type="date" value={state.issuedOn} onChange={(e) => setState((s) => ({ ...s, issuedOn: e.target.value }))} className={inputClass} />
            </div>
            <OfferFields value={state.fields} onChange={setFields} idPrefix="of" showTerms />
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Tallennus päivittää hintarivien summan myös liidin vahvistetuksi hinnaksi.</p>
          </section>

          <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border dark:border-gray-700 dark:bg-gray-800/95">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={save} disabled={saving || !dirty} className={primaryButton}>
                {saving ? 'Tallennetaan…' : 'Tallenna ja päivitä esikatselu'}
              </button>
              {saveMessage && (
                <p role={saveMessage.ok ? 'status' : 'alert'} className={`text-sm font-medium ${saveMessage.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                  {saveMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className={cardClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Esikatselu</h2>
              <div className="flex gap-2">
                <a href={`${pdfUrl}?v=${version}`} target="_blank" rel="noopener noreferrer" className={`${secondaryButton} flex items-center gap-1.5`}>
                  <ExternalLink className="h-4 w-4" />
                  Avaa
                </a>
                <a href={`${pdfUrl}?lataa=1&v=${version}`} className={`${secondaryButton} flex items-center gap-1.5`}>
                  <Download className="h-4 w-4" />
                  Lataa PDF
                </a>
              </div>
            </div>
            {dirty && <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-300">Esikatselu ja PDF näyttävät tallennetun version.</p>}
            <iframe key={version} src={`${pdfUrl}?v=${version}`} title={`${title} ${number}`} className="hidden h-[75vh] w-full rounded-lg border border-gray-200 bg-gray-50 lg:block dark:border-gray-700" />
            <p className="text-sm text-gray-500 lg:hidden dark:text-gray-400">Avaa PDF nähdäksesi esikatselun.</p>
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 text-gray-400" />
              Lähetä asiakkaalle
            </h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="of-to-email" className={labelClass}>Vastaanottaja</label>
                <input id="of-to-email" type="email" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="of-message" className={labelClass}>Saateviesti (valinnainen)</label>
                <textarea id="of-message" rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} className={textareaClass} />
              </div>
              <button type="button" onClick={send} disabled={sending || dirty || !isValidEmail(to.trim())} className={`${primaryButton} w-full sm:w-auto`}>
                {sending ? 'Lähetetään…' : `Lähetä ${title.toLowerCase()} sähköpostilla`}
              </button>
              {dirty && <p className="text-xs text-gray-500 dark:text-gray-400">Tallenna muutokset ennen lähetystä.</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF lähtee liitteenä tarjous@-osoitteesta. Voit myös ladata PDF:n ja lähettää sen WhatsAppissa tai Muuttomaailmassa.
              </p>
              {sendMessage && (
                <p role={sendMessage.ok ? 'status' : 'alert'} className={`text-sm font-medium ${sendMessage.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                  {sendMessage.text}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
