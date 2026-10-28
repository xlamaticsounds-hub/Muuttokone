import { prisma } from '@/server/db';
import { defaultFinalPrice } from '@/server/lead-format';
import { BOOKED_STATUSES, type BookedJob } from '@/lib/forecast';
import { leadOrigin } from '@/lib/lead-origin';

/** Ennuste-sivun ja sen tekoälyvinkkien keikat: kaikki kalenterin keikat (Uusi varaus + Voitettu). */
export async function loadBookedJobs(): Promise<BookedJob[]> {
  const leads = await prisma.lead.findMany({
    where: { status: { in: BOOKED_STATUSES } },
    include: { contact: true },
  });

  return leads.map((lead) => ({
    id: lead.id,
    status: lead.status,
    requestedDate: lead.requestedDate,
    value: defaultFinalPrice(lead),
    origin: leadOrigin(lead),
    name: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.companyName || 'Asiakas',
    route: [lead.fromAddress, lead.toAddress].filter(Boolean).join(' → '),
    // Laskurivarauksen kalenterimerkintä luodaan alustavana ja vahvistuu vasta tilassa Voitettu (google-calendar.ts)
    tentativeCalendar: lead.status === 'SCHEDULED' && Boolean(lead.calendarEventId),
  }));
}
