#!/usr/bin/env node
/**
 * Directus Setup Script (fixed)
 * - Works with Admin static token OR admin email/password
 * - Verifies admin privileges
 * - Idempotent upserts for collections & fields
 * Run: DIRECTUS_URL=http://localhost:8055 DIRECTUS_STATIC_TOKEN=... node scripts/setup-directus.mjs
 *   or: DIRECTUS_EMAIL=admin@example.com DIRECTUS_PASSWORD=secret node scripts/setup-directus.mjs
 */

import fetch from 'node-fetch';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const STATIC_TOKEN = "CqZTKAJAeNKJBYzd6vASHXDr7KTKK0Cr" || process.env.DIRECTUS_STATIC_TOKEN;
const ADMIN_EMAIL = "alex@muuttokone.fi";
const ADMIN_PASSWORD = "titty";

let accessToken = null;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

async function loginIfNeeded() {
  if (STATIC_TOKEN) {
    accessToken = STATIC_TOKEN;
    return;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Provide either DIRECTUS_STATIC_TOKEN or DIRECTUS_EMAIL + DIRECTUS_PASSWORD');
    process.exit(1);
  }
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`❌ Login failed: ${res.status} ${res.statusText}\n${txt}`);
    process.exit(1);
  }
  const json = await res.json();
  accessToken = json?.data?.access_token;
  if (!accessToken) {
    console.error('❌ No access_token received from /auth/login');
    process.exit(1);
  }
}

async function ensureAdmin() {
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=role.name,role.admin,email`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`❌ Failed to fetch /users/me: ${res.status} ${res.statusText}\n${txt}`);
    process.exit(1);
  }
  const { data } = await res.json();
  const isAdmin = data?.role?.admin === true;
  if (!isAdmin) {
    console.error(`❌ Token does not have admin (Settings/Schema) privileges. Role: ${data?.role?.name || 'unknown'}`);
    console.error('   Use an Admin static token or admin credentials.');
    process.exit(1);
  }
}

async function api(method, endpoint, body) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`API ${method} ${endpoint} -> ${res.status} ${res.statusText}\n${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json().catch(() => ({}));
}

async function getCollection(name) {
  const res = await fetch(`${DIRECTUS_URL}/collections/${encodeURIComponent(name)}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GET /collections/${name} -> ${res.status} ${res.statusText}\n${txt}`);
  }
  const { data } = await res.json();
  return data;
}

async function upsertCollection(payload) {
  const existing = await getCollection(payload.collection);
  if (existing) {
    console.log(`   ↪ Collection ${payload.collection} exists, skipping create`);
    return existing;
  }
  console.log(`POST /collections ${payload.collection}`);
  const { data } = await api('POST', '/collections', payload);
  return data;
}

async function getField(collection, field) {
  const res = await fetch(`${DIRECTUS_URL}/fields/${encodeURIComponent(collection)}/${encodeURIComponent(field)}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GET /fields/${collection}/${field} -> ${res.status} ${res.statusText}\n${txt}`);
  }
  const { data } = await res.json();
  return data;
}

async function upsertField(collection, fieldPayload) {
  const existing = await getField(collection, fieldPayload.field);
  if (existing) {
    console.log(`      ↪ Field ${collection}.${fieldPayload.field} exists, skipping`);
    return existing;
  }
  console.log(`POST /fields/${collection} ${fieldPayload.field}`);
  const { data } = await api('POST', `/fields/${encodeURIComponent(collection)}`, fieldPayload);
  return data;
}

/** ─────────────────── Schema ─────────────────── */

