import type { PrismaConfig } from "prisma";
import { config } from 'dotenv';
import path from 'path';

// Load .env file
config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL || "postgresql://unused:unused@localhost:5432/unused";

const pconfig: PrismaConfig = {
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: connectionString },
};

export default pconfig satisfies PrismaConfig;