// src/server/db.ts
import { PrismaClient } from '@prisma/client'

declare const globalThis: any;
const globalForPrisma = (typeof globalThis !== 'undefined' ? globalThis : {}) as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