const collections = {
  services: {
    collection: 'services',
    meta: {
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'published',
      singleton: false,
      icon: 'build',
    },
    schema: { name: 'services' },
    fields: [
      { field: 'id', type: 'integer', meta: { primary_key: true, auto_increment: true, readonly: true }, schema: { is_primary_key: true, auto_increment: true } },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', special: ['status'], options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'draft' } },
      { field: 'sort', type: 'integer', meta: { interface: 'input' }, schema: {} },
      { field: 'title', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'description', type: 'text', meta: { interface: 'textarea' }, schema: {} },
      { field: 'icon', type: 'uuid', meta: { interface: 'file-image', special: ['file'] }, schema: {} },
      { field: 'featured', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'pricing_from', type: 'decimal', meta: { interface: 'input' }, schema: {} },
      { field: 'pricing_unit', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'created_at', type: 'timestamp', meta: { readonly: true }, schema: {} },
      { field: 'updated_at', type: 'timestamp', meta: { readonly: true }, schema: {} },
    ],
  },

  testimonials: {
    collection: 'testimonials',
    meta: {
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'published',
      singleton: false,
      icon: 'format_quote',
    },
    fields: [
      { field: 'id', type: 'integer', meta: { primary_key: true, auto_increment: true, readonly: true }, schema: { is_primary_key: true, auto_increment: true } },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', special: ['status'], options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'draft' } },
      { field: 'sort', type: 'integer', meta: { interface: 'input' }, schema: {} },
      { field: 'name', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'role', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'company', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'content', type: 'text', meta: { interface: 'textarea', required: true }, schema: {} },
      { field: 'rating', type: 'integer', meta: { interface: 'slider', options: { min: 1, max: 5 } }, schema: { default_value: 5 } },
      { field: 'featured', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'avatar', type: 'uuid', meta: { interface: 'file-image', special: ['file'] }, schema: {} },
      { field: 'created_at', type: 'timestamp', meta: { readonly: true }, schema: {} },
    ],
  },

  leads: {
    collection: 'leads',
    meta: { icon: 'person_add' },
    fields: [
      { field: 'id', type: 'integer', meta: { primary_key: true, auto_increment: true, readonly: true }, schema: { is_primary_key: true, auto_increment: true } },
      { field: 'type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Quote', value: 'quote' }, { text: 'Contact', value: 'contact' }] } }, schema: {} },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', special: ['status'], options: { choices: [{ text: 'New', value: 'new' }, { text: 'Processing', value: 'processing' }, { text: 'Completed', value: 'completed' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'new' } },
      { field: 'name', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'email', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'phone', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'from_address', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'to_address', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'move_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
      { field: 'service_type', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'description', type: 'text', meta: { interface: 'textarea' }, schema: {} },
      { field: 'apartment_size', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'has_elevator', type: 'boolean', meta: { interface: 'boolean' }, schema: {} },
      { field: 'packing_service', type: 'boolean', meta: { interface: 'boolean' }, schema: {} },
      { field: 'created_at', type: 'timestamp', meta: { readonly: true }, schema: {} },
    ],
  },

  contacts: {
    collection: 'contacts',
    meta: { icon: 'contact_mail' },
    fields: [
      { field: 'id', type: 'integer', meta: { primary_key: true, auto_increment: true, readonly: true }, schema: { is_primary_key: true, auto_increment: true } },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', special: ['status'], options: { choices: [{ text: 'New', value: 'new' }, { text: 'Replied', value: 'replied' }, { text: 'Archived', value: 'archived' }] } }, schema: { default_value: 'new' } },
      { field: 'name', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'email', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'phone', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'subject', type: 'string', meta: { interface: 'input', required: true }, schema: {} },
      { field: 'message', type: 'text', meta: { interface: 'textarea', required: true }, schema: {} },
      { field: 'company', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'preferred_contact_method', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'marketing_consent', type: 'boolean', meta: { interface: 'boolean' }, schema: {} },
      { field: 'created_at', type: 'timestamp', meta: { readonly: true }, schema: {} },
    ],
  },
};

