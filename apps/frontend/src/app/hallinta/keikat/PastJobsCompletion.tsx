'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { completePastJobs, listPastConfirmedJobs, type PastJob } from '@/server/bulk-completion-actions';

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}.${Number(m)}.${y}`;
};

// Hallinta → Keikat (vain omistajat): menneet vahvistetut keikat toteutuneiksi kerralla. Toteutumispäiväksi
// tulee keikan päivä ja hinnaksi vahvistettu/tarjottu hinta. Arvostelupyyntö vain rastitetuille.
export default function PastJobsCompletion() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<PastJob[]>([]);
  const [include, setInclude] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());

  const load = async () => {
    setOpen(true);
    setLoading(true);
    const result = await listPastConfirmedJobs();
    setLoading(false);
    if (!result.success) {
      toast.error(result.message);
      setOpen(false);
      return;
    }
    setJobs(result.jobs);
    setInclude(new Set(result.jobs.filter((j) => j.price != null).map((j) => j.id)));
    setReview(new Set(result.jobs.filter((j) => j.price != null && j.suggestReview).map((j) => j.id)));
  };

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const selected = useMemo(() => jobs.filter((j) => include.has(j.id)), [jobs, include]);
  const reviewCount = selected.filter((j) => review.has(j.id) && j.hasEmail).length;
  const noPrice = jobs.filter((j) => j.price == null);

  const submit = async () => {
    if (selected.length === 0) return;
    const ok = window.confirm(
      `Merkitäänkö ${selected.length} keikkaa toteutuneiksi (toteutumispäivä = keikan päivä)?` +
        (reviewCount > 0 ? `\n\nArvostelupyyntö lähetetään heti ${reviewCount} asiakkaalle.` : '\n\nArvostelupyyntöjä ei lähetetä.'),
    );
    if (!ok) return;
    setSaving(true);
    const result = await completePastJobs(selected.map((j) => ({ leadId: j.id, sendReview: review.has(j.id) && j.hasEmail })));
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(
      `${result.completed} keikkaa merkitty toteutuneiksi, ${result.reviewsSent} arvostelupyyntöä lähetetty` +
        (result.reviewsFailed ? `, ${result.reviewsFailed} lähetys epäonnistui` : '') +
        (result.skipped ? `, ${result.skipped} ohitettu` : '') +
        '.',
      { duration: 8000 },
    );
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={load}
        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700"
      >
        <CheckCheck className="h-4 w-4" /> Merkitse vahvistetut toteutuneiksi
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Menneet vahvistetut keikat → toteutuneiksi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Toteutumispäiväksi tulee keikan päivä ja hinnaksi vahvistettu tai tarjottu hinta. Arvostelupyyntö lähtee heti vain rastitetuille;
            muille sitä ei lähetetä myöhemminkään automaattisesti.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Sulje">
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Ei menneitä vahvistettuja keikkoja merkitsemättä.</p>
      ) : (
        <>
          <div className="max-h-[460px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">Merkitse</th>
                  <th className="px-3 py-2">Päivä</th>
                  <th className="px-3 py-2">Asiakas</th>
                  <th className="px-3 py-2">Lähtöosoite</th>
                  <th className="px-3 py-2 text-right">Hinta</th>
                  <th className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" /> Arvostelupyyntö
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {jobs.map((job) => {
                  const disabled = job.price == null;
                  return (
                    <tr key={job.id} className={disabled ? 'opacity-50' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={include.has(job.id)}
                          onChange={() => toggle(include, setInclude, job.id)}
                          className="h-4 w-4 accent-green-600"
                          aria-label={`Merkitse ${job.customer}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300">{fmtDate(job.date)}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{job.customer}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{job.address || '–'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-gray-900 dark:text-white">
                        {job.price != null ? `${job.price.toLocaleString('fi-FI')} €` : 'hinta puuttuu'}
                      </td>
                      <td className="px-3 py-2">
                        {job.hasEmail ? (
                          <input
                            type="checkbox"
                            disabled={disabled || !include.has(job.id)}
                            checked={review.has(job.id) && include.has(job.id)}
                            onChange={() => toggle(review, setReview, job.id)}
                            className="h-4 w-4 accent-yellow-500"
                            aria-label={`Arvostelupyyntö ${job.customer}`}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">ei sähköpostia</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {noPrice.length > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {noPrice.length} keikalta puuttuu hinta – merkitse ne toteutuneiksi liidin sivulta lopullisen hinnan kanssa.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Valittu {selected.length} keikkaa, arvostelupyyntö {reviewCount} asiakkaalle.
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={saving || selected.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Merkitse {selected.length} toteutuneiksi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
