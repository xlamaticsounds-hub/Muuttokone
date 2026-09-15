// Kertakäyttöinen korjausskripti: lisää lasku nro 14:lle (Tiia Lehtisaari) puuttuva osoite.
// Ei koske mihinkään muuhun laskun kenttään (rivit, hinta, maksutiedot, viitenumero, eräpäivä).
//
// Aja projektin juuresta (apps/frontend), tuotannon DATABASE_URL:n kanssa käytettävissä:
//   node --experimental-strip-types prisma/scripts/fix-invoice-14-address.ts
//
// Skripti voi poistaa itsensä ajon jälkeen — se on tarkoitettu vain tähän yhteen korjaukseen.

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL puuttuu ympäristömuuttujista.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const invoice = await prisma.invoice.findFirst({ where: { invoiceNumber: 14 } });

  if (!invoice) {
    throw new Error('Laskua nro 14 ei löytynyt.');
  }

  if (invoice.customerName !== 'Tiia Lehtisaari') {
    throw new Error(
      `Turvatarkistus epäonnistui: lasku nro 14 asiakas on "${invoice.customerName}", odotettiin "Tiia Lehtisaari". Skripti pysäytetty, mitään ei muutettu.`,
    );
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      customerStreet: 'Postintie 12 A9',
      customerPostalCode: '24800',
      customerCity: 'Halikko',
    },
  });

  console.log('✅ Lasku nro 14 päivitetty:');
  console.log({
    customerName: updated.customerName,
    customerStreet: updated.customerStreet,
    customerPostalCode: updated.customerPostalCode,
    customerCity: updated.customerCity,
  });
}

main()
  .catch((err) => {
    console.error('❌ Virhe:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
