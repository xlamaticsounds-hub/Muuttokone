#!/bin/sh
set -e

echo "🔄 Checking Prisma migration state..."

# Reset any rolled-back migrations so prisma migrate deploy can re-apply them.
# This uses Node.js (already available) with the pg driver that is already a
# production dependency, so no extra tooling is needed in the Alpine image.
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.connect()
  .then(async (client) => {
    try {
      // Ensure the migrations table exists before touching it
      await client.query(\`
        CREATE TABLE IF NOT EXISTS \"_prisma_migrations\" (
          id VARCHAR(36) PRIMARY KEY,
          checksum VARCHAR(64) NOT NULL,
          finished_at TIMESTAMPTZ,
          migration_name VARCHAR(255) NOT NULL,
          logs TEXT,
          rolled_back_at TIMESTAMPTZ,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          applied_steps_count INTEGER NOT NULL DEFAULT 0
        )
      \`);

      const res = await client.query(
        'SELECT migration_name FROM \"_prisma_migrations\" WHERE rolled_back_at IS NOT NULL'
      );

      if (res.rows.length > 0) {
        console.log('⚠️  Found ' + res.rows.length + ' rolled-back migration(s). Clearing history so they can be re-applied:');
        res.rows.forEach(r => console.log('   - ' + r.migration_name));
        await client.query('DELETE FROM \"_prisma_migrations\" WHERE rolled_back_at IS NOT NULL');
        console.log('✅ Rolled-back migration records removed.');
      } else {
        console.log('✅ No rolled-back migrations found.');
      }
    } finally {
      client.release();
      await pool.end();
    }
  })
  .catch((err) => {
    console.error('❌ Failed to check migration state:', err.message);
    // Non-fatal: let prisma migrate deploy handle it
  });
"

echo "🚀 Running prisma migrate deploy..."
node_modules/.bin/prisma migrate deploy

echo "🌱 Running database seed..."
node_modules/.bin/prisma db seed || echo "⚠️  Seed skipped or already applied."

echo "▶️  Starting Next.js..."
exec node_modules/.bin/next start -p "${PORT:-3000}" -H 0.0.0.0
