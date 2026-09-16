// src/server/repo/leads.ts
import { prisma } from '@/server/db';
import type { LeadStatus, Prisma } from '@prisma/client';

export async function createLead(data: Prisma.LeadCreateInput) {
  return prisma.lead.create({ data });
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({ where: { id }, data });
}

// No auth check here on purpose — this is an internal helper. The two callers
// (updateLeadStatus in server/actions.ts for the hallinta UI, and the Discord
// reaction handler in server/discord-bot.ts) each enforce their own, different
// notion of "who's allowed to do this" before calling it: a logged-in hallinta
// session for the UI, Discord's own channel permissions for a reaction.
export async function setLeadStatus(id: string, status: LeadStatus) {
  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function setLeadDiscordMessage(id: string, discordMessageId: string, discordChannelId: string) {
  return prisma.lead.update({ where: { id }, data: { discordMessageId, discordChannelId } });
}

export async function setLeadCalendarEventId(id: string, calendarEventId: string | null) {
  return prisma.lead.update({ where: { id }, data: { calendarEventId } });
}

export async function findLeadByDiscordMessageId(discordMessageId: string) {
  return prisma.lead.findFirst({ where: { discordMessageId }, include: { contact: true } });
}
