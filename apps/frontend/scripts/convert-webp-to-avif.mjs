#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const src = path.join(cwd, 'public', 'images', 'webp', 'hero', 'hero.avif');
const dest = path.join(cwd, 'public', 'images', 'webp', 'hero', 'hero.avif');

async function run() {
  if (!fs.existsSync(src)) {
    console.error('Source image not found:', src);
    process.exit(1);
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (err) {
    console.error('sharp is not installed. Install it with `npm install sharp` and re-run this script.');
    process.exit(1);
  }

  try {
    await sharp(src).avif({ quality: 60 }).toFile(dest);
    console.log('Wrote AVIF:', dest);
  } catch (err) {
    console.error('Failed to convert to AVIF:', err);
    process.exit(1);
  }
}

run();
