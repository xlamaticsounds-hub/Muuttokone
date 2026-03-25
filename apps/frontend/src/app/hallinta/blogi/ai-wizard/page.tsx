'use client';

import React, { useState } from 'react';
import { ArrowLeft, Wand2, Loader2, CheckCircle, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveAiPost } from '@/server/blog-actions';

// Types for our state
type WizardState = 'INPUT' | 'OUTLINE' | 'GENERATING_DRAFT';

interface OutlineSection {
  heading: string;
  points: string[];
}

interface GeneratedOutline {
  title: string;
  slug: string;
  sections: OutlineSection[];
}

export default function AiWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardState>('INPUT');
  const [loading, setLoading] = useState(false);
  
  // Step 1 Inputs
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [audience, setAudience] = useState('Homeowners in Finland');
  const [tone, setTone] = useState('Professional and helpful');

  // Step 2 Data
  const [outline, setOutline] = useState<GeneratedOutline | null>(null);

  // Handlers
  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, audience, tone }),
      });
      const data = await res.json();
      setOutline(data);
      setStep('OUTLINE');
    } catch (error) {
      console.error('Failed to generate outline:', error);
      alert('Failed to generate outline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!outline) return;
    setLoading(true);
    setStep('GENERATING_DRAFT');

    try {
      // 1. Generate content
      const res = await fetch('/api/ai/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, tone, audience }),
      });
      const { content } = await res.json();

      // 2. Save to DB via Server Action
      const result = await saveAiPost({
        title: outline.title,
        slug: outline.slug,
        content: content,
        excerpt: `Blog post about ${topic}`, // Simple placeholder excerpt
        metaTitle: outline.title,
        metaDescription: `Read about ${topic} on Muuttokone.fi`, // Placeholder
      });
      
      // 3. Client-side redirect
      if (result && result.id) {
          router.push(`/hallinta/blogi/${result.id}`);
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
      alert('Failed to generate draft. Please try again.');
      setLoading(false);
      setStep('OUTLINE');
    }
  };

  // Renderers
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-4">
      <div className={`flex items-center gap-2 ${step === 'INPUT' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-current">1</span>
        <span>Aihe</span>
      </div>
      <div className="w-8 h-px bg-gray-300"></div>
      <div className={`flex items-center gap-2 ${step === 'OUTLINE' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-current">2</span>
        <span>Jäsennys</span>
      </div>
      <div className="w-8 h-px bg-gray-300"></div>
      <div className={`flex items-center gap-2 ${step === 'GENERATING_DRAFT' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-current">3</span>
        <span>Valmis</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hallinta/blogi" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wand2 className="text-purple-500" /> AI-Blogivelho
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Luo luonnos muutamassa minuutissa.</p>
        </div>
      </div>

      {renderStepIndicator()}

      {/* STEP 1: INPUT */}
      {step === 'INPUT' && (
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleGenerateOutline} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mistä haluat kirjoittaa?</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Esim. Muuttolaatikoiden pakkausvinkit"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avainsanat (pilkulla erotettuna)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="pakkaus, muutto, vinkit"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kohderyhmä</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Äänensävy</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-transparent dark:bg-slate-800"
              >
                <option value="Professional and helpful">Asiantunteva ja avulias</option>
                <option value="Casual and friendly">Rento ja ystävällinen</option>
                <option value="Sales-oriented">Myyntihenkinen</option>
                <option value="Humorous">Huumoristinen</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                {loading ? 'Suunnitellaan...' : 'Luo jäsennys'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: OUTLINE REVIEW */}
      {step === 'OUTLINE' && outline && (
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="space-y-4 mb-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Otsikkoehdotus</label>
                    <input 
                        value={outline.title} 
                        onChange={(e) => setOutline({...outline, title: e.target.value})}
                        className="w-full text-xl font-bold border-b-2 border-transparent hover:border-gray-200 focus:border-purple-500 outline-none bg-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">URL Slug</label>
                    <input 
                        value={outline.slug} 
                        onChange={(e) => setOutline({...outline, slug: e.target.value})}
                        className="w-full text-sm font-mono text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:border-gray-200 focus:border-purple-500 outline-none bg-transparent"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg border-b pb-2">Jäsennys</h3>
                {outline.sections.map((section, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-100 dark:border-gray-700/50">
                        <input 
                            value={section.heading}
                            onChange={(e) => {
                                const newSections = [...outline.sections];
                                newSections[idx].heading = e.target.value;
                                setOutline({...outline, sections: newSections});
                            }}
                            className="w-full font-bold mb-2 bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white"
                        />
                         <ul className="list-disc list-inside space-y-1">
                            {section.points.map((point, pIdx) => (
                                <li key={pIdx} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                    <input 
                                        value={point}
                                        onChange={(e) => {
                                            const newSections = [...outline.sections];
                                            newSections[idx].points[pIdx] = e.target.value;
                                            setOutline({...outline, sections: newSections});
                                        }}
                                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-600 dark:text-gray-300"
                                    />
                                </li>
                            ))}
                         </ul>
                    </div>
                ))}
              </div>

              <div className="pt-8 flex items-center justify-between">
                 <button 
                    onClick={() => setStep('INPUT')}
                    className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
                 >
                    Takaisin
                 </button>
                 <button
                    onClick={handleGenerateDraft}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                    {loading ? 'Kirjoitetaan...' : 'Luo luonnos'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* STEP 3: LOADING STATE */}
      {step === 'GENERATING_DRAFT' && (
         <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Tekoäly kirjoittaa...</h2>
            <p className="text-gray-500 max-w-md">
                Tämä kestää yleensä noin 30-60 sekuntia. Luomme parhaillaan sisältöä jäsennyksen pohjalta.
            </p>
         </div>
      )}
    </div>
  );
}
