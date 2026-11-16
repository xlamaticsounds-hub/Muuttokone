'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Printer, RotateCcw } from 'lucide-react';
import type { ChecklistPhase } from './checklists';

// Rastitettava muistilista. Rastit tallennetaan vain kävijän omaan selaimeen (localStorage); jos tallennus
// ei ole käytettävissä (yksityinen ikkuna tms.), lista toimii silti. Palvelin renderöi kaikki kohdat,
// joten sisältö näkyy hakukoneille ja tulosteessa.
export default function InteractiveChecklist({ phases, storageKey }: { phases: ChecklistPhase[]; storageKey: string }) {
  const ids = useMemo(() => phases.flatMap((phase) => phase.items.map((_, i) => `${phase.id}:${i}`)), [phases]);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(saved)) setDone(new Set(saved.filter((id): id is string => typeof id === 'string' && ids.includes(id))));
    } catch {
      // ei tallennettuja rasteja
    }
  }, [storageKey, ids]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // tallennus ei käytettävissä
      }
      return next;
    });
  };

  const reset = () => {
    setDone(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // tallennus ei käytettävissä
    }
  };

  const progress = ids.length ? Math.round((done.size / ids.length) * 100) : 0;

  return (
    <div>
      {/* Edistyminen ja toiminnot (ei tulosteessa) */}
      <div className="sticky top-20 z-30 mb-8 rounded-2xl border border-black/5 bg-white/95 p-4 shadow-md ring-1 ring-black/5 backdrop-blur print:hidden dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 flex justify-between text-sm font-medium text-black/80 dark:text-white/80">
              <span>Tehty {done.size} / {ids.length}</span>
              <span>{progress} %</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> Tulosta lista
          </button>
          {done.size > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-black/70 hover:border-primary dark:border-gray-700 dark:text-white/70"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Tyhjennä rastit
            </button>
          )}
        </div>
      </div>

      <ol className="relative space-y-6 print:space-y-4">
        {phases.map((phase, phaseIndex) => {
          const phaseDone = phase.items.every((_, i) => done.has(`${phase.id}:${i}`));
          return (
            <li key={phase.id} id={phase.id} className="scroll-mt-40 break-inside-avoid">
              <section
                className={`rounded-2xl border bg-white/85 p-6 shadow-sm ring-1 transition md:p-8 print:border-black/20 print:p-4 print:shadow-none dark:bg-slate-900/70 ${
                  phaseDone ? 'border-green-500/40 ring-green-500/30' : 'border-black/5 ring-black/5 dark:border-white/10 dark:ring-white/5'
                }`}
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="bg-primary/10 relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl print:hidden">
                    <Image src={phase.icon} alt="" width={112} height={112} className="h-11 w-11 object-contain" />
                    <span className="bg-primary absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {phaseIndex + 1}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-black/90 dark:text-white">{phase.title}</h2>
                  {phaseDone && <span className="ml-auto rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 print:hidden dark:text-green-400">Valmis ✓</span>}
                </div>
                <ul className="space-y-3">
                  {phase.items.map((item, i) => {
                    const id = `${phase.id}:${i}`;
                    const checked = done.has(id);
                    return (
                      <li key={id}>
                        <label className="group flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(id)}
                            className="accent-primary mt-1 h-5 w-5 shrink-0 cursor-pointer rounded"
                          />
                          <span className={`text-black/80 transition dark:text-white/80 ${checked ? 'text-black/40 line-through dark:text-white/40' : ''}`}>
                            {item.text}
                            {item.link && (
                              <>
                                {' '}
                                <Link href={item.link.href} className="text-primary font-semibold no-underline hover:underline print:hidden">
                                  {item.link.label} →
                                </Link>
                              </>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
