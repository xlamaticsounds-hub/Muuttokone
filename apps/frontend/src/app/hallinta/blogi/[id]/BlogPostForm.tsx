'use client';

import React, { useState, useRef } from 'react';
import { Save, Sparkles, Loader2, Wand2, Bold, Italic, Heading, List, Link as LinkIcon, Quote, Eye, Edit2 } from 'lucide-react';
import { createPost, updatePost } from '@/server/blog-actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPostFormProps {
  post: any;
  isNew: boolean;
  id: string;
}

export default function BlogPostForm({ post, isNew, id }: BlogPostFormProps) {
  const [content, setContent] = useState(post?.content || '');
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [optimizingSeo, setOptimizingSeo] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishInstruction, setPolishInstruction] = useState('Fix grammar and spelling');

  // Helper to insert markdown syntax
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selection + suffix + text.substring(end);
    setContent(newText);
    
    // Restore focus and selection
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleOptimizeSeo = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content) return alert('Kirjoita ensin sisältöä.');
    
    setOptimizingSeo(true);
    try {
      const res = await fetch('/api/ai/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
    } catch (error) {
      console.error('SEO Optimization failed:', error);
      alert('SEO-optimointi epäonnistui.');
    } finally {
      setOptimizingSeo(false);
    }
  };

  const handlePolishContent = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content) return alert('Kirjoita ensin sisältöä.');

    setPolishing(true);
    try {
      const res = await fetch('/api/ai/polish-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, instruction: polishInstruction }),
      });
      const data = await res.json();
      setContent(data.content);
    } catch (error) {
      console.error('Polishing failed:', error);
      alert('Sisällön parannus epäonnistui.');
    } finally {
      setPolishing(false);
    }
  };

  const saveAction = isNew ? createPost : updatePost.bind(null, id);

  return (
    <form action={saveAction} className="space-y-8">
      {!isNew && <input type="hidden" name="wasPublished" value={post?.published ? 'true' : 'false'} />}
      
      {/* Top Meta Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Otsikko</label>
            <input 
                type="text" 
                name="title" 
                defaultValue={post?.title || ''} 
                required 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
        </div>
        
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Slug (URL)</label>
            <input 
                type="text" 
                name="slug" 
                defaultValue={post?.slug || ''} 
                required 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-mono text-sm"
            />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Lyhyt kuvaus (Excerpt)</label>
        <textarea 
            name="excerpt" 
            defaultValue={post?.excerpt || ''} 
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
        />
      </div>

      {/* Editor Section */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sisältö</label>
            
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => setTab('edit')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        tab === 'edit' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    <Edit2 size={14} />
                    Muokkaa
                </button>
                <button
                    type="button"
                    onClick={() => setTab('preview')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        tab === 'preview' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    <Eye size={14} />
                    Esikatselu
                </button>
            </div>
        </div>

        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            {/* Toolbar */}
            {tab === 'edit' && (
                <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                    <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Bold"><Bold size={16} /></button>
                    <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Italic"><Italic size={16} /></button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <button type="button" onClick={() => insertMarkdown('## ')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Heading 2"><Heading size={16} /></button>
                    <button type="button" onClick={() => insertMarkdown('### ')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Heading 3"><span className="text-xs font-bold">H3</span></button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <button type="button" onClick={() => insertMarkdown('- ')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="List"><List size={16} /></button>
                    <button type="button" onClick={() => insertMarkdown('> ')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Quote"><Quote size={16} /></button>
                    <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-300" title="Link"><LinkIcon size={16} /></button>
                    
                    <div className="flex-grow" />
                    
                    {/* AI Polish Tools */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-gray-600">
                        <select 
                            value={polishInstruction}
                            onChange={(e) => setPolishInstruction(e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-white outline-none"
                        >
                            <option value="Fix grammar and spelling">Korjaa kielioppi</option>
                            <option value="Make it more professional">Ammattimaisemmaksi</option>
                            <option value="Make it easier to read">Selkeytä</option>
                            <option value="Optimize for SEO keywords">SEO-optimointi</option>
                        </select>
                        <button
                            onClick={handlePolishContent}
                            disabled={polishing}
                            className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1.5 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50 font-medium"
                        >
                            {polishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Parannus
                        </button>
                    </div>
                </div>
            )}

            {tab === 'edit' ? (
                <textarea 
                    ref={textareaRef}
                    name="content" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={25}
                    className="w-full px-4 py-4 bg-transparent text-gray-900 dark:text-white focus:outline-none font-mono text-sm leading-relaxed"
                    placeholder="Kirjoita sisältö tähän (Markdown)..."
                />
            ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none p-6 min-h-[500px] overflow-y-auto">
                    {content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-gray-500 italic">Ei sisältöä esikatseltavaksi.</p>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Kansikuva URL</label>
            <input 
                type="text" 
                name="featuredImage" 
                defaultValue={post?.featuredImage || ''} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
      </div>

      <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 relative">
        <div className="absolute top-6 right-6">
             <button
                onClick={handleOptimizeSeo}
                disabled={optimizingSeo}
                className="flex items-center gap-2 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50 font-medium"
            >
                {optimizingSeo ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                Generoi SEO-tiedot
            </button>
        </div>

        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hakukoneoptimointi (SEO)</h3>
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SEO Otsikko</label>
                <input 
                    type="text" 
                    name="metaTitle" 
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
            </div>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SEO Kuvaus</label>
                <textarea 
                    name="metaDescription" 
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                />
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur py-4 z-10 -mx-6 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
             <input 
                type="checkbox" 
                id="published" 
                name="published" 
                defaultChecked={post?.published || false}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                Julkaise kirjoitus
            </label>
        </div>
        <button 
            type="submit" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25"
        >
            <Save size={18} />
            Tallenna muutokset
        </button>
      </div>
    </form>
  );
}
