import path from 'path';
import { defineConfig } from 'vitest/config';

// Yksikkötestit puhtaalle logiikalle (hinnoittelu, alennukset, palkkiot). Ajo: pnpm test
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
