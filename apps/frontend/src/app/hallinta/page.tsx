import { redirect } from 'next/navigation';
import { requirePageAccess } from '@/server/access';
import { homePath } from '@/lib/access';

export default async function AdminRootPage() {
  const actor = await requirePageAccess('/hallinta');
  redirect(homePath(actor.role));
}
