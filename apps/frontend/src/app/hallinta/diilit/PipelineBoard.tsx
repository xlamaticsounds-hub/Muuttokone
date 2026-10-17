'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Phone, Sparkles } from 'lucide-react';
import type { LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '@/server/actions';
import { applyAiTodo } from '@/server/ai-todo-actions';
import { LEAD_STATUS_LABELS, LEAD_STATUS_PILL_CLASSES, SELECTABLE_LEAD_STATUSES, isCompletedStatus } from '@/lib/lead-status';
import { formatDaysAgo, nextStage, todoBadge } from '@/lib/pipeline';
import type { PipelineCardData, PipelineColumn, PipelineSummaryItem } from '@/server/pipeline-data';
import CompleteLeadDialog from '../liidit/CompleteLeadDialog';
import type { CompleteLeadTarget } from '../liidit/complete-target';

// Kosketuskohteet: puhelimella vähintään 44 px, työpöydällä tiiviimpi.
const control = 'min-h-11 rounded-lg py-1.5 text-sm font-semibold leading-tight disabled:opacity-50 lg:min-h-9 lg:text-xs';

// Tuotannossa Next piilottaa palvelintoiminnon virheviestin ("...omitted in production builds"), joten sellaisen tilalle
// näytetään selkokielinen ohje. Odotettavat virheet (esim. Maksettu tekemättömälle keikalle) estetään jo valikossa.
const friendlyError = (e: unknown, fallback: string) =>
  e instanceof Error && e.message && !/Server Components render|omitted in production/i.test(e.message) ? e.message : fallback;

// Laskutettu ja Maksettu vaativat että keikka on ensin merkitty tehdyksi (lopullinen hinta + toteutumispäivä)
const optionsFor = (card: PipelineCardData) =>
  SELECTABLE_LEAD_STATUSES.filter((status) => status !== card.status && (!['INVOICED', 'PAID'].includes(status) || isCompletedStatus(card.status)));

const needsAttention = (card: PipelineCardData) => card.todos.length > 0 || Boolean(card.lastMail?.unanswered);

export default function PipelineBoard({
  columns,
  summary,
  initialStage,
}: {
  columns: PipelineColumn[];
  summary: PipelineSummaryItem[];
  initialStage: LeadStatus | null;
}) {
  const router = useRouter();
  const firstNonEmpty = columns.find((column) => column.total > 0)?.status ?? columns[0]?.status;
  const [selected, setSelected] = useState<LeadStatus>(initialStage && columns.some((c) => c.status === initialStage) ? initialStage : firstNonEmpty);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<CompleteLeadTarget | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => startTransition(() => router.refresh());

  const move = async (card: PipelineCardData, to: LeadStatus) => {
    if (to === card.status) return;
    // Tehty vaatii lopullisen hinnan (kumppaniraportti ja palkkio), joten se kysytään dialogissa
    if (to === 'COMPLETED') {
      setCompleting(card.completeTarget);
      return;
    }
    setBusyId(card.id);
    setError(null);
    try {
      await updateLeadStatus(card.id, to);
      refresh();
    } catch (e) {
      setError(friendlyError(e, 'Tilan vaihto epäonnistui. Päivitä sivu ja yritä uudelleen.'));
    } finally {
      setBusyId(null);
    }
  };

  const applySuggestion = async (card: PipelineCardData, todoId: string) => {
    setBusyId(card.id);
    setError(null);
    try {
      const result = await applyAiTodo(todoId);
      if (!result.success) setError(result.message);
      else refresh();
    } catch (e) {
      setError(friendlyError(e, 'Ehdotuksen hyväksyminen epäonnistui. Päivitä sivu ja yritä uudelleen.'));
    } finally {
      setBusyId(null);
    }
  };

  const totalCards = columns.reduce((sum, column) => sum + column.total, 0);

  return (
    <div className="space-y-4">
      {/* Yhteenveto: paljonko rahaa on missäkin vaiheessa (hinnat sis. alv) */}
      <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-3">
        {summary.map((item) => (
          <div key={item.key} title={item.hint} className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 lg:min-w-40 dark:border-gray-700 dark:bg-gray-800">
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className="truncate text-base font-bold leading-tight text-gray-900 lg:text-lg dark:text-white">{item.sumLabel ?? '–'}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.count} kpl</p>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} className="font-semibold underline">
            Sulje
          </button>
        </div>
      )}

      {totalCards === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Pipeline on tyhjä: ei aktiivisia liidejä.
        </div>
      )}

      {totalCards > 0 && (
        <>
          {/* Puhelin ja tabletti: vaihe kerrallaan. Tyhjät vaiheet piilotetaan (valittu näkyy aina). */}
          <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Vaiheet">
            <div className="flex gap-2">
              {columns
                .filter((column) => column.total > 0 || column.status === selected)
                .map((column) => {
                  const active = column.status === selected;
                  const attention = column.cards.some(needsAttention);
                  return (
                    <button
                      key={column.status}
                      type="button"
                      onClick={() => setSelected(column.status)}
                      aria-pressed={active}
                      className={`relative flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {LEAD_STATUS_LABELS[column.status]}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-700'}`}>{column.total}</span>
                      {attention && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500 dark:border-gray-900" aria-label="Vaatii huomiota" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Sarakkeet: puhelimella vain valittu, työpöydällä kaikki rinnakkain */}
          <div className="lg:flex lg:gap-4 lg:overflow-x-auto lg:pb-3">
            {columns.map((column) => (
              <section
                key={column.status}
                className={`${column.status === selected ? 'block' : 'hidden'} rounded-xl border border-gray-200 bg-gray-50/60 lg:block lg:w-64 lg:flex-shrink-0 2xl:w-72 dark:border-gray-700 dark:bg-gray-900/40`}
              >
                {/* Puhelimella valittu vaihe näkyy jo napissa, joten otsikon tilalla on vain yhteenvetorivi */}
                <p className="px-3 pt-2 text-xs text-gray-500 lg:hidden dark:text-gray-400">
                  {column.total} {column.total === 1 ? 'liidi' : 'liidiä'}
                  {column.sumLabel && ` · yhteensä ${column.sumLabel}${column.missingValue > 0 ? '+' : ''}`}
                </p>
                <div
                  className={`hidden items-center justify-between gap-2 rounded-t-xl border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide lg:flex dark:border-gray-700 ${LEAD_STATUS_PILL_CLASSES[column.status]}`}
                >
                  <span>{LEAD_STATUS_LABELS[column.status]}</span>
                  <span className="flex items-center gap-2 normal-case">
                    {column.sumLabel && (
                      <span title={column.missingValue > 0 ? `${column.missingValue} liidiltä puuttuu hinta, joten summa on vähintään tämä` : 'Hinnat sis. alv (arvio, jos lopullista hintaa ei ole)'}>
                        {column.sumLabel}
                        {column.missingValue > 0 && '+'}
                      </span>
                    )}
                    <span className="rounded-full bg-white/60 px-2 py-0.5 dark:bg-black/20">{column.total}</span>
                  </span>
                </div>

                <div className="space-y-2 p-2">
                  {column.cards.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-gray-400 dark:text-gray-500">Ei liidejä tässä vaiheessa.</p>
                  ) : (
                    column.cards.map((card) => (
                      <PipelineCard key={card.id} card={card} busy={busyId === card.id} onMove={move} onApply={applySuggestion} />
                    ))
                  )}
                  {column.total > column.cards.length && (
                    <Link
                      href={`/hallinta/liidit?tila=${column.status}`}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-white dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Näytä kaikki {column.total} →
                    </Link>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {completing && (
        <CompleteLeadDialog
          target={completing}
          onClose={() => setCompleting(null)}
          onSaved={() => {
            setCompleting(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function PipelineCard({
  card,
  busy,
  onMove,
  onApply,
}: {
  card: PipelineCardData;
  busy: boolean;
  onMove: (card: PipelineCardData, to: LeadStatus) => void;
  onApply: (card: PipelineCardData, todoId: string) => void;
}) {
  const next = nextStage(card.status);
  const suggestion = card.todos.find((todo) => todo.suggestedStatus);
  const hasReplyTodo = card.todos.some((todo) => todo.type === 'needs_reply');
  const badges = card.todos.map((todo) => ({ id: todo.id, text: todoBadge(todo.type) })).filter((badge): badge is { id: string; text: string } => Boolean(badge.text));
  const showMailLine = card.lastMail && (card.lastMail.summary || card.lastMail.unanswered || card.lastMail.direction === 'in');

  return (
    <article className={`space-y-2 rounded-xl border bg-white p-3 shadow-sm dark:bg-gray-800 ${busy ? 'opacity-60' : ''} ${card.stale ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/hallinta/liidit/${card.id}`} className="min-w-0 text-base font-semibold leading-snug text-gray-900 hover:text-blue-700 dark:text-white">
          {card.name}
        </Link>
        {card.partner && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-900/20 dark:text-green-300" title={`${card.partner}-koodi`}>
            🏠
          </span>
        )}
      </div>

      {(card.moveDate || card.route) && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {card.moveDate && <span className="mr-2 font-semibold text-blue-600 dark:text-blue-400">{card.moveDate}</span>}
          {card.route && <span className="line-clamp-2">{card.route}</span>}
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {card.valueLabel && <span className="mr-1.5 text-sm font-bold text-gray-900 dark:text-white">{card.valueLabel}</span>}
        <span className={card.stale ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}>
          {card.stale && '⏳ '}päivitetty {formatDaysAgo(card.ageDays)}
        </span>
      </p>

      {/* AI:n ehdotus: yhdellä napautuksella voimaan */}
      {suggestion?.suggestedStatus && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
          <p className="min-w-0 text-sm font-medium text-blue-900 dark:text-blue-200">
            <Sparkles className="mr-1 inline h-4 w-4 align-text-bottom" />
            AI ehdottaa: {LEAD_STATUS_LABELS[suggestion.suggestedStatus]}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onApply(card, suggestion.id)}
            className="h-10 shrink-0 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 lg:h-8 lg:text-xs"
          >
            Hyväksy
          </button>
        </div>
      )}

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span key={badge.id} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              {badge.text}
            </span>
          ))}
        </div>
      )}

      {showMailLine && card.lastMail && (
        <p className="line-clamp-3 text-xs italic text-gray-500 dark:text-gray-400">
          {card.lastMail.direction === 'in' ? '✉ Asiakas' : '↗ Me'} {formatDaysAgo(card.lastMail.daysAgo)}
          {card.lastMail.summary ? `: ${card.lastMail.summary}` : ''}
          {card.lastMail.unanswered && !hasReplyTodo && <strong className="ml-1 not-italic text-amber-700 dark:text-amber-400">· odottaa vastaustasi</strong>}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {next && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMove(card, next)}
            className={`${control} min-w-0 flex-1 bg-blue-600 px-3 text-white hover:bg-blue-700 active:bg-blue-800`}
          >
            → {LEAD_STATUS_LABELS[next]}
          </button>
        )}
        {/* Natiivi valikko: puhelimella käyttöjärjestelmän oma valitsin. 16 px estää iPhonen zoomauksen. */}
        <select
          aria-label="Muuta tilaa"
          disabled={busy}
          value=""
          onChange={(e) => e.target.value && onMove(card, e.target.value as LeadStatus)}
          className={`${control} ${next ? 'w-24' : 'min-w-0 flex-1'} border border-gray-300 bg-white px-2 text-base text-gray-700 lg:text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200`}
        >
          <option value="">Tila…</option>
          {optionsFor(card).map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        {card.phone && (
          <a
            href={`tel:${card.phone.replace(/[^\d+]/g, '')}`}
            aria-label={`Soita: ${card.phone}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-blue-700 hover:bg-blue-50 active:bg-blue-100 lg:h-9 lg:w-9 dark:border-gray-600 dark:text-blue-300"
          >
            <Phone className="h-5 w-5 lg:h-4 lg:w-4" />
          </a>
        )}
      </div>
    </article>
  );
}