/** Seed data (same as yours) */
const mockData = {
  services: [
    { status: 'published', sort: 1, title: 'Kotimuutot', description: 'Kokeneet muuttomiehet huolehtivat turvallisesta ja tehokkaasta kotimuutostasi. Tarjoamme täyden palvelun pienistä yksiömuutoista suuriin talomuuttoihin.', featured: true, pricing_from: 89.00, pricing_unit: '€/h (2 miestä + auto)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { status: 'published', sort: 2, title: 'Yritysmuutot', description: 'Ammattitaitoista toimisto- ja yritysmuuttopalvelua. Minimoimme seisokkiajan ja huolehdimme kalliista IT-laitteistoista ja toimistokalusteista.', featured: true, pricing_from: 95.00, pricing_unit: '€/h (alkaen)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { status: 'published', sort: 3, title: 'Pakkauspalvelu', description: 'Säästä aikaa ja hermoja - ammattilaisemme pakkaavat kaikki omaisuutesi turvallisesti. Toimimitamme laatikot ja pakkausmateriaalit.', featured: true, pricing_from: 45.00, pricing_unit: '€/h per henkilö', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { status: 'published', sort: 4, title: 'Varastointi', description: 'Turvallinen ja kuiva varastotila tavaroillesi. Lyhyt- ja pitkäaikaista varastointia lämpimissä tiloissa Helsingin seudulla.', featured: false, pricing_from: 12.00, pricing_unit: '€/m³/kk', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { status: 'published', sort: 5, title: 'Kansainväliset muutot', description: 'Muutto Suomesta ulkomaille tai ulkomailta Suomeen. Hoidamme tulliselvitykset ja logistiikan saumattomasti.', featured: false, pricing_from: 2500.00, pricing_unit: '€ (arvio)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { status: 'published', sort: 6, title: 'Piano- ja taidesiirrot', description: 'Erikoisosaamista vaativien esineiden siirto. Flyygelit, taulut, antiikki ja muut arvokkaat esineet ammattitaitoisesti.', featured: false, pricing_from: 150.00, pricing_unit: '€ per kohde', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  testimonials: [
    { status: 'published', sort: 1, name: 'Maria Korhonen', role: 'Asiakas', company: '', content: 'Erinomainen palvelu! Muuttomiehet olivat täsmällisiä, ystävällisiä ja käsittelivät tavaroitamme huolella. Suosittelen lämpimästi.', rating: 5, featured: true, created_at: new Date().toISOString() },
    { status: 'published', sort: 2, name: 'Jukka Virtanen', role: 'Toimitusjohtaja', company: 'TechStart Oy', content: 'Yritysmuuttomme sujui mallikkaasti. IT-laitteet siirrettiin turvallisesti ja aikataulu piti täydellisesti. Kiitos ammattitaitoisesta työstä!', rating: 5, featured: true, created_at: new Date().toISOString() },
    { status: 'published', sort: 3, name: 'Anna-Liisa Mäkinen', role: 'Asiakas', company: '', content: 'Pakkauspalvelu oli kultaakin kalliimpi. Kaikki tavarat pakattiin huolellisesti ja mitään ei rikottu. Säästin valtavasti aikaa ja stressiä.', rating: 5, featured: true, created_at: new Date().toISOString() },
    { status: 'published', sort: 4, name: 'Mikael Lindberg', role: 'Perheenisä', company: '', content: 'Neljän hengen perheen muutto isosta talosta sujui vaivattomasti. Lapset pystyivät leikkimään rauhassa kun ammattilaiset hoitivat muuton.', rating: 5, featured: false, created_at: new Date().toISOString() },
    { status: 'published', sort: 5, name: 'Elina Hakkarainen', role: 'HR-päällikkö', company: 'Konsultti Partners', content: 'Toimistomme muutto valmistui etuajassa ja budjetin puitteissa. Työntekijät pystyivät jatkamaan töitä häiriöttä seuraavana päivänä.', rating: 5, featured: false, created_at: new Date().toISOString() },
  ],
};

async function createSchema() {
  console.log('\n🏗️  Creating collections & fields (idempotent)...');
  for (const [name, cfg] of Object.entries(collections)) {
    console.log(`\n📦 ${name}`);
    await upsertCollection({ collection: cfg.collection, meta: cfg.meta, schema: cfg.schema });
    console.log(`🏷️  Fields for ${name}...`);
    for (const field of cfg.fields) {
      await upsertField(cfg.collection, field);
    }
  }
}

async function seedData() {
  console.log('\n🌱 Seeding data...');
  for (const [collection, items] of Object.entries(mockData)) {
    console.log(`\n📝 ${collection}`);
    try {
      const existing = await api('GET', `/items/${collection}?limit=1`);
      if (existing?.data?.length > 0) {
        console.log(`   ↪ ${collection} already has data, skipping`);
        continue;
      }
      for (const item of items) {
        await api('POST', `/items/${collection}`, item);
      }
      console.log(`   ✅ Seeded ${items.length} items`);
    } catch (e) {
      console.error(`   ❌ Failed to seed ${collection}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Directus setup for Muuttokone…');
  console.log(`📍 ${DIRECTUS_URL}`);

  await loginIfNeeded();

  // Basic connectivity
  await api('GET', '/server/info');
  console.log('✅ Connected to Directus');

  // Verify admin (prevents 403 on schema endpoints)
  await ensureAdmin();
  console.log('🔐 Admin privileges confirmed');

  await createSchema();
  await seedData();

  console.log('\n🎉 Done!');
  console.log('   • services\n   • testimonials\n   • leads\n   • contacts');
  console.log(`\n🔧 Admin: ${DIRECTUS_URL}`);
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
