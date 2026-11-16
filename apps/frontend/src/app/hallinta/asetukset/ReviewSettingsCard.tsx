'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadGoogleRatingSetting, loadReviewSettings, saveGoogleRating, saveReviewSettings, sendTestReviewRequest } from '@/server/review-actions';
import { DEFAULT_GOOGLE_RATING, type GoogleRating } from '@/lib/google-rating';
import { DEFAULT_REVIEW_SETTINGS, type ReviewSettings } from '@/lib/review-request';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white';

// Hallinta → Asetukset: automaattinen arvostelupyyntö asiakkaalle toteutuneen keikan jälkeen.
export default function ReviewSettingsCard() {
  const [settings, setSettings] = useState<ReviewSettings>(DEFAULT_REVIEW_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rating, setRating] = useState<GoogleRating>(DEFAULT_GOOGLE_RATING);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    Promise.all([loadReviewSettings(), loadGoogleRatingSetting()])
      .then(([loaded, loadedRating]) => {
        if (loaded) setSettings(loaded);
        if (loadedRating) setRating(loadedRating);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveRating = async () => {
    setSavingRating(true);
    const result = await saveGoogleRating(rating);
    setSavingRating(false);
    if (result.success) toast.success('Arvosana päivitetty sivustolle');
    else toast.error(result.message);
  };

  const save = async () => {
    setSaving(true);
    const result = await saveReviewSettings(settings);
    setSaving(false);
    if (result.success) toast.success('Arvosteluasetukset tallennettu');
    else toast.error(result.message);
  };

  const test = async () => {
    setTesting(true);
    const result = await sendTestReviewRequest();
    setTesting(false);
    if (result.success) toast.success(result.message ?? 'Testiviesti lähetetty');
    else toast.error(result.message);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google-arvostelupyynnöt</h2>
          <p className="text-sm text-gray-500">
            Asiakas saa sähköpostilla pyynnön arvostella Muuttokone Googlessa toteutunutta keikkaa seuraavana aamuna. Kukin keikka saa pyynnön
            vain kerran, ja lähetykset näkyvät lokissa.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="accent-primary h-5 w-5"
            />
            Lähetä arvostelupyynnöt automaattisesti
          </label>
          <div>
            <label htmlFor="review-url" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Google-arvostelulinkki
            </label>
            <input
              id="review-url"
              type="url"
              placeholder="https://g.page/r/.../review"
              value={settings.googleReviewUrl}
              onChange={(e) => setSettings({ ...settings, googleReviewUrl: e.target.value })}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">Google-yritysprofiili → Pyydä arvosteluja → kopioi linkki.</p>
          </div>
          <div>
            <label htmlFor="review-url-tre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tampereen arvostelulinkki (valinnainen)
            </label>
            <input
              id="review-url-tre"
              type="url"
              placeholder="Tyhjä = käytetään yllä olevaa linkkiä"
              value={settings.googleReviewUrlTampere ?? ''}
              onChange={(e) => setSettings({ ...settings, googleReviewUrlTampere: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Tallenna
            </button>
            <button
              type="button"
              onClick={test}
              disabled={testing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Lähetä testiviesti itselleni
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Arvosana sivustolla</h3>
            <p className="mb-3 text-xs text-gray-500">
              Näkyy sivuilla muodossa ”★★★★★ 5,0 · Google ja Muuttomaailma”. Päivitä keskiarvo, jos se muuttuu.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Keskiarvo
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={rating.rating}
                  onChange={(e) => setRating({ ...rating, rating: Number(e.target.value) })}
                  className={`${inputClass} mt-1 w-24`}
                />
              </label>
              <button
                type="button"
                onClick={saveRating}
                disabled={savingRating}
                className="bg-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Päivitä arvosana
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
