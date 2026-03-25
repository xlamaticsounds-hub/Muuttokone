'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface PageData {
  slug: string;
  sections: any;
}

export default function AsetuksetPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // For this simplified version, we just edit the "home" page
  const fetchHomeContent = async () => {
    try {
      const res = await fetch('/api/pages/home');
      const data = await res.json();
      setPageData(data || { slug: 'home', sections: [
        { id: 'hero', type: 'Hero', props: { title: '', description: '', typingTexts: [] } },
        { id: 'services', type: 'Services', props: { title: '', subtitle: '' } }
      ]});
    } catch (error) {
      toast.error('Sisällön haku epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeContent();
  }, []);

  const handleSave = async () => {
    if (!pageData) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pages/home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      if (res.ok) {
        toast.success('Muutokset tallennettu!');
      } else {
        toast.error('Tallennus epäonnistui');
      }
    } catch (error) {
      toast.error('Tallennus epäonnistui');
    } finally {
      setSaving(false);
    }
  };

  const updateHeroProp = (field: string, value: any) => {
    if (!pageData) return;
    const newSections = [...pageData.sections];
    const heroIdx = newSections.findIndex(s => s.id === 'hero');
    if (heroIdx > -1) {
      newSections[heroIdx].props[field] = value;
      setPageData({ ...pageData, sections: newSections });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sivuston hallinta</h1>
          <p className="text-sm text-gray-500">Muokkaa etusivun tekstejä ja sisältöä.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Tallenna muutokset
        </button>
      </div>

      <div className="grid gap-8">
        {/* Hero Section Editor */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 border-b pb-2">Hero-osio (Etusivu)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 uppercase tracking-wider text-gray-500">Pääotsikko</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary"
                value={pageData?.sections.find((s: any) => s.id === 'hero')?.props.title || ''}
                onChange={(e) => updateHeroProp('title', e.target.value)}
                placeholder="Esim. Luotettava apusi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 uppercase tracking-wider text-gray-500">Kuvaus</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary"
                value={pageData?.sections.find((s: any) => s.id === 'hero')?.props.description || ''}
                onChange={(e) => updateHeroProp('description', e.target.value)}
                placeholder="Lyhyt kuvaus palvelusta..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 uppercase tracking-wider text-gray-500">Vaihtuvat tekstit (pilkulla erotettuna)</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary"
                value={pageData?.sections.find((s: any) => s.id === 'hero')?.props.typingTexts?.join(', ') || ''}
                onChange={(e) => updateHeroProp('typingTexts', e.target.value.split(',').map(t => t.trim()))}
                placeholder="kotimuutossa, yritysmuutossa..."
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex gap-4">
          <div className="text-2xl text-blue-500">💡</div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-bold mb-1">Vinkki:</p>
            Voit kopioida kuva-URL:t <strong>Galleria</strong>-osiosta ja liittää ne tänne, jos lisäät uusia kuvakenttiä. 
            Tallentamisen jälkeen muutokset näkyvät välittömästi sivustolla.
          </div>
        </div>
      </div>
    </div>
  );
}