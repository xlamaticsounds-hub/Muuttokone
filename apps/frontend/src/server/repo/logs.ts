// src/server/repo/logs.ts
import { prisma } from '@/server/db';

export async function createLog(params: {
  entityType: 'Lead' | 'Contact' | 'Customer' | 'Project' | 'Task';
  entityId: string;
  action: string;
  message?: string;
  data?: Record<string, unknown>;
  actorId?: string | null;
  ip?: string | null;
}) {
  return prisma.log.create({
    data: {
      ...params,
      data: params.data as any, // or use: data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined
    },
  });
}
