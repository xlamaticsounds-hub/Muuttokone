'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import type { LeadStatus } from '@prisma/client';
import { applyAiTodo, draftReplyForTodo, resolveAiTodo, runMailCycleNow } from '@/server/ai-todo-actions';
import { LEAD_STATUS_LABELS } from '@/lib/lead-status';
import { mailtoHref } from '@/lib/reply-draft';

export type AiTodoItem = {
  id: string;
  leadId: string | null;
  type: string;
  priority: number;
  title: string;
  reason: string;
  suggestedStatus: LeadStatus | null;
};

export type MailStatus = {
  label: string; // esim. "tänään 12.15"
  stale: boolean; // ajastus ei ole lukenut aikoihin
  mode: 'suggest' | 'apply';
  summary: string | null; // edellisen ajon tulos, esim. "3 uutta viestiä · 1 ehdotus"
  error: string | null;
  neverRun: boolean; // postia ei ole luettu vielä kertaakaan
};

type Draft = { to: string; subject: string; body: string; usedCustomerMessage: boolean };

// Vasen reuna kertoo kiireellisyyden yhdellä silmäyksellä (värin lisäksi teksti ruudunlukijalle).
const PRIORITY_STYLES: Record<number, { border: string; label: string }> = {
  1: { border: 'border-l-red-500', label: 'Kiireellinen' },
  2: { border: 'border-l-amber-400', label: 'Normaali' },
  3: { border: 'border-l-gray-300 dark:border-l-gray-600', label: 'Matala' },
};

const DRAFTABLE = new Set(['needs_reply', 'follow_up']);
const COLLAPSED_LIMIT = 5; // ensin tärkeimmät, loput "Näytä kaikki" -napin takaa

// Kosketuskohteet: puhelimella vähintään 44 px korkeita ja tekstit luettavia (text-sm), työpöydällä tiiviimpiä.
const btn =
  'inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold disabled:opacity-50 lg:min-h-0 lg:flex-none lg:rounded-md lg:py-1.5 lg:text-xs';
const primaryBtn = `${btn} basis-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 lg:basis-auto`;
const outlineBtn = `${btn} border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`;
const doneBtn = `${btn} border border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20`;
const ghostBtn = `${btn} text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700`;

