'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send } from 'lucide-react';
import { createLateFeeInvoice } from '@/server/invoice-actions';
import { sendInvoiceEmail } from '@/server/send-invoice';
import { buildLateFeeItem, buildReminderFeeItem, computeInvoiceTotals, daysOverdue, type InvoiceLineItem } from '@/lib/invoice';
import { renderInvoiceEmailHtml } from '@/lib/invoice-email';
import { formatEuro } from '@/lib/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Uuden (muistutus)laskun oletuseräpäivä: 14 päivää tästä päivästä, <input type="date"> -muodossa.
function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function LateFeeModal({
  invoiceId,
  invoiceNumber,
  customerName,
  email: initialEmail,
  dueDate,
  items,
  onClose,
}: {
  invoiceId: string;
  invoiceNumber: number;
  customerName: string;
  email: string;
  dueDate: string; // ISO — kutsuva komponentti varmistaa ettei tämä ole null
  items: InvoiceLineItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const originalDueFi = new Date(dueDate).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });

  const [rate, setRate] = useState('');
  const [reminderFee, setReminderFee] = useState('5');
  const [newDueDate, setNewDueDate] = useState(defaultDueDate);
  const [email, setEmail] = useState(initialEmail);
  const [customMessage, setCustomMessage] = useState(
    `Emme ole vielä vastaanottaneet maksua laskusta nro ${invoiceNumber}, jonka eräpäivä oli ${originalDueFi}. ` +
      'Laskulle on lisätty korkolain mukainen viivästyskorko. Jos olet jo maksanut laskun, voit jättää tämän viestin huomiotta.',
  );
  const [busy, setBusy] = useState<'send' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Jos lasku ehdittiin luoda mutta lähetys epäonnistui, uusi yritys lähettää saman laskun
  // uudelleen eikä luo toista kopiota.
  const [createdId, setCreatedId] = useState<string | null>(null);

  const ratePercent = parseFloat(rate.replace(',', '.'));
  const rateValid = Number.isFinite(ratePercent) && ratePercent > 0;
  const reminderFeeAmount = reminderFee.trim() === '' ? 0 : parseFloat(reminderFee.replace(',', '.'));
  const reminderFeeValid = Number.isFinite(reminderFeeAmount) && reminderFeeAmount >= 0;
  const emailValid = EMAIL_RE.test(email.trim());

  const lateFee = useMemo(
    () => (rateValid ? buildLateFeeItem({ items, dueDate: new Date(dueDate), ratePercent, invoiceNumber }) : null),
    [rateValid, items, dueDate, ratePercent, invoiceNumber],
  );
  const days = lateFee?.days ?? daysOverdue(new Date(dueDate));
  const principal = useMemo(() => computeInvoiceTotals(items).gross, [items]);

  const previewHtml = useMemo(() => {
    if (!lateFee) return '';
    const newItems = [...items, lateFee.item];
    if (reminderFeeValid && reminderFeeAmount > 0) {
      newItems.push(buildReminderFeeItem(reminderFeeAmount));
    }
    const body = renderInvoiceEmailHtml({
      customerName,
      invoiceNumber: '(annetaan luotaessa)',
      items: newItems,
      totalAmount: computeInvoiceTotals(newItems).gross,
      dueDate: newDueDate ? new Date(newDueDate) : null,
      viitenumero: '(muodostetaan laskun numerosta)',
      customMessage,
      reminder: true,
    });
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#f9fafb;">${body}</body></html>`;
  }, [lateFee, items, customerName, newDueDate, customMessage, reminderFeeValid, reminderFeeAmount]);

  const createInvoice = async () => {
    if (createdId) return createdId;
    const { id } = await createLateFeeInvoice(invoiceId, ratePercent, newDueDate || null, reminderFeeValid && reminderFeeAmount > 0 ? reminderFeeAmount : null);
    setCreatedId(id);
    return id;
  };

  const handleSend = async () => {
    if (!rateValid || !emailValid || !reminderFeeValid) return;
    setBusy('send');
    setError(null);
    let id: string;
    try {
      id = await createInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Maksumuistutuksen luonti epäonnistui.');
      setBusy(null);
      return;
    }

    try {
      const result = await sendInvoiceEmail(id, email.trim(), { customMessage });
      if (result.success) {
        router.push(`/hallinta/laskutus/${id}`);
        return;
      }
      setError(`Maksumuistutus luotiin, mutta lähetys epäonnistui: ${result.message}`);
    } catch (err) {
      setError(`Maksumuistutus luotiin, mutta lähetys epäonnistui: ${err instanceof Error ? err.message : 'tuntematon virhe'}`);
    }
    setBusy(null);
  };

  const handleCreateDraft = async () => {
    if (!rateValid || !reminderFeeValid) return;
    setBusy('draft');
    setError(null);
    try {
      const id = await createInvoice();
      router.push(`/hallinta/laskutus/${id}/muokkaa`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Maksumuistutuksen luonti epäonnistui.');
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Maksumuistutuksen esikatselu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="flex max-h-[50vh] w-full flex-col gap-4 overflow-y-auto border-b border-gray-200 p-6 sm:max-h-none sm:w-80 sm:border-b-0 sm:border-r dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lasku #{invoiceNumber} on ollut erääntyneenä <strong>{days} päivää</strong>. Uudelle laskulle tulevat
              alkuperäiset rivit ({formatEuro(principal)} €), viivästyskorkorivi ja tarvittaessa muistutusmaksu.
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Vuosikorko (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Esim. 11,5"
                autoFocus
                disabled={!!createdId}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Korkolain (633/1982) mukainen vähimmäiskorko on Suomen Pankin kulloinkin voimassa oleva viitekorko + 7
                prosenttiyksikköä (kuluttaja-asiakkaat) tai + 8 (yritysasiakkaat). Tarkista ajantasainen viitekorko
                Suomen Pankin sivuilta ennen lähettämistä.
              </p>
            </div>

            {lateFee && (
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50">
                <span className="text-gray-500 dark:text-gray-400">Viivästyskorko: </span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatEuro(lateFee.amount)} €</span>
                <span className="text-gray-500 dark:text-gray-400"> ({days} pv × {ratePercent.toLocaleString('fi-FI')} % p.a.)</span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Muistutusmaksu (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={reminderFee}
                onChange={(e) => setReminderFee(e.target.value)}
                placeholder="Esim. 5"
                disabled={!!createdId}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Perintälain (513/1999) 10 c §:n mukainen kuluttajan maksumuistutuksen enimmäismäärä on 5 €. Jätä
                tyhjäksi tai nollaksi, jos et halua lisätä muistutusmaksua.
              </p>
              {reminderFeeValid && reminderFeeAmount > 0 && (
                <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/50">
                  <span className="text-gray-500 dark:text-gray-400">Muistutusmaksu: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatEuro(reminderFeeAmount)} €</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Uusi eräpäivä</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                disabled={!!createdId}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Lähetä osoitteeseen</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="asiakas@example.com"
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Lisäteksti asiakkaalle</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="sticky bottom-0 -mx-6 mt-auto flex flex-col gap-2 bg-white px-6 pt-4 pb-2 dark:bg-gray-800">
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {createdId && (
                <a href={`/hallinta/laskutus/${createdId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Avaa luotu lasku
                </a>
              )}
              <button
                onClick={handleSend}
                disabled={busy !== null || !rateValid || !emailValid || !reminderFeeValid}
                title={
                  !rateValid
                    ? 'Anna kelvollinen vuosikorko'
                    : !reminderFeeValid
                      ? 'Anna kelvollinen muistutusmaksu'
                      : !emailValid
                        ? 'Anna kelvollinen sähköpostiosoite'
                        : undefined
                }
                className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {busy === 'send' ? 'Lähetetään...' : `Luo ja lähetä osoitteeseen ${email.trim() || '-'}`}
              </button>
              {!createdId && (
                <button
                  onClick={handleCreateDraft}
                  disabled={busy !== null || !rateValid || !reminderFeeValid}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {busy === 'draft' ? 'Luodaan...' : 'Luo muokattavaksi, älä lähetä'}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
            {previewHtml ? (
              <iframe title="Maksumuistutuksen esikatselu" srcDoc={previewHtml} className="h-full w-full border-0" />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-sm text-gray-500 dark:text-gray-400">
                Anna vuosikorko nähdäksesi esikatselun.
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
