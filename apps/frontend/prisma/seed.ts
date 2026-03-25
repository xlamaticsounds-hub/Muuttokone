import { PrismaClient, LeadStatus, LeadSource } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // Helper to upsert contact by email since email is not unique in schema
  const upsertContact = async (data: any) => {
    const existing = await prisma.contact.findFirst({
      where: { email: data.email },
    });

    if (existing) {
      return prisma.contact.update({
        where: { id: existing.id },
        data: {
            ...data,
            gdprConsentAt: new Date(), // ensure this field is valid
        },
      });
    }

    return prisma.contact.create({
      data: {
        ...data,
        gdprConsentAt: new Date(),
      },
    });
  };

  // Create Contacts
  const contact1 = await upsertContact({
    email: 'matti.meikalainen@example.com',
    firstName: 'Matti',
    lastName: 'Meikäläinen',
    phone: '+358 40 123 4567',
    city: 'Helsinki',
    tags: ['test'],
  });

  const contact2 = await upsertContact({
    email: 'liisa.testaaja@example.com',
    firstName: 'Liisa',
    lastName: 'Testaaja',
    phone: '+358 50 987 6543',
    city: 'Tampere',
  });

  // Create Leads
  // Check if leads exist to avoid duplicates on re-seed
  const existingLead1 = await prisma.lead.findFirst({
    where: { contactId: contact1.id, status: LeadStatus.NEW },
  });

  if (!existingLead1) {
    await prisma.lead.create({
      data: {
        contactId: contact1.id,
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
        fromAddress: 'Mannerheimintie 1, Helsinki',
        toAddress: 'Hämeentie 10, Helsinki',
        requestedDate: new Date('2026-01-15'),
        volumeM3: 25.5,
        squareMeters: 45,
        floor: 3,
        hasElevator: true,
        boxCount: 20,
        notes: 'Haluaisin tarjouksen muutosta tammikuun puolivälissä.',
      },
    });
  }

  const existingLead2 = await prisma.lead.findFirst({
    where: { contactId: contact2.id, status: LeadStatus.CONTACTED },
  });

  if (!existingLead2) {
    await prisma.lead.create({
      data: {
        contactId: contact2.id,
        status: LeadStatus.CONTACTED,
        source: LeadSource.QUICK_QUOTE,
        fromAddress: 'Hämeenkatu 20, Tampere',
        toAddress: 'Kauppakatu 5, Tampere',
        requestedDate: new Date('2026-02-01'),
        volumeM3: 15,
        squareMeters: 30,
        floor: 1,
        hasElevator: false,
        boxCount: 10,
        notes: 'Opiskelijamuutto, vähän tavaraa.',
      },
    });
  }

  const existingLead3 = await prisma.lead.findFirst({
    where: { contactId: contact1.id, status: LeadStatus.WON },
  });

  if (!existingLead3) {
    await prisma.lead.create({
      data: {
        contactId: contact1.id,
        status: LeadStatus.WON,
        source: LeadSource.STEP_FORM,
        fromAddress: 'Runeberginkatu 4, Helsinki',
        toAddress: 'Bulevardi 12, Helsinki',
        requestedDate: new Date('2025-12-01'),
        volumeM3: 55,
        squareMeters: 80,
        floor: 5,
        hasElevator: true,
        boxCount: 60,
        notes: 'Iso perheasunto.',
      },
    });
  }

  // ===== BLOG SEEDING =====

  // 1. Categories
  const categoryTips = await prisma.category.upsert({
    where: { slug: 'muuttovinkit' },
    update: {},
    create: {
      name: 'Muuttovinkit',
      slug: 'muuttovinkit',
    },
  });

  const categoryNews = await prisma.category.upsert({
    where: { slug: 'uutiset' },
    update: {},
    create: {
      name: 'Uutiset',
      slug: 'uutiset',
    },
  });

  // 2. Tags
  const tagChecklist = await prisma.tag.upsert({
    where: { slug: 'muistilista' },
    update: {},
    create: {
      name: 'Muistilista',
      slug: 'muistilista',
    },
  });

  const tagSavings = await prisma.tag.upsert({
    where: { slug: 'saasto' },
    update: {},
    create: {
      name: 'Säästö',
      slug: 'saasto',
    },
  });

  // 3. Posts
  const post1 = await prisma.post.upsert({
    where: { slug: 'onnistuneen-muuton-abc' },
    update: {
      published: true,
      publishedAt: new Date(), 
    },
    create: {
      title: 'Onnistuneen muuton ABC',
      slug: 'onnistuneen-muuton-abc',
      excerpt: 'Mitä kaikkea onnistunut muutto vaatii? Tässä kattava opas.',
      content: `
# Onnistuneen muuton ABC

Muuttaminen on iso elämänmuutos, ja se voi aiheuttaa stressiä. Hyvällä suunnittelulla selviät kuitenkin voittajana.

## 1. Suunnittele ajoissa
Aloita pakkaaminen hyvissä ajoin. Hanki muuttolaatikot ja pakkausmateriaalit.

## 2. Kilpailuta muuttopalvelut
Älä tyydy ensimmäiseen tarjoukseen. Muuttokoneen avulla vertailet hinnat helposti.

## 3. Muista muuttoilmoitus
Tee muuttoilmoitus Digi- ja väestötietovirastoon sekä Postiin.
      `,
      published: true,
      publishedAt: new Date(),
      categoryId: categoryTips.id,
      tags: {
        connect: [{ id: tagChecklist.id }],
      },
      featuredImage: '/images/hero/hero2.png', // Placeholder
      metaTitle: 'Onnistuneen muuton ABC | Muuttokone.fi',
      metaDescription: 'Lue vinkit onnistuneeseen muuttoon. Muuttokone auttaa sinua.',
    },
  });

  const post2 = await prisma.post.upsert({
    where: { slug: 'miten-saastaa-muuttokustannuksissa' },
    update: {
      published: true,
      publishedAt: new Date(),
    },
    create: {
      title: 'Miten säästää muuttokustannuksissa?',
      slug: 'miten-saastaa-muuttokustannuksissa',
      excerpt: 'Muutto voi olla kallis, mutta säästökeinoja löytyy.',
      content: `
# Miten säästää muuttokustannuksissa?

Muuton hinta muodostuu monesta tekijästä.

- **Ajankohta:** Viikonloput ja kuunvaihteet ovat usein kalliimpia.
- **Omatoimisuus:** Pakkaa itse ja pura itse, säästät työtunneissa.
- **Kierrätys:** Hankkiudu eroon turhasta tavarasta ennen muuttoa.

> "Hyvin suunniteltu on puoliksi tehty - ja usein halvempi."
      `,
      published: true,
      publishedAt: new Date(),
      categoryId: categoryTips.id,
      tags: {
        connect: [{ id: tagSavings.id }],
      },
      featuredImage: '/images/hero/hero3.png', // Placeholder
      metaTitle: 'Säästä muuttokustannuksissa | Muuttokone.fi',
      metaDescription: 'Vinkit edullisempaan muuttoon.',
    },
  });

  console.log('✅ Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
