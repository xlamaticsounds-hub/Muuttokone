import type { Metadata } from 'next';
import ChecklistPageContent, { checklistMetadata } from '@/features/checklists/ChecklistPageContent';

export const metadata: Metadata = checklistMetadata('muuton-muistilista');

export default function MuutonMuistilistaPage() {
  return <ChecklistPageContent slug="muuton-muistilista" />;
}
