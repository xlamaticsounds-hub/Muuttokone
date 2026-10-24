import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import { isAiConfigured } from '@/server/external-lead';
import ExternalLeadForm from './ExternalLeadForm';

export const dynamic = 'force-dynamic';

export default function UusiKeikkaPage() {
  return <ExternalLeadForm todayIso={toHelsinkiDateInput(new Date())} aiEnabled={isAiConfigured()} />;
}
