// src/server/repo/leads.ts
import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

export async function createLead(data: Prisma.LeadCreateInput) {
  return prisma.lead.create({ data });
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({ where: { id }, data });
}
