import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const noDatabaseMode = !connectionString;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaMock = (): PrismaClient => {
  type MockRecord = Record<string, unknown> & { id: string; createdAt: Date; updatedAt: Date };
  // Keyed by lowercased Prisma model name (e.g. "post", "contact"). Any model
  // works out of the box instead of only the few hardcoded here previously —
  // that gap silently dropped every write for models like Post/PageContent/Image.
  type MockStore = Record<string, MockRecord[]>;

  const storeFilePath = path.join(process.cwd(), '.mock-prisma-store.json');

  const reviveDates = (rows: any[] = []): MockRecord[] => {
    return rows.map((row) => ({
      ...row,
      createdAt: row?.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row?.updatedAt ? new Date(row.updatedAt) : new Date(),
    }));
  };

  const loadStoreFromDisk = (): MockStore => {
    try {
      if (!fs.existsSync(storeFilePath)) return {};
      const raw = fs.readFileSync(storeFilePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, any[]>;
      const revived: MockStore = {};
      for (const [model, rows] of Object.entries(parsed)) {
        revived[model] = reviveDates(rows);
      }
      return revived;
    } catch {
      return {};
    }
  };

  const globalWithMockStore = globalThis as typeof globalThis & { __mockPrismaStore?: MockStore };

  const store: MockStore =
    globalWithMockStore.__mockPrismaStore ??
    (globalWithMockStore.__mockPrismaStore = loadStoreFromDisk());

  const saveStoreToDisk = () => {
    try {
      fs.writeFileSync(storeFilePath, JSON.stringify(store, null, 2), 'utf8');
    } catch {
      // Best effort persistence for local mock mode.
    }
  };

  const mockRecord = () => ({
    id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const applyWhere = (rows: MockRecord[], where?: Record<string, any>) => {
    if (!where) return rows;
    return rows.filter((row) => {
      return Object.entries(where).every(([key, value]) => {
        const current = row[key];
        if (value && typeof value === 'object') {
          if (Array.isArray(value.notIn)) return !value.notIn.includes(current);
          return true;
        }
        return current === value;
      });
    });
  };

  const applyOrderBy = (rows: MockRecord[], orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>) => {
    if (!orderBy) return rows;
    const orderItems = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const order of orderItems) {
        const [key, dir] = Object.entries(order)[0] || [];
        if (!key) continue;
        const av = a[key] as any;
        const bv = b[key] as any;
        if (av == null && bv == null) continue;
        if (av == null) return dir === 'asc' ? -1 : 1;
        if (bv == null) return dir === 'asc' ? 1 : -1;
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getRows = (model: string) => {
    if (!store[model]) store[model] = [];
    return store[model];
  };

  const createModelProxy = (model: string) =>
    new Proxy(
      {},
      {
        get(_modelTarget, operation) {
          return async (args?: any) => {
            const op = String(operation);
            const rows = getRows(model);

            if (op === 'findMany') {
              let result = applyWhere(rows, args?.where);
              result = applyOrderBy(result, args?.orderBy);
              if (typeof args?.take === 'number') result = result.slice(0, args.take);

              if (model === 'lead' && args?.include?.contact) {
                return result.map((lead) => ({
                  ...lead,
                  contact: getRows('contact').find((c) => c.id === lead.contactId) ?? null,
                }));
              }

              if (model === 'contact' && (args?.include?._count || args?.include?.leads)) {
                return result.map((contact) => {
                  const contactLeads = getRows('lead').filter((lead) => lead.contactId === contact.id);
                  const enriched: Record<string, unknown> = { ...contact };
                  if (args?.include?._count?.select?.leads) {
                    enriched._count = { leads: contactLeads.length };
                  }
                  if (args?.include?.leads) {
                    let limited = applyOrderBy(contactLeads, args.include.leads.orderBy);
                    if (typeof args.include.leads.take === 'number') limited = limited.slice(0, args.include.leads.take);
                    enriched.leads = limited;
                  }
                  return enriched;
                });
              }

              return result;
            }

            if (op === 'findFirst') {
              const result = applyWhere(rows, args?.where);
              return result[0] ?? null;
            }

            if (op === 'findUnique') {
              if (!args?.where) return null;
              const [key, value] = Object.entries(args.where)[0] || [];
              return rows.find((r) => r[key] === value) ?? null;
            }

            if (op === 'create') {
              const base = mockRecord();
              const data = args?.data ?? {};
              if (model === 'lead') {
                const contactId = data.contact?.connect?.id ?? data.contactId ?? null;
                const record = { ...base, ...data, contactId, contact: undefined } as MockRecord;
                rows.unshift(record);
                saveStoreToDisk();
                return record;
              }
              const record = { ...base, ...data } as MockRecord;
              rows.unshift(record);
              saveStoreToDisk();
              return record;
            }

            if (op === 'update') {
              const [key, value] = Object.entries(args?.where ?? {})[0] || [];
              const idx = rows.findIndex((r) => r[key] === value);
              if (idx === -1) return null;
              const updated = { ...rows[idx], ...(args?.data ?? {}), updatedAt: new Date() } as MockRecord;
              rows[idx] = updated;
              saveStoreToDisk();
              return updated;
            }

            if (op === 'upsert') {
              const existing = await (createModelProxy(model) as any).findUnique({ where: args?.where });
              if (existing) {
                return (createModelProxy(model) as any).update({ where: args?.where, data: args?.update });
              }
              return (createModelProxy(model) as any).create({ data: args?.create });
            }

            if (op === 'delete') {
              const [key, value] = Object.entries(args?.where ?? {})[0] || [];
              const idx = rows.findIndex((r) => r[key] === value);
              if (idx === -1) return null;
              const [deleted] = rows.splice(idx, 1);
              saveStoreToDisk();
              return deleted;
            }

            if (op === 'count') {
              return applyWhere(rows, args?.where).length;
            }

            if (op === 'createMany' || op === 'updateMany' || op === 'deleteMany') {
              return { count: 0 };
            }

            if (op === 'groupBy') return [];

            return null;
          };
        },
      }
    );

  return new Proxy(
    {
      $connect: async () => undefined,
      $disconnect: async () => undefined,
      $transaction: async () => [],
    } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof typeof target];
        }
        return createModelProxy(String(prop));
      },
    }
  ) as PrismaClient;
};

const createPrismaClient = () => {
  if (noDatabaseMode) {
    console.warn('[db] DATABASE_URL puuttuu - kaytetaan mock-tietokantaa');
    return createPrismaMock();
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;