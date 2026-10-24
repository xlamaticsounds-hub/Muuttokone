import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { offerForLead, offerSentInfo } from '@/server/offer-data';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';
import OfferEditor from './OfferEditor';

export const dynamic = 'force-dynamic';

export default async function TarjousPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { contact: true } });
  if (!lead) notFound();

  const { offer, saved } = offerForLead(lead, toHelsinkiDateInput(new Date()));
  return <OfferEditor leadId={lead.id} initial={offer} saved={saved} contactEmail={lead.contact.email} sent={offerSentInfo(lead)} />;
}
