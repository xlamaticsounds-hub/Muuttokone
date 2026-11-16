import type { Metadata } from 'next';
import ChecklistPageContent, { checklistMetadata } from '@/features/checklists/ChecklistPageContent';

export const metadata: Metadata = checklistMetadata('yritysmuuton-muistilista');

export default function YritysmuutonMuistilistaPage() {
  return <ChecklistPageContent slug="yritysmuuton-muistilista" />;
}