export default function AiTodoList({ items, totalOpen, mailStatus }: { items: AiTodoItem[]; totalOpen: number; mailStatus: MailStatus }) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Puhelimella vain yksi rivi on auki kerrallaan (ylin oletuksena); työpöydällä kaikki näkyvät aina.
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const [showAll, setShowAll] = useState(false);
  const [, startTransition] = useTransition();

  const remaining = items.filter((item) => !hidden.has(item.id));
  const visible = showAll ? remaining : remaining.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = remaining.length - visible.length;

  const run = async (id: string, action: () => Promise<{ success: boolean; message?: string }>) => {
    setBusyId(id);
    setError(null);
    try {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? 'Toiminto epäonnistui.');
        return;
      }
      setHidden((prev) => new Set(prev).add(id));
      // Hoidettu rivi poistuu ja seuraava aukeaa, jolloin listaa voi käydä läpi yhdellä peukalolla
      setOpenId(remaining.find((item) => item.id !== id)?.id ?? null);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toiminto epäonnistui.');
    } finally {
      setBusyId(null);
    }
  };

  const makeDraft = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const result = await draftReplyForTodo(id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setDrafts((prev) => ({ ...prev, [id]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Luonnoksen teko epäonnistui.');
    } finally {
      setBusyId(null);
    }
  };

  const updateDraft = (id: string, patch: Partial<Draft>) => setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const copyDraft = async (id: string) => {
    const d = drafts[id];
    try {
      await navigator.clipboard.writeText(`${d.subject}\n\n${d.body}`);
      setCopied(id);
      setTimeout(() => setCopied((current) => (current === id ? null : current)), 2000);
    } catch {
      setError('Kopiointi ei onnistunut — valitse teksti ja kopioi käsin.');
    }
  };

  const refreshNow = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const result = await runMailCycleNow();
      setRefreshMessage({ ok: result.success, text: result.message });
      startTransition(() => router.refresh());
    } catch (e) {
      setRefreshMessage({ ok: false, text: e instanceof Error ? e.message : 'Lukeminen epäonnistui.' });
    } finally {
      setRefreshing(false);
    }
  };

  const needsAttention = mailStatus.stale || Boolean(mailStatus.error);
  const refreshButton = (
    <button
      type="button"
      onClick={refreshNow}
      disabled={refreshing}
      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-current px-3 text-xs font-semibold disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Luetaan…' : 'Päivitä nyt'}
    </button>
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Huomio
        </h2>
        {totalOpen > 0 && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {totalOpen} avointa
          </span>
        )}
      </div>

      {/* Varoitus näkyy ylhäällä vain jos lukeminen ei toimi; muuten tilarivi on listan alla */}
      {needsAttention && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-900/20 dark:text-amber-200">
          <p>
            <AlertTriangle className="mr-1.5 inline h-4 w-4 align-text-bottom" />
            {mailStatus.error ? (
              <>Postin luku epäonnistui: {mailStatus.error}</>
            ) : mailStatus.neverRun ? (
              <>AI ei ole vielä lukenut postia. Paina &quot;Päivitä nyt&quot; tai tarkista ajastus.</>
            ) : (
              <>
                AI ei ole lukenut postia aikoihin (viimeksi: <strong>{mailStatus.label}</strong>). Tarkista ajastus.
              </>
            )}
          </p>
          {refreshButton}
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {remaining.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-50 px-4 py-8 text-center dark:bg-gray-700/30">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <p className="font-medium text-gray-800 dark:text-gray-100">Ei huomioitavaa</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI lukee postit ja ilmoittaa, kun jokin vaatii toimenpiteitä.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((item) => {
            const style = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES[2];
            const busy = busyId === item.id;
            const draft = drafts[item.id];
            const open = openId === item.id;
            return (
              <li key={item.id} className={`rounded-lg border border-l-4 border-gray-100 dark:border-gray-700 ${style.border}`}>
                {/* Otsikkorivi: puhelimella napautus avaa/sulkee, työpöydällä kaikki ovat aina auki */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex min-h-14 w-full items-start gap-2 px-3 py-3 text-left lg:min-h-0 lg:cursor-default lg:pb-1"
                >
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">{style.label}: </span>
                    <span className="block font-medium leading-snug text-gray-900 dark:text-white">{item.title}</span>
                    {!open && <span className="mt-0.5 line-clamp-1 text-xs text-gray-500 lg:hidden dark:text-gray-400">{item.reason}</span>}
                  </span>
                  <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform lg:hidden ${open ? 'rotate-180' : ''}`} />
                </button>

                <div className={`${open ? 'block' : 'hidden'} px-3 pb-3 lg:block`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.reason}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.suggestedStatus && item.leadId && (
                      <button type="button" disabled={busy} onClick={() => run(item.id, () => applyAiTodo(item.id))} className={primaryBtn}>
                        Vaihda tilaksi {LEAD_STATUS_LABELS[item.suggestedStatus]}
                      </button>
                    )}
                    {DRAFTABLE.has(item.type) && item.leadId && !draft && (
                      <button type="button" disabled={busy} onClick={() => makeDraft(item.id)} className={primaryBtn}>
                        {busy ? 'Kirjoitetaan…' : item.type === 'follow_up' ? 'Luonnos muistutukseksi' : 'Luonnos vastaukseksi'}
                      </button>
                    )}
                    {item.leadId && (
                      <Link href={`/hallinta/liidit/${item.leadId}`} className={outlineBtn}>
                        Avaa liidi
                      </Link>
                    )}
                    {!item.suggestedStatus && (
                      <button type="button" disabled={busy} onClick={() => run(item.id, () => resolveAiTodo(item.id, 'DONE'))} className={doneBtn}>
                        Valmis
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => run(item.id, () => resolveAiTodo(item.id, 'DISMISSED'))} className={ghostBtn}>
                      Ohita
                    </button>
                  </div>

                  {draft && (
                    <div className="mt-3 space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/40 dark:bg-blue-900/10">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Luonnos vastaanottajalle <strong className="break-all">{draft.to}</strong> — tarkista ja muokkaa ennen lähetystä.
                        {item.type === 'needs_reply' && !draft.usedCustomerMessage && (
                          <span className="ml-1 text-amber-700 dark:text-amber-300">Asiakkaan viestiä ei saatu haettua, joten luonnos on yleinen.</span>
                        )}
                      </p>
                      {/* 16 px (text-base) puhelimella: pienempi fontti saa iPhonen zoomaamaan kenttään */}
                      <input
                        value={draft.subject}
                        onChange={(e) => updateDraft(item.id, { subject: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base lg:text-sm dark:border-gray-600 dark:bg-gray-800"
                        aria-label="Aihe"
                      />
                      <textarea
                        value={draft.body}
                        onChange={(e) => updateDraft(item.id, { body: e.target.value })}
                        rows={10}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base lg:text-sm dark:border-gray-600 dark:bg-gray-800"
                        aria-label="Viesti"
                      />
                      <div className="flex flex-wrap gap-2">
                        <a href={mailtoHref(draft.to, draft.subject, draft.body)} className={primaryBtn}>
                          Avaa sähköpostissa
                        </a>
                        <button type="button" onClick={() => copyDraft(item.id)} className={outlineBtn}>
                          {copied === item.id ? 'Kopioitu ✓' : 'Kopioi'}
                        </button>
                        <button type="button" onClick={() => makeDraft(item.id)} disabled={busy} className={outlineBtn}>
                          {busy ? 'Kirjoitetaan…' : 'Uusi luonnos'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDrafts((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            })
                          }
                          className={ghostBtn}
                        >
                          Sulje
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Kun viesti on lähtenyt, paina &quot;Valmis&quot;.</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Näytä loput {hiddenCount}
        </button>
      )}
      {showAll && totalOpen > remaining.length && hidden.size === 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Näytetään tärkeimmät {remaining.length}, yhteensä {totalOpen} avointa.</p>
      )}

      {/* Tilarivi: milloin AI luki postit viimeksi (varoitus ylhäällä jos ei ole lukenut aikoihin) */}
      {!needsAttention && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p className="min-w-0">
            AI luki postit <strong className="font-semibold text-gray-700 dark:text-gray-200">{mailStatus.label}</strong>
            {mailStatus.summary && <span className="hidden sm:inline"> · {mailStatus.summary}</span>}
            <span className="hidden lg:inline"> · {mailStatus.mode === 'suggest' ? 'ehdotustila (AI ei muuta mitään itse)' : 'automaattitila'}</span>
          </p>
          {refreshButton}
        </div>
      )}
      {refreshMessage && (
        <p className={`mt-2 text-xs ${refreshMessage.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-300'}`}>{refreshMessage.text}</p>
      )}
    </section>
  );
}
