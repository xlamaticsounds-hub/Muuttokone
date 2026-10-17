import type { LeadStatus } from '@prisma/client';
import { PIPELINE_STAGES } from '@/lib/pipeline';
import { loadPipeline, type PipelineColumn, type PipelineSummaryItem } from '@/server/pipeline-data';
import PipelineBoard from './PipelineBoard';

export const dynamic = 'force-dynamic';

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ vaihe?: string }> }) {
  const { vaihe } = await searchParams;
  // ?vaihe=WON avaa puhelimella suoraan kyseisen vaiheen (jaettava linkki)
  const initialStage = PIPELINE_STAGES.includes(vaihe as LeadStatus) ? (vaihe as LeadStatus) : null;

  let dbUnavailable = false;
  let columns: PipelineColumn[] = [];
  let summary: PipelineSummaryItem[] = [];

  try {
    ({ columns, summary } = await loadPipeline());
  } catch (error) {
    dbUnavailable = true;
    console.warn('[hallinta/pipeline] Database unavailable, showing fallback view', error);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Puhelimella otsikko on jo yläpalkissa, joten tämä näytetään vain isommalla näytöllä */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Kaikki liidit ryhmiteltynä tilan mukaan, uudesta maksettuun.</p>
      </div>

      {dbUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Tietokantaan ei juuri nyt saada yhteyttä. Näkymä toimii, mutta tiedot eivät päivity.
        </div>
      )}

      {!dbUnavailable && <PipelineBoard columns={columns} summary={summary} initialStage={initialStage} />}
    </div>
  );
}
