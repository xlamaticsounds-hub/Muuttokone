#!/usr/bin/env node

/**
 * First Run Setup for Muuttokone
 * Sets up Directus collections and seeds with beautiful data
 */

console.log('🚀 Muuttokone - First Run Setup\n');

console.log('📋 This will:');
console.log('   • Create Directus collections (services, testimonials, leads, contacts)');
console.log('   • Seed with beautiful mock data');
console.log('   • Configure proper field types and validation');
console.log('   • Make your app ready for production\n');

console.log('⚠️  Prerequisites:');
console.log('   1. Docker Compose running: docker-compose up -d');
console.log('   2. Directus accessible at http://localhost:8055');
console.log('   3. DIRECTUS_STATIC_TOKEN environment variable set\n');

console.log('🔑 Get your token at:');
console.log('   http://localhost:8055 → Settings → Project Settings → API → Static Token\n');

console.log('💻 Set token and run:');
console.log('   $env:DIRECTUS_STATIC_TOKEN="your_token_here"  # PowerShell');
console.log('   export DIRECTUS_STATIC_TOKEN="your_token_here"  # Bash');
console.log('   node scripts/setup-directus.mjs\n');

console.log('Or use the npm script:');
console.log('   cd apps/frontend && npm run setup:directus\n');

console.log('📖 See scripts/README.md for detailed instructions');
