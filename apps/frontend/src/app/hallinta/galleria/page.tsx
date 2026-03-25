'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Link as LinkIcon, Image as ImageIcon, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface DBImage {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export default function GalleriaPage() {
  const [images, setImages] = useState<DBImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      setImages(data);
    } catch (error) {
      toast.error('Kuvien haku epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Kuva ladattu onnistuneesti');
        fetchImages();
      } else {
        toast.error('Lataus epäonnistui');
      }
    } catch (error) {
      toast.error('Lataus epäonnistui');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haluatko varmasti poistaa kuvan?')) return;

    try {
      const res = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Kuva poistettu');
        setImages(images.filter((img) => img.id !== id));
      }
    } catch (error) {
      toast.error('Poisto epäonnistui');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL kopioitu leikepöydälle');
  };

  const [selectedImage, setSelectedImage] = useState<DBImage | null>(null);

  const [migrating, setMigrating] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/images/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Synkronoitu ${data.count} kuvaa pilvestä!`);
        fetchImages();
      } else {
        toast.error(data.error || 'Synkronointi epäonnistui');
      }
    } catch (err) {
      toast.error('Virhe synkronoinnissa');
    } finally {
      setSyncing(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const res = await fetch('/api/images/migrate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Siirretty ${data.count} kuvaa pilveen!`);
        fetchImages();
      } else {
        toast.error(data.error || 'Siirto epäonnistui');
      }
    } catch (err) {
      toast.error('Virhe siirrossa');
    } finally {
      setMigrating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Haluatko varmasti poistaa kaikki kuvatiedot tietokannasta? Tämä ei poista tiedostoja pilvestä.')) return;
    try {
      const res = await fetch('/api/images/migrate', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Galleria tyhjennetty');
        fetchImages();
      }
    } catch (err) {
      toast.error('Tyhjennys epäonnistui');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Galleria</h1>
          <p className="text-sm text-gray-500">Hallinnoi ja lataa sivuston kuvia.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="text-gray-400 hover:text-red-600 p-2.5 rounded-lg transition-all"
            title="Nollaa Galleria"
          >
            <Trash2 size={20} />
          </button>

          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            {syncing ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
            {syncing ? 'Synkronoidaan...' : 'Sync from GCS'}
          </button>

          <button 
            onClick={handleMigrate}
            disabled={migrating}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
          >
            {migrating ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
            {migrating ? 'Siirretään...' : 'Push to GCP'}
          </button>

          <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {uploading ? 'Ladataan...' : 'Lataa kuva'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-10 h-10 text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map((img) => {
            const displayUrl = img.url.startsWith('https://storage.googleapis.com') 
              ? `/api/images/${img.id}/file` 
              : img.url;

            return (
              <div key={img.id} className="group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                  <img 
                    src={displayUrl} 
                    alt={img.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!img.url.startsWith('https://storage.googleapis.com')) {
                        // Fallback logic for local
                        target.src = `/images/${img.name}`;
                      }
                    }}
                  />
                <div className="absolute top-2 left-2 flex gap-1">
                  {img.url.startsWith('https://storage.googleapis.com') ? (
                    <span className="bg-green-500/80 text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold backdrop-blur-sm">GCS</span>
                  ) : (
                    <span className="bg-yellow-500/80 text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold backdrop-blur-sm">Local</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => setSelectedImage(img)}
                    className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Avaa"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => copyUrl(img.url)}
                    className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Kopioi URL"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(img.id)}
                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                    title="Poista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={img.name}>
                  {img.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  {(img.size / 1024 / 1024).toFixed(2)} MB • {img.type.split('/')[1]}
                </p>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {selectedImage && (
        <ImageDetailModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
          onUpdate={(updated) => {
            setImages(images.map(img => img.id === updated.id ? updated : img));
            setSelectedImage(updated);
          }}
        />
      )}

      {!loading && images.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ei kuvia galleriassa. Aloita lataamalla ensimmäinen kuva!</p>
        </div>
      )}
    </div>
  );
}

function ImageDetailModal({ image, onClose, onUpdate }: { image: DBImage, onClose: () => void, onUpdate: (updated: DBImage) => void }) {
  const [processing, setProcessing] = useState<string | null>(null);
  
  const displayUrl = image.url.startsWith('https://storage.googleapis.com') 
    ? `/api/images/${image.id}/file` 
    : image.url;

  const handleAction = async (action: 'upscale' | 'compress') => {
    setProcessing(action);
    try {
      const res = await fetch(`/api/images/${image.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const updatedImage = await res.json();
        toast.success(`Kuva ${action === 'upscale' ? 'suurennettu' : 'pienennetty'} onnistuneesti`);
        onUpdate(updatedImage);
      } else {
        toast.error('Käsittely epäonnistui');
      }
    } catch (error) {
      toast.error('Virhe käsittelyssä');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col md:flex-row h-[80vh]">
        {/* Left: Image Preview */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-8 overflow-hidden">
          <img src={displayUrl} alt={image.name} className="max-w-full max-h-full object-contain shadow-lg rounded" />
        </div>

        {/* Right: Toolbox */}
        <div className="w-full md:w-80 border-l border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white truncate pr-4">{image.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Työkalut</h3>
              {/* #TODO not working fix */}
              <button 
                onClick={() => handleAction('compress')}
                disabled={true}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-slate-800 opacity-50 cursor-not-allowed text-gray-400 transition-all border border-transparent"
              >
                {processing === 'compress' ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                <div className="text-left">
                  <p className="font-bold text-sm">Optimoi (WebP)</p>
                  <p className="text-[10px]">Väliaikaisesti poissa käytöstä</p>
                </div>
              </button>

              <button 
                onClick={() => handleAction('upscale')}
                disabled={true}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-slate-800 opacity-50 cursor-not-allowed text-gray-400 transition-all border border-transparent"
              >
                {processing === 'upscale' ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                <div className="text-left">
                  <p className="font-bold text-sm">Paranna laatua</p>
                  <p className="text-[10px]">Väliaikaisesti poissa käytöstä</p>
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Tiedot</h3>
              <div className="text-sm space-y-1">
                <p className="text-gray-500 flex justify-between">Koko: <span className="text-gray-900 dark:text-white">{(image.size / 1024).toFixed(0)} KB</span></p>
                <p className="text-gray-500 flex justify-between">Tyyppi: <span className="text-gray-900 dark:text-white uppercase">{image.type.split('/')[1]}</span></p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-slate-800/50">
            <button 
              onClick={() => navigator.clipboard.writeText(image.url)}
              className="w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-3 rounded-lg font-bold border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center gap-2"
            >
              <LinkIcon size={16} />
              Kopioi URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
